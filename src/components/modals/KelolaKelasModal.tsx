import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Info, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/hooks/useStudents';

export function KelolaKelasModal({
  isOpen,
  onClose,
  classes,
  students,
  updateClasses,
  syncClasses
}: {
  isOpen: boolean;
  onClose: () => void;
  classes: string[];
  students: Student[];
  updateClasses: (classes: string[]) => void;
  syncClasses: () => void;
}) {
  const { toast } = useToast();
  const [newClass, setNewClass] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const getStudentCount = (className: string) => students.filter(s => s.kelas === className).length;

  const handleAdd = () => {
    if (!newClass.trim()) return;
    const trimmed = newClass.trim();
    if (classes.includes(trimmed)) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Kelas sudah ada!' });
      return;
    }
    const newClasses = [...classes, trimmed].sort();
    updateClasses(newClasses);
    setNewClass('');
    toast({ title: 'Berhasil', description: `Kelas ${trimmed} ditambahkan.` });
  };

  const handleEditSave = (index: number) => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === classes[index]) {
      setEditingIndex(null);
      return;
    }
    if (classes.includes(trimmed)) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Nama kelas sudah digunakan!' });
      return;
    }
    
    // We update classes array. But wait, we shouldn't change the student's class here?
    // The requirement says "Kelola Kelas Modal - Edit". If we rename a class, we probably just rename the master list.
    // If we want to rename it in students too, that's complex without a DB.
    // Let's just update the class name in the master list.
    const newClasses = [...classes];
    newClasses[index] = trimmed;
    newClasses.sort();
    updateClasses(newClasses);
    setEditingIndex(null);
    toast({ title: 'Berhasil', description: 'Nama kelas diubah.' });
  };

  const handleDelete = (className: string) => {
    if (getStudentCount(className) > 0) {
      toast({ variant: 'destructive', title: 'Gagal Hapus', description: 'Masih ada siswa di kelas ini.' });
      return;
    }
    const newClasses = classes.filter(c => c !== className);
    updateClasses(newClasses);
    toast({ title: 'Berhasil', description: `Kelas ${className} dihapus.` });
  };

  const filteredClasses = classes.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Kelola Master Kelas</DialogTitle>
          <DialogDescription>
            Tambah, ubah, atau hapus kelas yang ada di sekolah.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-primary/10 text-primary p-3 rounded-md flex gap-2 items-start text-sm">
          <Info className="w-5 h-5 shrink-0" />
          <p>
            Daftar kelas juga akan otomatis tersinkronisasi (bertambah) jika ada siswa baru dengan nama kelas yang belum terdaftar.
          </p>
        </div>

        <div className="flex gap-2 mt-2">
          <Input 
            placeholder="Nama Kelas Baru (Contoh: X IPA 1)" 
            value={newClass} 
            onChange={(e) => setNewClass(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-2" /> Tambah</Button>
        </div>

        <div className="mt-4 flex flex-col gap-2 min-h-0 flex-1">
          <Input 
            placeholder="Cari kelas..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="mb-2"
          />
          
          <div className="border rounded-md flex-1 overflow-y-auto">
            {filteredClasses.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Tidak ada kelas ditemukan.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-3 font-semibold">Nama Kelas</th>
                    <th className="text-center p-3 font-semibold">Jml Siswa</th>
                    <th className="text-right p-3 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredClasses.map((c) => {
                    const originalIndex = classes.indexOf(c);
                    const isEditing = editingIndex === originalIndex;
                    const count = getStudentCount(c);
                    
                    return (
                      <tr key={c} className="hover:bg-muted/50">
                        <td className="p-3">
                          {isEditing ? (
                            <Input 
                              value={editValue} 
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 w-48"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave(originalIndex);
                                if (e.key === 'Escape') setEditingIndex(null);
                              }}
                            />
                          ) : (
                            <span className="font-medium">{c}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary">{count} Siswa</Badge>
                        </td>
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleEditSave(originalIndex)}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingIndex(null)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                                setEditingIndex(originalIndex);
                                setEditValue(c);
                              }}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-destructive" 
                                onClick={() => handleDelete(c)}
                                disabled={count > 0}
                                title={count > 0 ? "Tidak bisa dihapus, ada siswa" : "Hapus kelas"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => { syncClasses(); toast({ title: 'Sinkronisasi Berhasil' }); }}>
            Sinkronisasi Data
          </Button>
          <Button onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
