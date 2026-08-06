import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, AlertTriangle } from 'lucide-react';
import type { Student } from '@/hooks/useStudents';

export function KelulusanModal({
  isOpen,
  onClose,
  classes,
  students,
  luluskanSiswa
}: {
  isOpen: boolean;
  onClose: () => void;
  classes: string[];
  students: Student[];
  luluskanSiswa: (ids: string[]) => void;
}) {
  const { toast } = useToast();
  const [sourceClass, setSourceClass] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Try to default to a XII class
  useEffect(() => {
    if (isOpen && !sourceClass) {
      const finalClass = classes.find(c => /^XII\s/.test(c) || c.toUpperCase().includes('12'));
      if (finalClass) {
        setSourceClass(finalClass);
      }
    }
  }, [isOpen, classes, sourceClass]);

  const sourceStudents = useMemo(() => {
    return students.filter(s => s.kelas === sourceClass && s.status === 'Aktif');
  }, [students, sourceClass]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sourceStudents.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectStudent = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleExecute = () => {
    if (selectedIds.size === 0) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Pilih minimal 1 siswa' });
      return;
    }

    luluskanSiswa(Array.from(selectedIds));
    toast({ title: 'Berhasil', description: `${selectedIds.size} siswa berhasil diluluskan (Status menjadi Alumni)` });
    
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" /> Proses Kelulusan
          </DialogTitle>
          <DialogDescription>
            Ubah status siswa kelas akhir menjadi "Alumni".
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200 p-3 rounded-md flex gap-2 items-start text-sm mt-2 border border-amber-200 dark:border-amber-900/50">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>
            Perhatian: Siswa yang diluluskan akan otomatis berubah statusnya menjadi <strong>Alumni</strong>. Data mereka tetap tersimpan di sistem, namun tidak lagi muncul sebagai siswa aktif.
          </p>
        </div>

        <div className="mt-4">
          <Label>Pilih Kelas</Label>
          <Select value={sourceClass} onValueChange={(val) => {
            setSourceClass(val);
            setSelectedIds(new Set());
          }}>
            <SelectTrigger className="mt-1 w-full max-w-sm">
              <SelectValue placeholder="Pilih kelas..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 flex-1 min-h-0 flex flex-col border rounded-md overflow-hidden">
          <div className="bg-muted p-3 flex justify-between items-center border-b">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="select-all-lulus" 
                checked={sourceStudents.length > 0 && selectedIds.size === sourceStudents.length}
                onCheckedChange={handleSelectAll}
                disabled={sourceStudents.length === 0}
              />
              <Label htmlFor="select-all-lulus" className="font-semibold cursor-pointer">Pilih Semua</Label>
            </div>
            <span className="text-sm font-medium">{selectedIds.size} terpilih dari {sourceStudents.length} siswa</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {sourceClass ? (
              sourceStudents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sourceStudents.map((s) => (
                    <div key={s.id} className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-md border">
                      <Checkbox 
                        id={`sl-${s.id}`} 
                        checked={selectedIds.has(s.id)}
                        onCheckedChange={(c) => handleSelectStudent(s.id, !!c)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`sl-${s.id}`} className="font-medium truncate block cursor-pointer">
                          {s.nama}
                        </Label>
                        <div className="text-xs text-muted-foreground mt-0.5">NISN: {s.nisn}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Tidak ada siswa aktif di kelas ini.
                </div>
              )
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Silakan pilih kelas terlebih dahulu.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleExecute} className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={selectedIds.size === 0}>
            Luluskan {selectedIds.size > 0 ? `${selectedIds.size} Siswa` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
