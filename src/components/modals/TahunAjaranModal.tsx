import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TahunAjaranModal({
  isOpen,
  onClose,
  currentYear,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  currentYear: string;
  onSave: (year: string) => void;
}) {
  const [year, setYear] = useState(currentYear);

  useEffect(() => {
    if (isOpen) setYear(currentYear);
  }, [isOpen, currentYear]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pengaturan Tahun Ajaran</DialogTitle>
          <DialogDescription>Masukkan tahun ajaran aktif saat ini.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="tahunAjaran">Tahun Ajaran</Label>
          <Input 
            id="tahunAjaran" 
            value={year} 
            onChange={(e) => setYear(e.target.value)} 
            placeholder="Contoh: 2024/2025" 
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => { onSave(year); onClose(); }}>Simpan Perubahan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
