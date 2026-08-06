import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight } from 'lucide-react';
import type { Student } from '@/hooks/useStudents';

export function PindahKelasModal({
  isOpen,
  onClose,
  classes,
  students,
  pindahKelas
}: {
  isOpen: boolean;
  onClose: () => void;
  classes: string[];
  students: Student[];
  pindahKelas: (ids: string[], targetClass: string) => void;
}) {
  const { toast } = useToast();
  const [sourceClass, setSourceClass] = useState<string>('');
  const [targetClass, setTargetClass] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    if (!targetClass) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Pilih kelas tujuan' });
      return;
    }
    if (sourceClass === targetClass) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Kelas tujuan tidak boleh sama dengan kelas asal' });
      return;
    }

    pindahKelas(Array.from(selectedIds), targetClass);
    toast({ title: 'Berhasil', description: `${selectedIds.size} siswa dipindahkan ke kelas ${targetClass}` });
    
    // Reset state and close
    setSelectedIds(new Set());
    setSourceClass('');
    setTargetClass('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pindah Kelas</DialogTitle>
          <DialogDescription>
            Pindahkan satu atau beberapa siswa aktif dari satu kelas ke kelas lainnya.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end mt-4">
          <div className="space-y-2">
            <Label>Dari Kelas (Asal)</Label>
            <Select value={sourceClass} onValueChange={(val) => {
              setSourceClass(val);
              setSelectedIds(new Set());
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas asal" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="hidden md:flex pb-2 justify-center">
            <ArrowRight className="text-muted-foreground w-6 h-6" />
          </div>

          <div className="space-y-2">
            <Label>Ke Kelas (Tujuan)</Label>
            <Select value={targetClass} onValueChange={setTargetClass}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas tujuan" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex-1 min-h-0 flex flex-col border rounded-md overflow-hidden">
          <div className="bg-muted p-3 flex justify-between items-center border-b">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="select-all-pindah" 
                checked={sourceStudents.length > 0 && selectedIds.size === sourceStudents.length}
                onCheckedChange={handleSelectAll}
                disabled={sourceStudents.length === 0}
              />
              <Label htmlFor="select-all-pindah" className="font-semibold cursor-pointer">Pilih Semua</Label>
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
                        id={`s-${s.id}`} 
                        checked={selectedIds.has(s.id)}
                        onCheckedChange={(c) => handleSelectStudent(s.id, !!c)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`s-${s.id}`} className="font-medium truncate block cursor-pointer">
                          {s.nama}
                        </Label>
                        <div className="text-xs text-muted-foreground mt-0.5">NISN: {s.nisn} • {s.jenisKelamin}</div>
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
                Silakan pilih kelas asal terlebih dahulu.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleExecute} disabled={selectedIds.size === 0 || !targetClass || sourceClass === targetClass}>
            Pindahkan {selectedIds.size > 0 ? `${selectedIds.size} Siswa` : 'Siswa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
