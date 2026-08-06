import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import type { Student } from '@/hooks/useStudents';

export function StudentDetailModal({
  isOpen,
  onClose,
  student
}: {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}) {
  if (!student) return null;

  const handlePrint = () => {
    // Print logic - usually we'd open a new window or trigger browser print
    window.print();
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="font-semibold text-primary border-b border-primary/20 pb-1 mb-3 mt-6 uppercase tracking-wider text-sm">{title}</h3>
  );

  const DataRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col sm:flex-row py-1 border-b border-muted/50 last:border-0">
      <span className="text-muted-foreground sm:w-1/3 text-sm">{label}</span>
      <span className="font-medium sm:w-2/3 text-sm">{value || '-'}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Detail Profil Siswa</DialogTitle>
              <DialogDescription>
                Informasi lengkap rekam jejak siswa.
              </DialogDescription>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" /> Cetak
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 pb-8 print-section">
          {/* Print header visible only on print */}
          <div className="hidden print:block text-center mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold uppercase">Biodata Siswa</h1>
            <p>Sistem Informasi Manajemen Data Siswa</p>
          </div>

          <SectionTitle title="A. Data Pribadi" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            <DataRow label="Nama Lengkap" value={student.nama} />
            <DataRow label="Jenis Kelamin" value={student.jenisKelamin} />
            <DataRow label="NISN" value={student.nisn} />
            <DataRow label="NIS" value={student.nis} />
            <DataRow label="NIK" value={student.nik} />
            <DataRow label="Kelas" value={student.kelas} />
            <DataRow label="Status" value={student.status} />
            <DataRow label="Asal Sekolah" value={student.asalSekolah} />
            <DataRow label="Tempat, Tanggal Lahir" value={`${student.kotaLahir}, ${student.tanggalLahir}`} />
            <DataRow label="Agama" value={student.agama} />
            <DataRow label="No. Handphone" value={student.hpSiswa} />
          </div>

          <SectionTitle title="B. Alamat Siswa" />
          <div className="grid grid-cols-1 gap-y-1">
            <DataRow label="Alamat Jalan" value={student.alamat} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
              <DataRow label="RT / RW" value={`${student.rt} / ${student.rw}`} />
              <DataRow label="Kode Pos" value={student.kodePos} />
              <DataRow label="Kelurahan / Desa" value={student.kelurahan} />
              <DataRow label="Kecamatan" value={student.kecamatan} />
            </div>
          </div>

          <SectionTitle title="C. Data Orang Tua / Wali" />
          <div className="mb-2">
            <DataRow label="Nomor Kartu Keluarga" value={student.noKk} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="bg-muted/20 p-4 rounded-md border">
              <h4 className="font-semibold text-sm mb-3">Data Ayah</h4>
              <DataRow label="Nama Ayah" value={student.namaAyah} />
              <DataRow label="NIK" value={student.nikAyah} />
              <DataRow label="Tahun Lahir" value={student.thnLahirAyah} />
              <DataRow label="Pendidikan" value={student.pendidikanAyah} />
              <DataRow label="Pekerjaan" value={student.pekerjaanAyah} />
              <DataRow label="Penghasilan" value={student.penghasilanAyah} />
              <DataRow label="No HP" value={student.hpAyah} />
            </div>
            <div className="bg-muted/20 p-4 rounded-md border">
              <h4 className="font-semibold text-sm mb-3">Data Ibu</h4>
              <DataRow label="Nama Ibu" value={student.namaIbu} />
              <DataRow label="NIK" value={student.nikIbu} />
              <DataRow label="Tahun Lahir" value={student.thnLahirIbu} />
              <DataRow label="Pendidikan" value={student.pendidikanIbu} />
              <DataRow label="Pekerjaan" value={student.pekerjaanIbu} />
              <DataRow label="Penghasilan" value={student.penghasilanIbu} />
              <DataRow label="No HP" value={student.hpIbu} />
            </div>
          </div>

          <SectionTitle title="D. Data Fisik & Keluarga" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            <DataRow label="Tinggi Badan (cm)" value={student.tinggiBadan} />
            <DataRow label="Berat Badan (kg)" value={student.beratBadan} />
            <DataRow label="Golongan Darah" value={student.golDarah} />
            <DataRow label="Anak Ke" value={student.anakKe} />
            <DataRow label="Jumlah Saudara Kandung" value={student.jumlahSaudara} />
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-muted/10 print:hidden">
          <Button onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}} />
    </Dialog>
  );
}
