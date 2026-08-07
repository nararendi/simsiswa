import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Mail, Lock } from 'lucide-react';

export function KelolaAdminModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      const storedAdmin = localStorage.getItem('sim_admin_cred');
      const adminCred = storedAdmin 
        ? JSON.parse(storedAdmin) 
        : { email: 'admin@gmail.com', password: 'admin123' };
      setEmail(adminCred.email);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  const handleSave = () => {
    const storedAdmin = localStorage.getItem('sim_admin_cred');
    const adminCred = storedAdmin 
      ? JSON.parse(storedAdmin) 
      : { email: 'admin@gmail.com', password: 'admin123' };

    // Validasi input
    if (!email.trim()) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Email tidak boleh kosong.' });
      return;
    }

    if (currentPassword !== adminCred.password) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Password saat ini salah.' });
      return;
    }

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        toast({ variant: 'destructive', title: 'Gagal', description: 'Konfirmasi password baru tidak cocok.' });
        return;
      }
      adminCred.password = newPassword;
    }

    adminCred.email = email;
    localStorage.setItem('sim_admin_cred', JSON.stringify(adminCred));
    toast({ title: 'Sukses', description: 'Akun Admin berhasil diperbarui!' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Pengaturan Akun Admin
          </DialogTitle>
          <DialogDescription>Perbarui email dan password login sistem.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email Admin</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                id="admin-email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-pass">Password Saat Ini (Wajib)</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                id="current-pass" 
                type="password"
                placeholder="Masukkan password saat ini untuk verifikasi"
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                className="pl-10"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 my-2 pt-2">
            <p className="text-xs text-slate-500 mb-2">Kosongkan kolom di bawah jika tidak ingin mengganti password</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-pass">Password Baru</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                id="new-pass" 
                type="password"
                placeholder="Password baru"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-pass">Konfirmasi Password Baru</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                id="confirm-pass" 
                type="password"
                placeholder="Ketik ulang password baru"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="pl-10"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave}>Simpan Perubahan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
