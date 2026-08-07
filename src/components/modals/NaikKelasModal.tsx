import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Info, Lock } from 'lucide-react';
import type { Student } from '@/hooks/useStudents';

export function NaikKelasModal({
  isOpen,
  onClose,
  classes,
  students,
  pindahKelas,
  suggestNextClass
}: {
  isOpen: boolean;
  onClose: () => void;
  classes: string[];
  students: Student[];
  pindahKelas: (ids: string[], targetClass: string) => void;
  suggestNextClass: (c: string) => string;
}) {
  const { toast } = useToast();
  
  // State for rows
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [targetClassesMap, setTargetClassesMap] = useState<Record<string, string>>({});

  // Get active classes and their student counts
  const classStats = useMemo(() => {
    const stats: Record<string, number> = {};
    students.filter(s => s.status === 'Aktif').forEach(s => {
      if (!s.kelas) return;
      stats[s.kelas] = (stats[s.kelas] || 0) + 1;
    });
    
    // Sort by name
    return Object.entries(stats).map(([className, count]) => ({
      className,
      count,
      isFinal: /^XII\s/.test(className) || className.toUpperCase().includes('12') || className.toUpperCase().includes('XII')
    })).sort((a, b) => a.className.localeCompare(b.className));
  }, [students]);

  useEffect(() => {
    if (isOpen) {
      setSelectedClasses(new Set());
      const initialMap: Record<string, string> = {};
      classStats.forEach(stat => {
        initialMap[stat.className] = suggestNextClass(stat.className);
      });
      setTargetClassesMap(initialMap);
    }
  }, [isOpen, classStats, suggestNextClass]);

  const handleExecute = () => {
    const selectedList = Array.from(selectedClasses);
    if (selectedList.length === 0) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Pilih minimal 1 kelas untuk dinaikkan' });
      return;
    }

    let successCount = 0;
    
    selectedList.forEach(cName => {
      const target = targetClassesMap[cName];
      if (target && target.trim()) {
        const studentIds = students.filter(s => s.status === 'Aktif' && s.kelas === cName).map(s => s.id);
        if (studentIds.length > 0) {
          pindahKelas(studentIds, target.trim());
          successCount += studentIds.length;
        }
      }
    });

    toast({ title: 'Proses Selesai', description: `${successCount} siswa berhasil dinaikkan kelas.` });
    onClose();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClasses(new Set(classStats.filter(c => !c.isFinal).map(c => c.className)));
    } else {
      setSelectedClasses(new Set());
    }
  };

  const handleSelect = (cName: string, checked: boolean) => {
    const newSet = new Set(selectedClasses);
    if (checked) newSet.add(cName);
    else newSet.delete(cName);
    setSelectedClasses(newSet);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Proses Naik Kelas</DialogTitle>
          <DialogDescription>
            Naikkan kelas seluruh siswa secara massal untuk tahun ajaran baru.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-primary/10 text-primary p-3 rounded-md flex gap-2 items-start text-sm mt-2">
          <Info className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Informasi:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Sistem mencoba mendeteksi pola kelas otomatis (X → XI, XI → XII).</li>
              <li>Silakan ubah nama kelas tujuan jika deteksi otomatis kurang tepat.</li>
              <li>Kelas tingkat akhir (XII) dikunci. Gunakan menu <strong>Kelulusan</strong> untuk meluluskan siswa tingkat akhir.</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto border rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="p-3 w-12 text-center border-b">
                  <Checkbox 
                    checked={selectedClasses.size > 0 && classStats.filter(c => !c.isFinal).every(c => selectedClasses.has(c.className))}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="text-left p-3 font-semibold border-b">Kelas Saat Ini</th>
                <th className="text-center p-3 font-semibold border-b">Jumlah Siswa</th>
                <th className="text-left p-3 font-semibold border-b">Naik Ke Kelas Tujuan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {classStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">Tidak ada data kelas dengan siswa aktif.</td>
                </tr>
              ) : (
                classStats.map((stat) => (
                  <tr key={stat.className} className={`hover:bg-muted/50 ${stat.isFinal ? 'bg-muted/30 opacity-70' : ''}`}>
                    <td className="p-3 text-center">
                      <Checkbox 
                        checked={selectedClasses.has(stat.className)}
                        onCheckedChange={(c) => handleSelect(stat.className, !!c)}
                        disabled={stat.isFinal}
                      />
                    </td>
                    <td className="p-3 font-medium">{stat.className}</td>
                    <td className="p-3 text-center">{stat.count}</td>
                    <td className="p-3">
                      {stat.isFinal ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-xs italic">
                          <Lock className="w-3 h-3" /> Tingkat akhir (Gunakan menu Kelulusan)
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2 items-center max-w-md">
                          {/* Dropdown Pilihan Kelas Registered */}
                          <select
                            className="h-8 text-xs border rounded-md px-2 bg-background w-full sm:w-44 focus:outline-none focus:ring-1 focus:ring-primary"
                            value={classes.includes(targetClassesMap[stat.className]) ? targetClassesMap[stat.className] : (targetClassesMap[stat.className] ? 'custom' : '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val !== 'custom' && val !== '') {
                                setTargetClassesMap(prev => ({...prev, [stat.className]: val}));
                              }
                            }}
                          >
                            <option value="">-- Pilih Kelas --</option>
                            {suggestNextClass(stat.className) && !classes.includes(suggestNextClass(stat.className)) && (
                              <option value={suggestNextClass(stat.className)}>
                                ✨ {suggestNextClass(stat.className)} (Rekomendasi)
                              </option>
                            )}
                            {classes.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                            <option value="custom">✍️ Ketik Nama Baru...</option>
                          </select>

                          {/* Input manual untuk mengetik / mengedit nama kelas */}
                          <Input 
                            value={targetClassesMap[stat.className] || ''}
                            onChange={(e) => setTargetClassesMap(prev => ({...prev, [stat.className]: e.target.value}))}
                            className="h-8 text-xs flex-1"
                            placeholder="Ketik/sesuaikan kelas..."
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleExecute} disabled={selectedClasses.size === 0}>
            Proses Naik Kelas ({selectedClasses.size} Kelas)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
