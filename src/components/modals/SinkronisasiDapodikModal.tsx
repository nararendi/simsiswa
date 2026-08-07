import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Key, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Definisi interface raw data dari Dapodik Web Service
interface DapodikPesertaDidik {
  nisn: string;
  nama: string;
  jenis_kelamin: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat_jalan: string;
  nama_ayah: string;
  nama_ibu: string;
  nama_wali: string;
  nama_kelas: string;
  tahun_masuk: string;
  status?: string | null;
  [key: string]: any; // Allow any other columns returned by Dapodik
}

export function SinkronisasiDapodikModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [token, setToken] = useState(() => localStorage.getItem('dapodik_token') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    success: boolean;
    added: number;
    updated: number;
    failed: number;
    message: string;
  } | null>(null);

  const handleSync = async () => {
    if (!token.trim()) {
      toast({
        variant: 'destructive',
        title: 'Token Kosong',
        description: 'Silakan masukkan token Web Service Dapodik terlebih dahulu.',
      });
      return;
    }

    setIsLoading(true);
    setSyncStatus(null);
    localStorage.setItem('dapodik_token', token.trim());

    try {
      // 1. Ambil data dari Web Service Dapodik lokal (via Vite proxy untuk menghindari CORS)
      // URL: /api/dapodik/rest/PesertaDidik → proxy ke http://localhost:5774/rest/PesertaDidik
      let response: Response;
      try {
        response = await fetch('/api/dapodik/rest/PesertaDidik', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token.trim()}`,
            'X-Auth-Token': token.trim(),   // beberapa versi Dapodik pakai header ini
            'token': token.trim(),
            'Accept': 'application/json',
          },
        });
      } catch (networkErr: any) {
        throw new Error(
          `Tidak dapat terhubung ke Dapodik lokal (port 5774). ` +
          `Pastikan aplikasi Dapodik sedang berjalan di komputer ini. ` +
          `Detail: ${networkErr.message}`
        );
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(
          `Dapodik menolak permintaan (HTTP ${response.status}: ${response.statusText}). ` +
          `${errText ? 'Pesan: ' + errText.slice(0, 200) : ''} ` +
          `Periksa apakah token Web Service Anda masih valid.`
        );
      }

      // Parse response — Dapodik bisa mengembalikan array langsung ATAU object {data:[...]}
      let rawData: DapodikPesertaDidik[];
      try {
        const parsed = await response.json();
        if (Array.isArray(parsed)) {
          rawData = parsed;
        } else if (parsed && Array.isArray(parsed.data)) {
          rawData = parsed.data;
        } else if (parsed && Array.isArray(parsed.rows)) {
          rawData = parsed.rows;
        } else {
          console.warn('Format response Dapodik tidak dikenal:', parsed);
          rawData = [];
        }
      } catch {
        throw new Error('Response dari Dapodik bukan format JSON yang valid.');
      }

      if (rawData.length === 0) {
        throw new Error('Data peserta didik dari Dapodik kosong. Mungkin belum ada siswa terdaftar di Dapodik lokal.');
      }

      let addedCount = 0;
      let updatedCount = 0;
      let failedCount = 0;

      // 2. Siapkan semua data, lalu batch upsert ke Supabase
      const batchData = rawData
        .filter(item => item.nisn && item.nisn.trim()) // Lewati jika NISN kosong
        .map(item => {
          const namaLengkap = item.nama || '';
          
          // Parsing status Dapodik secara cerdas:
          // Jika status kosong/tidak diset, default ke 'Aktif'.
          // Jika secara eksplisit berisi indikator tidak aktif, set ke 'Non-Aktif'.
          let statusSiswa = 'Aktif';
          if (item.status !== undefined && item.status !== null) {
            const statusStr = String(item.status).trim().toLowerCase();
            if (statusStr === '0' || statusStr === 'tidak aktif' || statusStr === 'non-aktif' || statusStr === 'non aktif' || statusStr === 'keluar' || statusStr === 'lulus') {
              statusSiswa = 'Non-Aktif';
            }
          }

          // Kumpulkan semua kolom informasi lengkap dari Dapodik
          return {
            nisn:                item.nisn.trim(),
            nama:                namaLengkap,          // kolom lama (NOT NULL) — wajib diisi
            nama_lengkap:        namaLengkap,          // kolom baru
            jenis_kelamin:       item.jenis_kelamin === 'P' || item.jenis_kelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
            tempat_lahir:        item.tempat_lahir || item.kota_lahir || null,
            tanggal_lahir:       item.tanggal_lahir || null,
            alamat:              item.alamat_jalan || item.alamat || null,
            nama_ayah:           item.nama_ayah || null,
            nama_ibu:            item.nama_ibu || item.nama_ibu_kandung || null,
            nama_wali:           item.nama_wali || null,
            kelas:               item.nama_kelas || item.kelas || null,
            tahun_masuk:         item.tahun_masuk || null,
            status_siswa:        statusSiswa,          // kolom yang ada di tabel
            synced_from_dapodik: true,

            // Informasi periodik & data tambahan
            nis:                 item.nipd || item.nis || item.nomor_induk || null,
            nik:                 item.nik || item.no_identitas || null,
            asal_sekolah:        item.sekolah_asal || item.asal_sekolah || null,
            agama:               item.agama || item.agama_id_str || 'Islam',
            no_hp:               item.nomor_telepon_seluler || item.no_hp || item.hp || null,
            rt:                  item.rt ? String(item.rt) : null,
            rw:                  item.rw ? String(item.rw) : null,
            kelurahan:           item.desa_kelurahan || item.kelurahan || null,
            kecamatan:           item.kecamatan || null,
            kode_pos:            item.kode_pos || null,
            no_kk:               item.no_kk || item.nomor_kk || null,
            nik_ayah:            item.nik_ayah || null,
            nik_ibu:             item.nik_ibu || item.nik_ibu_kandung || null,
            tinggi_badan:        item.tinggi_badan ? String(item.tinggi_badan) : null,
            berat_badan:         item.berat_badan ? String(item.berat_badan) : null,
            anak_ke:             item.anak_ke ? String(item.anak_ke) : null,
            jumlah_saudara:      item.jumlah_saudara ? String(item.jumlah_saudara) : null,
            gol_darah:           item.golongan_darah || item.gol_darah || null,
          };
        });

      failedCount = rawData.length - batchData.length; // yang tidak punya NISN

      try {
        // Upsert: Insert jika NISN belum ada, Update jika sudah ada
        const { data: upsertResult, error: upsertError } = await supabase
          .from('siswa')
          .upsert(batchData, {
            onConflict: 'nisn',         // conflict key: kolom NISN (UNIQUE)
            ignoreDuplicates: false,    // false = update jika duplikat
          })
          .select('id, nisn');

        if (upsertError) throw upsertError;

        // Hitung berapa yang baru vs update (estimasi dari hasil)
        addedCount = upsertResult?.length ?? batchData.length;
        updatedCount = batchData.length - addedCount;
        if (updatedCount < 0) updatedCount = 0;

      } catch (dbErr: any) {
        console.error('Batch upsert gagal:', dbErr);
        throw new Error(`Gagal menyimpan ke database: ${dbErr.message}`);
      }

      setSyncStatus({
        success: true,
        added: addedCount,
        updated: updatedCount,
        failed: failedCount,
        message: `Sinkronisasi berhasil! ${addedCount} data baru ditambahkan, ${updatedCount} diperbarui.`,
      });

      if (onSuccess) onSuccess();

    } catch (err: any) {
      console.error('Proses Sinkronisasi Dapodik Gagal:', err);
      setSyncStatus({
        success: false,
        added: 0,
        updated: 0,
        failed: 0,
        message: err.message || 'Terjadi kesalahan saat menghubungi API Dapodik lokal atau database Supabase.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" style={{ animationDuration: '3s' }} />
            Sinkronisasi Dapodik lokal
          </DialogTitle>
          <DialogDescription>
            Hubungkan data siswa dari aplikasi Dapodik lokal (port 5774) langsung ke database server.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Peringatan Sebelum Mulai */}
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg flex gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">PERINGATAN SEBELUM MULAI:</span>
              <ul className="list-disc list-inside space-y-1 text-amber-800 text-xs">
                <li>Pastikan aplikasi Dapodik di komputer lokal sekolah ini sedang aktif/running.</li>
                <li>Gunakan Token Web Service yang valid dari pengaturan Dapodik Anda.</li>
                <li>Proses ini akan mencocokkan NISN. Data lokal yang sesuai akan diperbarui, sisanya ditambahkan.</li>
              </ul>
            </div>
          </div>

          {/* Input Token */}
          <div className="space-y-2">
            <Label htmlFor="dapodik-token" className="text-slate-700 font-medium">Token Web Service Dapodik</Label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="dapodik-token"
                type="password"
                placeholder="Masukkan token Web Service Dapodik Anda"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Menampilkan Status Sinkronisasi */}
          {syncStatus && (
            <div className={`p-4 rounded-lg border flex gap-3 text-sm ${syncStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
              {syncStatus.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div className="space-y-1">
                <span className="font-bold">{syncStatus.success ? 'Berhasil' : 'Gagal'}</span>
                <p className="text-xs">{syncStatus.message}</p>
                {syncStatus.success && (
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-emerald-100 text-xs font-semibold">
                    <div>Baru: {syncStatus.added}</div>
                    <div>Update: {syncStatus.updated}</div>
                    <div className="text-rose-700">Gagal: {syncStatus.failed}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Tutup
          </Button>
          <Button onClick={handleSync} disabled={isLoading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Sedang Sinkron...' : 'Mulai Sinkronisasi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
