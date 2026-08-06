import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/hooks/useStudents';

const defaultStudent: Omit<Student, 'id'> = {
  nisn: '', nis: '', nik: '', nama: '', asalSekolah: '', kelas: '',
  jenisKelamin: 'Laki-laki', agama: 'Islam', kotaLahir: '', tanggalLahir: '',
  hpSiswa: '', status: 'Aktif',
  alamat: '', rt: '', rw: '', kelurahan: '', kecamatan: '', kodePos: '',
  noKk: '',
  namaAyah: '', nikAyah: '', thnLahirAyah: '', pendidikanAyah: '', pekerjaanAyah: '', penghasilanAyah: '', hpAyah: '',
  namaIbu: '', nikIbu: '', thnLahirIbu: '', pendidikanIbu: '', pekerjaanIbu: '', penghasilanIbu: '', hpIbu: '',
  tinggiBadan: '', beratBadan: '', anakKe: '', jumlahSaudara: '', golDarah: '-'
};

export function StudentFormModal({
  isOpen,
  onClose,
  initialData,
  onSave,
  classes
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Student | null;
  onSave: (data: Omit<Student, 'id'>) => void;
  classes: string[];
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pribadi');
  const [formData, setFormData] = useState<Omit<Student, 'id'>>(defaultStudent);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('pribadi');
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData(defaultStudent);
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof Omit<Student, 'id'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.nama || !formData.nisn) {
      toast({ variant: 'destructive', title: 'Validasi Gagal', description: 'Nama Lengkap dan NISN wajib diisi.' });
      setActiveTab('pribadi');
      return;
    }
    onSave(formData);
    onClose();
  };

  const tabs = ['pribadi', 'alamat', 'ortu', 'fisik'];
  const handleNext = () => {
    const idx = tabs.indexOf(activeTab);
    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
  };
  const handlePrev = () => {
    const idx = tabs.indexOf(activeTab);
    if (idx > 0) setActiveTab(tabs[idx - 1]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30 shrink-0">
          <DialogTitle>{initialData ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}</DialogTitle>
          <DialogDescription>
            Isi formulir pendaftaran secara lengkap dan benar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-6 sticky top-0 z-10 bg-background/95 backdrop-blur">
              <TabsTrigger value="pribadi">1. Data Pribadi</TabsTrigger>
              <TabsTrigger value="alamat">2. Alamat</TabsTrigger>
              <TabsTrigger value="ortu">3. Orang Tua & KK</TabsTrigger>
              <TabsTrigger value="fisik">4. Fisik & Periodik</TabsTrigger>
            </TabsList>

            <TabsContent value="pribadi" className="space-y-4 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
                  <Input value={formData.nama} onChange={e => handleChange('nama', e.target.value)} placeholder="Sesuai Akte Kelahiran" />
                </div>
                
                <div className="space-y-2">
                  <Label>NISN <span className="text-destructive">*</span></Label>
                  <Input value={formData.nisn} onChange={e => handleChange('nisn', e.target.value)} maxLength={10} placeholder="10 Digit Nomor Unik" />
                </div>
                <div className="space-y-2">
                  <Label>NIS</Label>
                  <Input value={formData.nis} onChange={e => handleChange('nis', e.target.value)} placeholder="Nomor Induk Sekolah" />
                </div>
                
                <div className="space-y-2">
                  <Label>NIK</Label>
                  <Input value={formData.nik} onChange={e => handleChange('nik', e.target.value)} maxLength={16} placeholder="16 Digit NIK" />
                </div>
                <div className="space-y-2">
                  <Label>Kelas</Label>
                  <div className="relative">
                    <Input 
                      value={formData.kelas} 
                      onChange={e => handleChange('kelas', e.target.value)} 
                      placeholder="Contoh: X IPA 1"
                      list="class-options"
                    />
                    <datalist id="class-options">
                      {classes.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Jenis Kelamin</Label>
                  <Select value={formData.jenisKelamin} onValueChange={v => handleChange('jenisKelamin', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Agama</Label>
                  <Select value={formData.agama} onValueChange={v => handleChange('agama', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Islam">Islam</SelectItem>
                      <SelectItem value="Kristen Protestan">Kristen Protestan</SelectItem>
                      <SelectItem value="Katolik">Katolik</SelectItem>
                      <SelectItem value="Hindu">Hindu</SelectItem>
                      <SelectItem value="Buddha">Buddha</SelectItem>
                      <SelectItem value="Khonghucu">Khonghucu</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tempat Lahir</Label>
                  <Input value={formData.kotaLahir} onChange={e => handleChange('kotaLahir', e.target.value)} placeholder="Kota Lahir" />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Lahir</Label>
                  <Input type="date" value={formData.tanggalLahir} onChange={e => handleChange('tanggalLahir', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>No HP Siswa</Label>
                  <Input value={formData.hpSiswa} onChange={e => handleChange('hpSiswa', e.target.value)} placeholder="Contoh: 0812..." />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => handleChange('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Alumni">Alumni</SelectItem>
                      <SelectItem value="Pindah">Pindah</SelectItem>
                      <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label>Asal Sekolah</Label>
                  <Input value={formData.asalSekolah} onChange={e => handleChange('asalSekolah', e.target.value)} placeholder="Sekolah Sebelumnya" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="alamat" className="space-y-4 outline-none">
              <div className="space-y-2">
                <Label>Alamat Jalan / Dusun</Label>
                <Textarea value={formData.alamat} onChange={e => handleChange('alamat', e.target.value)} placeholder="Nama jalan, blok, rt, rw..." rows={3} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>RT</Label>
                  <Input value={formData.rt} onChange={e => handleChange('rt', e.target.value)} placeholder="001" maxLength={3} />
                </div>
                <div className="space-y-2">
                  <Label>RW</Label>
                  <Input value={formData.rw} onChange={e => handleChange('rw', e.target.value)} placeholder="002" maxLength={3} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Kode Pos</Label>
                  <Input value={formData.kodePos} onChange={e => handleChange('kodePos', e.target.value)} placeholder="12345" maxLength={5} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kelurahan / Desa</Label>
                  <Input value={formData.kelurahan} onChange={e => handleChange('kelurahan', e.target.value)} placeholder="Nama Kelurahan" />
                </div>
                <div className="space-y-2">
                  <Label>Kecamatan</Label>
                  <Input value={formData.kecamatan} onChange={e => handleChange('kecamatan', e.target.value)} placeholder="Nama Kecamatan" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ortu" className="space-y-6 outline-none">
              <div className="space-y-2">
                <Label>No Kartu Keluarga (KK)</Label>
                <Input value={formData.noKk} onChange={e => handleChange('noKk', e.target.value)} maxLength={16} placeholder="16 Digit No KK" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-md bg-muted/10 space-y-4">
                  <h4 className="font-semibold border-b pb-2">Data Ayah</h4>
                  <div className="space-y-2"><Label>Nama Ayah</Label><Input value={formData.namaAyah} onChange={e => handleChange('namaAyah', e.target.value)} /></div>
                  <div className="space-y-2"><Label>NIK Ayah</Label><Input value={formData.nikAyah} onChange={e => handleChange('nikAyah', e.target.value)} maxLength={16} /></div>
                  <div className="space-y-2"><Label>Tahun Lahir</Label><Input value={formData.thnLahirAyah} onChange={e => handleChange('thnLahirAyah', e.target.value)} placeholder="YYYY" maxLength={4} /></div>
                  <div className="space-y-2">
                    <Label>Pendidikan</Label>
                    <Select value={formData.pendidikanAyah} onValueChange={v => handleChange('pendidikanAyah', v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SD Sederajat">SD Sederajat</SelectItem>
                        <SelectItem value="SMP Sederajat">SMP Sederajat</SelectItem>
                        <SelectItem value="SMA Sederajat">SMA Sederajat</SelectItem>
                        <SelectItem value="D1-D3">D1-D3</SelectItem>
                        <SelectItem value="S1">S1</SelectItem>
                        <SelectItem value="S2/S3">S2/S3</SelectItem>
                        <SelectItem value="Tidak Sekolah">Tidak Sekolah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Pekerjaan</Label><Input value={formData.pekerjaanAyah} onChange={e => handleChange('pekerjaanAyah', e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Penghasilan Bulanan</Label>
                    <Select value={formData.penghasilanAyah} onValueChange={v => handleChange('penghasilanAyah', v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tidak Berpenghasilan">Tidak Berpenghasilan</SelectItem>
                        <SelectItem value="< 1 Juta">&lt; 1 Juta</SelectItem>
                        <SelectItem value="1 - 3 Juta">1 - 3 Juta</SelectItem>
                        <SelectItem value="3 - 5 Juta">3 - 5 Juta</SelectItem>
                        <SelectItem value="5 - 10 Juta">5 - 10 Juta</SelectItem>
                        <SelectItem value="> 10 Juta">&gt; 10 Juta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>No HP Ayah</Label><Input value={formData.hpAyah} onChange={e => handleChange('hpAyah', e.target.value)} /></div>
                </div>

                <div className="p-4 border rounded-md bg-muted/10 space-y-4">
                  <h4 className="font-semibold border-b pb-2">Data Ibu</h4>
                  <div className="space-y-2"><Label>Nama Ibu</Label><Input value={formData.namaIbu} onChange={e => handleChange('namaIbu', e.target.value)} /></div>
                  <div className="space-y-2"><Label>NIK Ibu</Label><Input value={formData.nikIbu} onChange={e => handleChange('nikIbu', e.target.value)} maxLength={16} /></div>
                  <div className="space-y-2"><Label>Tahun Lahir</Label><Input value={formData.thnLahirIbu} onChange={e => handleChange('thnLahirIbu', e.target.value)} placeholder="YYYY" maxLength={4} /></div>
                  <div className="space-y-2">
                    <Label>Pendidikan</Label>
                    <Select value={formData.pendidikanIbu} onValueChange={v => handleChange('pendidikanIbu', v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SD Sederajat">SD Sederajat</SelectItem>
                        <SelectItem value="SMP Sederajat">SMP Sederajat</SelectItem>
                        <SelectItem value="SMA Sederajat">SMA Sederajat</SelectItem>
                        <SelectItem value="D1-D3">D1-D3</SelectItem>
                        <SelectItem value="S1">S1</SelectItem>
                        <SelectItem value="S2/S3">S2/S3</SelectItem>
                        <SelectItem value="Tidak Sekolah">Tidak Sekolah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Pekerjaan</Label><Input value={formData.pekerjaanIbu} onChange={e => handleChange('pekerjaanIbu', e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Penghasilan Bulanan</Label>
                    <Select value={formData.penghasilanIbu} onValueChange={v => handleChange('penghasilanIbu', v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tidak Berpenghasilan">Tidak Berpenghasilan</SelectItem>
                        <SelectItem value="< 1 Juta">&lt; 1 Juta</SelectItem>
                        <SelectItem value="1 - 3 Juta">1 - 3 Juta</SelectItem>
                        <SelectItem value="3 - 5 Juta">3 - 5 Juta</SelectItem>
                        <SelectItem value="5 - 10 Juta">5 - 10 Juta</SelectItem>
                        <SelectItem value="> 10 Juta">&gt; 10 Juta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>No HP Ibu</Label><Input value={formData.hpIbu} onChange={e => handleChange('hpIbu', e.target.value)} /></div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fisik" className="space-y-4 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tinggi Badan (cm)</Label>
                  <Input value={formData.tinggiBadan} onChange={e => handleChange('tinggiBadan', e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Berat Badan (kg)</Label>
                  <Input value={formData.beratBadan} onChange={e => handleChange('beratBadan', e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Anak Ke-</Label>
                  <Input value={formData.anakKe} onChange={e => handleChange('anakKe', e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Jumlah Saudara Kandung</Label>
                  <Input value={formData.jumlahSaudara} onChange={e => handleChange('jumlahSaudara', e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Golongan Darah</Label>
                  <Select value={formData.golDarah} onValueChange={v => handleChange('golDarah', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">Tidak Tahu (-)</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="O">O</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0 flex justify-between items-center w-full">
          <div>
            {activeTab !== 'pribadi' && <Button variant="outline" onClick={handlePrev}>Sebelumnya</Button>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            {activeTab !== 'fisik' ? (
              <Button onClick={handleNext}>Selanjutnya</Button>
            ) : (
              <Button onClick={handleSave}>Simpan Data</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
