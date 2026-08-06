import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  studentName,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Konfirmasi Hapus Data</DialogTitle>
          <DialogDescription>
            Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-foreground">
            Apakah Anda yakin ingin menghapus data siswa bernama <span className="font-bold">{studentName}</span>?
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>Hapus Data</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
