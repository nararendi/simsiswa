import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, UserMinus } from 'lucide-react';

const ALASAN_OPTIONS = [
  { value: 'Mutasi', label: 'Mutasi (Pindah Dalam Kota)' },
  { value: 'Pindah Sekolah', label: 'Pindah Sekolah (Luar Kota)' },
  { value: 'Meninggal Dunia', label: 'Meninggal Dunia' },
  { value: 'Dikeluarkan', label: 'Dikeluarkan / Drop Out' },
  { value: 'Lainnya', label: 'Lainnya' },
];

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  studentName,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  onConfirm: (alasan: string, tanggal: string) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [alasan, setAlasan] = useState('');
  const [tanggal, setTanggal] = useState(today);

  // Reset saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setAlasan('');
      setTanggal(today);
    }
  }, [isOpen, today]);

  const handleConfirm = () => {
    if (!alasan) return;
    onConfirm(alasan, tanggal);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <UserMinus className="w-5 h-5" />
            Non-Aktifkan Siswa
          </DialogTitle>
          <DialogDescription>
            Siswa tidak akan dihapus dari database, melainkan dipindahkan ke daftar <strong>Non-Aktif</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info Siswa */}
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <p className="text-sm text-rose-800">
              Anda akan me-non-aktifkan siswa: <span className="font-bold">{studentName}</span>
            </p>
          </div>

          {/* Alasan Keluar */}
          <div className="space-y-2">
            <Label htmlFor="alasan-keluar" className="font-medium">
              Alasan Keluar <span className="text-destructive">*</span>
            </Label>
            <Select value={alasan} onValueChange={setAlasan}>
              <SelectTrigger id="alasan-keluar">
                <SelectValue placeholder="Pilih alasan keluar..." />
              </SelectTrigger>
              <SelectContent>
                {ALASAN_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tanggal Keluar */}
          <div className="space-y-2">
            <Label htmlFor="tanggal-keluar" className="font-medium">Tanggal Keluar</Label>
            <Input
              id="tanggal-keluar"
              type="date"
              value={tanggal}
              onChange={e => setTanggal(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!alasan}
            className="gap-2"
          >
            <UserMinus className="w-4 h-4" />
            Non-Aktifkan Siswa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
