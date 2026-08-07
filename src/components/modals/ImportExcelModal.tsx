import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, ListFilter } from 'lucide-react';

export function ImportExcelModal({
  isOpen,
  onClose,
  sheetNames,
  onImport
}: {
  isOpen: boolean;
  onClose: () => void;
  sheetNames: string[];
  onImport: (sheetName: string) => void;
}) {
  const [selectedSheet, setSelectedSheet] = useState('');

  useEffect(() => {
    if (isOpen && sheetNames.length > 0) {
      setSelectedSheet(sheetNames[0]);
    }
  }, [isOpen, sheetNames]);

  const handleImport = () => {
    if (!selectedSheet) return;
    onImport(selectedSheet);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Pilih Sheet Excel
          </DialogTitle>
          <DialogDescription>
            File Excel yang Anda masukkan memiliki beberapa sheet. Silakan pilih salah satu untuk di-impor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <Label htmlFor="sheet-select" className="font-medium flex items-center gap-1.5 text-slate-700">
              <ListFilter className="w-4 h-4 text-slate-400" />
              Nama Sheet
            </Label>
            <Select value={selectedSheet} onValueChange={setSelectedSheet}>
              <SelectTrigger id="sheet-select">
                <SelectValue placeholder="Pilih sheet..." />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {sheetNames.map(name => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleImport} disabled={!selectedSheet} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Mulai Impor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
