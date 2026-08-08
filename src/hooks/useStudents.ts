import { useState, useEffect, useCallback } from 'react';
import { utils, read, writeFile } from 'xlsx';
import { supabase } from '@/lib/supabase';

export interface Student {
  id: string;
  nisn: string;
  nis: string;
  nik: string;
  nama: string;
  asalSekolah: string;
  kelas: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  agama: string;
  kotaLahir: string;
  tanggalLahir: string;
  hpSiswa: string;
  status: 'Aktif' | 'Alumni' | 'Pindah' | 'Non-Aktif';
  alamat: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kodePos: string;
  noKk: string;
  namaAyah: string;
  nikAyah: string;
  thnLahirAyah: string;
  pendidikanAyah: string;
  pekerjaanAyah: string;
  penghasilanAyah: string;
  hpAyah: string;
  namaIbu: string;
  nikIbu: string;
  thnLahirIbu: string;
  pendidikanIbu: string;
  pekerjaanIbu: string;
  penghasilanIbu: string;
  hpIbu: string;
  tinggiBadan: string;
  beratBadan: string;
  anakKe: string;
  jumlahSaudara: string;
  golDarah: string;
  // Soft delete fields
  tanggalKeluar?: string;
  alasanKeluar?: string;
}

const STORAGE_KEY_STUDENTS = 'sim_siswa_data';
const STORAGE_KEY_CLASSES = 'sim_kelas_data';
const STORAGE_KEY_YEAR = 'sim_tahun_ajaran';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sanitizeDate = (val: any): string | null => {
  if (val === undefined || val === null) return null;
  const clean = String(val).trim();
  if (!clean) return null;

  // If it's already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // If it's DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Try standard JS Date parsing
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    if (yyyy > 1900 && yyyy < 2100) {
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // If it's an Excel serial number
  if (/^\d+$/.test(clean)) {
    const serial = parseInt(clean, 10);
    const utc_days  = serial - 25569;
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const yyyy = date_info.getFullYear();
    const mm = String(date_info.getMonth() + 1).padStart(2, '0');
    const dd = String(date_info.getDate()).padStart(2, '0');
    if (yyyy > 1900 && yyyy < 2100) {
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  return null;
};

// Helper: Map Database Row to Student Interface
export function mapDbToStudent(row: any): Student {
  return {
    id: row.id || '',
    nisn: row.nisn || '',
    nis: row.nis || '',
    nik: row.nik || '',
    nama: row.nama_lengkap || row.nama || '',
    asalSekolah: row.asal_sekolah || '',
    kelas: row.kelas || '',
    jenisKelamin: row.jenis_kelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
    agama: row.agama || 'Islam',
    kotaLahir: row.tempat_lahir || '',
    tanggalLahir: row.tanggal_lahir || '',
    hpSiswa: row.no_hp || '',
    status: (row.status_siswa || 'Aktif') as Student['status'],
    alamat: row.alamat || '',
    rt: row.rt || '',
    rw: row.rw || '',
    kelurahan: row.kelurahan || '',
    kecamatan: row.kecamatan || '',
    kodePos: row.kode_pos || '',
    noKk: row.no_kk || '',
    namaAyah: row.nama_ayah || '',
    nikAyah: row.nik_ayah || '',
    thnLahirAyah: row.thn_lahir_ayah || '',
    pendidikanAyah: row.pendidikan_ayah || '',
    pekerjaanAyah: row.pekerjaan_ayah || '',
    penghasilanAyah: row.penghasilan_ayah || '',
    hpAyah: row.hp_ayah || '',
    namaIbu: row.nama_ibu || '',
    nikIbu: row.nik_ibu || '',
    thnLahirIbu: row.thn_lahir_ibu || '',
    pendidikanIbu: row.pendidikan_ibu || '',
    pekerjaanIbu: row.pekerjaan_ibu || '',
    penghasilanIbu: row.penghasilan_ibu || '',
    hpIbu: row.hp_ibu || '',
    tinggiBadan: row.tinggi_badan || '',
    beratBadan: row.berat_badan || '',
    anakKe: row.anak_ke || '',
    jumlahSaudara: row.jumlah_saudara || '',
    golDarah: row.gol_darah || '',
    tanggalKeluar: row.tanggal_keluar || '',
    alasanKeluar: row.alasan_keluar || '',
  };
}

// Helper: Map Student Interface to Database Columns
export function mapStudentToDb(student: Partial<Student>): any {
  const result: any = {};
  
  if (student.id && uuidRegex.test(student.id)) {
    result.id = student.id;
  }
  
  if (student.nisn !== undefined) result.nisn = student.nisn.trim() === '' ? null : student.nisn;
  if (student.nis !== undefined) result.nis = student.nis.trim() === '' ? null : student.nis;
  if (student.nik !== undefined) result.nik = student.nik.trim() === '' ? null : student.nik;
  
  if (student.nama !== undefined) {
    result.nama = student.nama;
    result.nama_lengkap = student.nama;
  }
  
  if (student.asalSekolah !== undefined) result.asal_sekolah = student.asalSekolah;
  if (student.kelas !== undefined) result.kelas = student.kelas;
  if (student.jenisKelamin !== undefined) result.jenis_kelamin = student.jenisKelamin;
  if (student.agama !== undefined) result.agama = student.agama;
  if (student.kotaLahir !== undefined) result.tempat_lahir = student.kotaLahir;
  if (student.tanggalLahir !== undefined) result.tanggal_lahir = sanitizeDate(student.tanggalLahir);
  if (student.hpSiswa !== undefined) result.no_hp = student.hpSiswa;
  if (student.status !== undefined) result.status_siswa = student.status;
  
  if (student.alamat !== undefined) result.alamat = student.alamat;
  if (student.rt !== undefined) result.rt = student.rt;
  if (student.rw !== undefined) result.rw = student.rw;
  if (student.kelurahan !== undefined) result.kelurahan = student.kelurahan;
  if (student.kecamatan !== undefined) result.kecamatan = student.kecamatan;
  if (student.kodePos !== undefined) result.kode_pos = student.kodePos;
  if (student.noKk !== undefined) result.no_kk = student.noKk;
  
  if (student.namaAyah !== undefined) result.nama_ayah = student.namaAyah;
  if (student.nikAyah !== undefined) result.nik_ayah = student.nikAyah;
  if (student.thnLahirAyah !== undefined) result.thn_lahir_ayah = student.thnLahirAyah;
  if (student.pendidikanAyah !== undefined) result.pendidikan_ayah = student.pendidikanAyah;
  if (student.pekerjaanAyah !== undefined) result.pekerjaan_ayah = student.pekerjaanAyah;
  if (student.penghasilanAyah !== undefined) result.penghasilan_ayah = student.penghasilanAyah;
  if (student.hpAyah !== undefined) result.hp_ayah = student.hpAyah;
  
  if (student.namaIbu !== undefined) result.nama_ibu = student.namaIbu;
  if (student.nikIbu !== undefined) result.nik_ibu = student.nikIbu;
  if (student.thnLahirIbu !== undefined) result.thn_lahir_ibu = student.thnLahirIbu;
  if (student.pendidikanIbu !== undefined) result.pendidikan_ibu = student.pendidikanIbu;
  if (student.pekerjaanIbu !== undefined) result.pekerjaan_ibu = student.pekerjaanIbu;
  if (student.penghasilanIbu !== undefined) result.penghasilan_ibu = student.penghasilanIbu;
  if (student.hpIbu !== undefined) result.hp_ibu = student.hpIbu;
  
  if (student.tinggiBadan !== undefined) result.tinggi_badan = student.tinggiBadan;
  if (student.beratBadan !== undefined) result.berat_badan = student.beratBadan;
  if (student.anakKe !== undefined) result.anak_ke = student.anakKe;
  if (student.jumlahSaudara !== undefined) result.jumlah_saudara = student.jumlahSaudara;
  if (student.golDarah !== undefined) result.gol_darah = student.golDarah;
  if (student.tanggalKeluar !== undefined) result.tanggal_keluar = sanitizeDate(student.tanggalKeluar);
  if (student.alasanKeluar !== undefined) result.alasan_keluar = student.alasanKeluar;
  
  return result;
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync classes to local state & local storage
  const syncClasses = useCallback((currentStudents: Student[]) => {
    const uniqueClasses = Array.from(new Set(currentStudents.map((s) => s.kelas).filter(Boolean)));
    uniqueClasses.sort();
    
    setClasses((prevClasses) => {
      const merged = Array.from(new Set([...prevClasses, ...uniqueClasses])).sort();
      localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(merged));
      return merged;
    });
  }, []);

  // Fetch students from Supabase
  const fetchStudents = useCallback(async () => {
    try {
      const { data: dbStudents, error } = await supabase
        .from('siswa')
        .select('*')
        .order('nama_lengkap', { ascending: true });

      if (error) throw error;

      const mapped = (dbStudents || []).map(mapDbToStudent);
      setStudents(mapped);
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(mapped));
      
      const uniqueClasses = Array.from(new Set(mapped.map((s) => s.kelas).filter(Boolean)));
      uniqueClasses.sort();
      setClasses(uniqueClasses);
      localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(uniqueClasses));
    } catch (err) {
      console.error('Error fetching students from Supabase:', err);
      // Fallback to local storage if offline or error
      const storedStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (storedStudents) {
        setStudents(JSON.parse(storedStudents));
      }
    }
  }, []);

  // Initial Load
  useEffect(() => {
    async function init() {
      await fetchStudents();

      const storedYear = localStorage.getItem(STORAGE_KEY_YEAR);
      if (storedYear) {
        setTahunAjaran(storedYear);
      } else {
        const defaultYear = '2024/2025';
        setTahunAjaran(defaultYear);
        localStorage.setItem(STORAGE_KEY_YEAR, defaultYear);
      }
      setIsLoaded(true);
    }
    init();
  }, [fetchStudents]);

  // Save changes to Supabase (Batch operation / sync)
  const saveStudents = useCallback(async (newStudents: Student[]) => {
    try {
      const dbRows = newStudents.map(mapStudentToDb);
      const { error } = await supabase
        .from('siswa')
        .upsert(dbRows, { onConflict: 'id' });
      if (error) throw error;

      // Hanya update local state setelah Supabase berhasil
      setStudents(newStudents);
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(newStudents));
      syncClasses(newStudents);
    } catch (err) {
      console.error('Failed to sync changes to Supabase:', err);
    }
  }, [syncClasses]);

  const addStudent = async (student: Student) => {
    const updated = [student, ...students];
    setStudents(updated);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
    syncClasses(updated);

    try {
      const dbRow = mapStudentToDb(student);
      const { error } = await supabase
        .from('siswa')
        .insert([dbRow]);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to add student to Supabase:', err);
    }
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    const updated = students.map((s) => (s.id === id ? { ...s, ...data } : s));
    setStudents(updated);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
    syncClasses(updated);

    try {
      const dbRow = mapStudentToDb(data);
      const studentObj = students.find(s => s.id === id);
      if (studentObj) {
        const queryId = uuidRegex.test(id) ? id : null;
        let query = supabase.from('siswa').update(dbRow);
        
        if (queryId && studentObj.nisn) {
          query = query.or(`id.eq.${queryId},nisn.eq.${studentObj.nisn}`);
        } else if (queryId) {
          query = query.eq('id', queryId);
        } else if (studentObj.nisn) {
          query = query.eq('nisn', studentObj.nisn);
        } else {
          throw new Error('No unique identifier found to update student');
        }

        const { error } = await query;
        if (error) throw error;
      }
    } catch (err) {
      console.error('Failed to update student in Supabase:', err);
    }
  };

  // Soft delete: ubah status ke Non-Aktif + catat tanggal & alasan keluar
  const deleteStudent = async (id: string, alasan: string, tanggal: string) => {
    const studentObj = students.find(s => s.id === id);
    if (!studentObj) return;

    const isPermanent = studentObj.status === 'Non-Aktif' || studentObj.status === 'Pindah';
    const queryId = uuidRegex.test(id) ? id : null;

    if (isPermanent) {
      // Optimistic: hapus dari state lokal segera
      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
      syncClasses(updated);

      // Sync ke Supabase di background
      try {
        let result;
        if (queryId) {
          result = await supabase.from('siswa').delete().eq('id', queryId);
        } else if (studentObj.nisn) {
          result = await supabase.from('siswa').delete().eq('nisn', studentObj.nisn);
        } else {
          console.warn('No unique identifier; removed from local state only.');
          return;
        }
        if (result.error) {
          console.error('Supabase delete error detail:', JSON.stringify(result.error));
        }
      } catch (err) {
        console.error('Failed to delete student in Supabase:', err);
      }
    } else {
      // Optimistic: ubah status di state lokal segera
      const updated = students.map(s =>
        s.id === id
          ? { ...s, status: 'Non-Aktif' as const, tanggalKeluar: tanggal, alasanKeluar: alasan }
          : s
      );
      setStudents(updated);
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
      syncClasses(updated);

      // Sync ke Supabase di background
      try {
        const updatePayload = {
          status_siswa: 'Non-Aktif',
          tanggal_keluar: tanggal || null,
          alasan_keluar: alasan,
        };

        let result;
        if (queryId) {
          result = await supabase.from('siswa').update(updatePayload).eq('id', queryId);
        } else if (studentObj.nisn) {
          result = await supabase.from('siswa').update(updatePayload).eq('nisn', studentObj.nisn);
        } else {
          console.warn('No unique identifier; updated local state only.');
          return;
        }
        if (result.error) {
          console.error('Supabase update error detail:', JSON.stringify(result.error));
        }
      } catch (err) {
        console.error('Failed to update student status in Supabase:', err);
      }
    }
  };

  const updateTahunAjaran = (year: string) => {
    setTahunAjaran(year);
    localStorage.setItem(STORAGE_KEY_YEAR, year);
  };

  const updateClasses = (newClasses: string[]) => {
    setClasses(newClasses);
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(newClasses));
  };

  // Aktifkan kembali siswa non-aktif ke status Aktif
  const reaktifkanSiswa = async (id: string) => {
    const studentObj = students.find(s => s.id === id);
    if (!studentObj) return;

    const queryId = uuidRegex.test(id) ? id : null;

    // Optimistic: ubah status di state lokal segera
    const updated = students.map(s =>
      s.id === id
        ? { ...s, status: 'Aktif' as const, tanggalKeluar: '', alasanKeluar: '' }
        : s
    );
    setStudents(updated);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
    syncClasses(updated);

    // Sync ke Supabase
    try {
      const updatePayload = {
        status_siswa: 'Aktif',
        tanggal_keluar: null,
        alasan_keluar: null,
      };

      let result;
      if (queryId) {
        result = await supabase.from('siswa').update(updatePayload).eq('id', queryId);
      } else if (studentObj.nisn) {
        result = await supabase.from('siswa').update(updatePayload).eq('nisn', studentObj.nisn);
      } else {
        console.warn('No unique identifier; updated local state only.');
        return;
      }
      if (result.error) {
        console.error('Supabase reaktifkan error:', JSON.stringify(result.error));
      }
    } catch (err) {
      console.error('Failed to reactivate student in Supabase:', err);
    }
  };

  const pindahKelas = async (studentIds: string[], targetClass: string) => {
    const updated = students.map((s) => {
      if (studentIds.includes(s.id)) {
        return { ...s, kelas: targetClass };
      }
      return s;
    });
    setStudents(updated);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
    syncClasses(updated);

    try {
      const selectedStudents = students.filter(s => studentIds.includes(s.id));
      const uuids = selectedStudents.map(s => s.id).filter(id => uuidRegex.test(id));
      const nisns = selectedStudents.map(s => s.nisn).filter(Boolean);

      let query = supabase.from('siswa').update({ kelas: targetClass });
      if (uuids.length > 0 && nisns.length > 0) {
        query = query.or(`id.in.(${uuids.join(',')}),nisn.in.(${nisns.map(n => `"${n}"`).join(',')})`);
      } else if (uuids.length > 0) {
        query = query.in('id', uuids);
      } else if (nisns.length > 0) {
        query = query.in('nisn', nisns);
      } else {
        return;
      }

      const { error } = await query;
      if (error) throw error;
    } catch (err) {
      console.error('Failed to move class in Supabase:', err);
    }
  };

  const luluskanSiswa = async (studentIds: string[]) => {
    const updated = students.map((s) => {
      if (studentIds.includes(s.id)) {
        return { ...s, status: 'Alumni' as const };
      }
      return s;
    });
    setStudents(updated);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
    syncClasses(updated);

    try {
      const selectedStudents = students.filter(s => studentIds.includes(s.id));
      const uuids = selectedStudents.map(s => s.id).filter(id => uuidRegex.test(id));
      const nisns = selectedStudents.map(s => s.nisn).filter(Boolean);

      let query = supabase.from('siswa').update({ status_siswa: 'Alumni' });
      if (uuids.length > 0 && nisns.length > 0) {
        query = query.or(`id.in.(${uuids.join(',')}),nisn.in.(${nisns.map(n => `"${n}"`).join(',')})`);
      } else if (uuids.length > 0) {
        query = query.in('id', uuids);
      } else if (nisns.length > 0) {
        query = query.in('nisn', nisns);
      } else {
        return;
      }

      const { error } = await query;
      if (error) throw error;
    } catch (err) {
      console.error('Failed to graduate students in Supabase:', err);
    }
  };

  const suggestNextClass = (className: string) => {
    if (/^X\s/.test(className) && !/^X[IV]+\s/.test(className)) {
      return 'XI ' + className.slice(2);
    }
    if (/^XI\s/.test(className)) {
      return 'XII ' + className.slice(3);
    }
    if (/^XII\s/.test(className)) {
      return ''; // Locked
    }
    return '';
  };

  const importExcel = async (file: File, sheetName?: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          // Gunakan ArrayBuffer (lebih andal dari binary string di semua browser)
          const workbook = read(data, { type: 'array' });
          const selectedSheetName = sheetName || workbook.SheetNames[0];
          const worksheet = workbook.Sheets[selectedSheetName];
          const json = utils.sheet_to_json(worksheet);

          // Sinonim pencarian kolom Excel (Fuzzy Matching)
          const synonymsMap: Record<string, string[]> = {
            nama: ['nama', 'nama lengkap', 'nama_lengkap', 'fullname', 'full name', 'siswa', 'nama siswa'],
            nisn: ['nisn', 'nomor induk siswa nasional', 'no. nisn'],
            nis: ['nis', 'nipd', 'nomor induk', 'nomor induk siswa', 'no. nis'],
            nik: ['nik', 'no. nik', 'nomor induk kependudukan', 'no ktp', 'ktp'],
            kelas: ['kelas', 'rombel', 'nama kelas', 'tingkat'],
            asalSekolah: ['asal sekolah', 'sekolah asal', 'asal_sekolah', 'smp asal', 'sekolah smp'],
            jenisKelamin: ['jenis kelamin', 'jk', 'sex', 'gender', 'jenis_kelamin', 'l/p', 'jenis_kelamin'],
            agama: ['agama', 'religion'],
            kotaLahir: ['tempat lahir', 'kota lahir', 'tempat_lahir', 'kota_lahir'],
            tanggalLahir: ['tanggal lahir', 'tgl lahir', 'tanggal_lahir', 'tgl_lahir', 'birthdate'],
            hpSiswa: ['hp', 'no hp', 'hp siswa', 'no telp', 'telepon', 'hp_siswa', 'nomor telepon seluler', 'no. hp'],
            alamat: ['alamat', 'alamat jalan', 'jalan', 'alamat_jalan'],
            rt: ['rt', 'rt/rw', 'nomor rt'],
            rw: ['rw', 'nomor rw'],
            kelurahan: ['kelurahan', 'desa', 'desa/kelurahan', 'kelurahan/desa', 'desa_kelurahan'],
            kecamatan: ['kecamatan', 'distrik'],
            kodePos: ['kode pos', 'kodepos', 'kode_pos', 'zip', 'zipcode'],
            noKk: ['no kk', 'nomor kk', 'kartu keluarga', 'no_kk'],
            namaAyah: ['nama ayah', 'ayah', 'nama_ayah'],
            nikAyah: ['nik ayah', 'nik_ayah'],
            thnLahirAyah: ['tahun lahir ayah', 'thn lahir ayah', 'tahun_lahir_ayah', 'lahir_ayah'],
            pendidikanAyah: ['pendidikan ayah', 'pendidikan_ayah', 'lulusan ayah'],
            pekerjaanAyah: ['pekerjaan ayah', 'pekerjaan_ayah', 'kerja ayah'],
            penghasilanAyah: ['penghasilan ayah', 'penghasilan_ayah', 'gaji ayah'],
            hpAyah: ['hp ayah', 'no hp ayah', 'telepon ayah'],
            namaIbu: ['nama ibu', 'ibu', 'nama_ibu', 'nama ibu kandung', 'nama_ibu_kandung'],
            nikIbu: ['nik ibu', 'nik_ibu'],
            thnLahirIbu: ['tahun lahir ibu', 'thn lahir ibu', 'tahun_lahir_ibu', 'lahir_ibu'],
            pendidikanIbu: ['pendidikan ibu', 'pendidikan_ibu', 'lulusan ibu'],
            pekerjaanIbu: ['pekerjaan ibu', 'pekerjaan_ibu', 'kerja ibu'],
            penghasilanIbu: ['penghasilan ibu', 'penghasilan_ibu', 'gaji ibu'],
            hpIbu: ['hp ibu', 'no hp ibu', 'telepon ibu'],
            tinggiBadan: ['tinggi badan', 'tinggi', 'tinggi_badan', 'tb'],
            beratBadan: ['berat badan', 'berat', 'berat_badan', 'bb'],
            anakKe: ['anak ke', 'anak_ke', 'anak keberapa'],
            jumlahSaudara: ['jumlah saudara', 'saudara', 'jumlah_saudara'],
            golDarah: ['gol darah', 'golongan darah', 'gol_darah', 'blood type', 'darah']
          };

          // Helper pencari nilai kolom dari Excel
          const getExcelValue = (row: any, fieldKey: string): string => {
            const synonyms = synonymsMap[fieldKey];
            if (!synonyms) return '';

            const rowKeys = Object.keys(row);
            for (const rowKey of rowKeys) {
              const cleanRowKey = rowKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
              for (const synonym of synonyms) {
                const cleanSynonym = synonym.replace(/[^a-z0-9]/g, '');
                if (cleanRowKey === cleanSynonym) {
                  return String(row[rowKey] || '').trim();
                }
              }
            }
            return '';
          };

          // Helper format data: Hanya nama siswa yang diubah ke UPPERCASE, yang lain dibiarkan apa adanya
          const formatValue = (val: string, fieldKey: string): string => {
            if (!val) return '';
            
            if (fieldKey === 'nama') {
              return val.toUpperCase();
            }

            return val;
          };

          let importedCount = 0;
          const newStudents: Student[] = [];

          json.forEach((row: any) => {
            const rawNama = getExcelValue(row, 'nama');
            const rawNisn = getExcelValue(row, 'nisn');

            if (rawNama) {
              // Parse Jenis Kelamin cerdas
              let jk = getExcelValue(row, 'jenisKelamin');
              let cleanJk: 'Laki-laki' | 'Perempuan' = 'Laki-laki';
              if (jk) {
                const jkLower = jk.toLowerCase();
                if (jkLower === 'p' || jkLower.includes('perempuan') || jkLower.includes('wanita') || jkLower === 'female') {
                  cleanJk = 'Perempuan';
                }
              }

              const newStudent: Student = {
                id: crypto.randomUUID(),
                nama:             formatValue(rawNama, 'nama'),
                nisn:             formatValue(rawNisn, 'nisn'),
                nis:              formatValue(getExcelValue(row, 'nis'), 'nis'),
                nik:              formatValue(getExcelValue(row, 'nik'), 'nik'),
                kelas:            formatValue(getExcelValue(row, 'kelas'), 'kelas'),
                asalSekolah:      formatValue(getExcelValue(row, 'asalSekolah'), 'asalSekolah'),
                jenisKelamin:     cleanJk,
                agama:            formatValue(getExcelValue(row, 'agama') || 'Islam', 'agama'),
                kotaLahir:        formatValue(getExcelValue(row, 'kotaLahir'), 'kotaLahir'),
                tanggalLahir:     getExcelValue(row, 'tanggalLahir'),
                hpSiswa:          getExcelValue(row, 'hpSiswa'),
                status:           'Aktif',
                alamat:           formatValue(getExcelValue(row, 'alamat'), 'alamat'),
                rt:               formatValue(getExcelValue(row, 'rt'), 'rt'),
                rw:               formatValue(getExcelValue(row, 'rw'), 'rw'),
                kelurahan:        formatValue(getExcelValue(row, 'kelurahan'), 'kelurahan'),
                kecamatan:        formatValue(getExcelValue(row, 'kecamatan'), 'kecamatan'),
                kodePos:          formatValue(getExcelValue(row, 'kodePos'), 'kodePos'),
                noKk:             formatValue(getExcelValue(row, 'noKk'), 'noKk'),
                namaAyah:         formatValue(getExcelValue(row, 'namaAyah'), 'namaAyah'),
                nikAyah:          formatValue(getExcelValue(row, 'nikAyah'), 'nikAyah'),
                thnLahirAyah:     getExcelValue(row, 'thnLahirAyah'),
                pendidikanAyah:   formatValue(getExcelValue(row, 'pendidikanAyah'), 'pendidikanAyah'),
                pekerjaanAyah:    formatValue(getExcelValue(row, 'pekerjaanAyah'), 'pekerjaanAyah'),
                penghasilanAyah:  formatValue(getExcelValue(row, 'penghasilanAyah'), 'penghasilanAyah'),
                hpAyah:           getExcelValue(row, 'hpAyah'),
                namaIbu:          formatValue(getExcelValue(row, 'namaIbu'), 'namaIbu'),
                nikIbu:           formatValue(getExcelValue(row, 'nikIbu'), 'nikIbu'),
                thnLahirIbu:      getExcelValue(row, 'thnLahirIbu'),
                pendidikanIbu:    formatValue(getExcelValue(row, 'pendidikanIbu'), 'pendidikanIbu'),
                pekerjaanIbu:     formatValue(getExcelValue(row, 'pekerjaanIbu'), 'pekerjaanIbu'),
                penghasilanIbu:   formatValue(getExcelValue(row, 'penghasilanIbu'), 'penghasilanIbu'),
                hpIbu:            getExcelValue(row, 'hpIbu'),
                tinggiBadan:      getExcelValue(row, 'tinggiBadan'),
                beratBadan:       getExcelValue(row, 'beratBadan'),
                anakKe:           getExcelValue(row, 'anakKe'),
                jumlahSaudara:    getExcelValue(row, 'jumlahSaudara'),
                golDarah:         formatValue(getExcelValue(row, 'golDarah'), 'golDarah')
              };
              newStudents.push(newStudent);
              importedCount++;
            }
          });

          if (importedCount > 0) {
            // --- Cross-check ke Supabase: cari siswa existing berdasarkan NISN & NIK ---
            // Ini penting agar siswa yang sudah ada di DB (tapi belum ter-load di state)
            // tidak dianggap "baru" sehingga melanggar unique constraint (nik, nisn, dll.)
            const incomingNisns = newStudents.map(s => s.nisn).filter(Boolean);
            const incomingNiks  = newStudents.map(s => s.nik).filter(Boolean);

            let dbExistingMap: Record<string, string> = {}; // key: nisn|nik -> id

            if (incomingNisns.length > 0) {
              const { data: byNisn } = await supabase
                .from('siswa')
                .select('id, nisn, nik')
                .in('nisn', incomingNisns);
              (byNisn || []).forEach((r: any) => {
                if (r.nisn) dbExistingMap[`nisn:${r.nisn}`] = r.id;
                if (r.nik)  dbExistingMap[`nik:${r.nik}`]  = r.id;
              });
            }

            if (incomingNiks.length > 0) {
              const { data: byNik } = await supabase
                .from('siswa')
                .select('id, nisn, nik')
                .in('nik', incomingNiks);
              (byNik || []).forEach((r: any) => {
                if (r.nisn) dbExistingMap[`nisn:${r.nisn}`] = r.id;
                if (r.nik)  dbExistingMap[`nik:${r.nik}`]  = r.id;
              });
            }

            // Ganti ID incoming agar sesuai dengan ID yang sudah ada di database jika ada
            const rawMapped = newStudents.map(incoming => {
              // 1. Cari di state lokal berdasarkan NISN (prioritas utama)
              let existing = incoming.nisn
                ? students.find(s => s.nisn && s.nisn === incoming.nisn)
                : null;
              
              // 2. Cari di state lokal berdasarkan NIK
              if (!existing && incoming.nik) {
                existing = students.find(s => s.nik && s.nik === incoming.nik);
              }

              // 3. Cari di state lokal berdasarkan nama
              if (!existing) {
                existing = students.find(
                  s => s.nama.trim().toLowerCase() === incoming.nama.trim().toLowerCase()
                );
              }

              if (existing) {
                return { ...incoming, id: existing.id };
              }

              // 4. Cari di Supabase (cross-check) berdasarkan NISN atau NIK
              const dbId = (incoming.nisn && dbExistingMap[`nisn:${incoming.nisn}`])
                || (incoming.nik && dbExistingMap[`nik:${incoming.nik}`]);
              if (dbId) {
                return { ...incoming, id: dbId };
              }

              return incoming;
            });

            // --- Deduplikasi: jika ada duplikat NISN/NIK/ID dalam Excel, ambil yang pertama ---
            const seenIds   = new Set<string>();
            const seenNisns = new Set<string>();
            const seenNiks  = new Set<string>();
            const studentsToUpsert = rawMapped.filter(s => {
              if (seenIds.has(s.id)) return false;
              seenIds.add(s.id);
              if (s.nisn && seenNisns.has(s.nisn)) return false;
              if (s.nisn) seenNisns.add(s.nisn);
              if (s.nik  && seenNiks.has(s.nik))  return false;
              if (s.nik)  seenNiks.add(s.nik);
              return true;
            });

            // --- Pisahkan: existing (UPDATE) vs baru (INSERT) ---
            const existingIds = new Set([
              ...Object.values(dbExistingMap),
              ...students.map(s => s.id),
            ]);
            const toUpdate = studentsToUpsert.filter(s => existingIds.has(s.id));
            const toInsert = studentsToUpsert.filter(s => !existingIds.has(s.id));

            const BATCH_SIZE = 100;

            // UPDATE yang sudah ada (aman karena pakai ID yang sudah ada di DB)
            if (toUpdate.length > 0) {
              const updateRows = toUpdate.map(mapStudentToDb);
              for (let i = 0; i < updateRows.length; i += BATCH_SIZE) {
                const batch = updateRows.slice(i, i + BATCH_SIZE);
                const { error } = await supabase
                  .from('siswa')
                  .upsert(batch, { onConflict: 'id' });
                if (error) {
                  console.error(`Update batch error:`, JSON.stringify(error));
                  reject(new Error(error.message || JSON.stringify(error)));
                  return;
                }
              }
            }

            // INSERT yang benar-benar baru (hapus nisn/nik kosong agar tidak tabrakan null-unique)
            if (toInsert.length > 0) {
              const insertRows = toInsert.map(s => {
                const row = mapStudentToDb(s);
                // Pastikan nisn/nik null (bukan '') agar tidak kena unique constraint
                if (!row.nisn) row.nisn = null;
                if (!row.nik)  row.nik  = null;
                return row;
              });
              for (let i = 0; i < insertRows.length; i += BATCH_SIZE) {
                const batch = insertRows.slice(i, i + BATCH_SIZE);
                const { error } = await supabase
                  .from('siswa')
                  .insert(batch);
                if (error) {
                  console.error(`Insert batch error:`, JSON.stringify(error));
                  reject(new Error(error.message || JSON.stringify(error)));
                  return;
                }
              }
            }

            // Gabungkan data baru ke state lokal (timpa yang ada, tambahkan yang baru ke akhir)
            const updatedStudents = [...students];
            for (const incoming of studentsToUpsert) {
              const existingIndex = updatedStudents.findIndex(
                s => s.id === incoming.id
              );
              if (existingIndex >= 0) {
                updatedStudents[existingIndex] = incoming;
              } else {
                updatedStudents.push(incoming);
              }
            }

            // Urutkan seluruh siswa secara alfabetis A-Z berdasarkan nama
            updatedStudents.sort((a, b) => a.nama.localeCompare(b.nama));

            // Simpan ke state dan localStorage (HANYA setelah database sukses)
            setStudents(updatedStudents);
            localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updatedStudents));
            syncClasses(updatedStudents);
          }
          resolve(importedCount);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      // readAsArrayBuffer lebih andal dan tidak deprecated
      reader.readAsArrayBuffer(file);
    });
  };

  const downloadExcelTemplate = () => {
    const ws = utils.json_to_sheet([{
      'NAMA LENGKAP': 'Contoh Siswa',
      'NISN': '0012345678',
      'NIS': '24001',
      'NIK': '3201010101010001',
      'Kelas': 'X IPA 1',
      'Asal Sekolah': 'SMPN 1 Jakarta',
      'JK': 'Laki-laki',
      'Agama': 'Islam',
      'Tempat Lahir': 'Jakarta',
      'Tanggal Lahir': '2008-01-01',
      'HP': '081234567890',
      'Alamat': 'Jl. Merdeka No 1',
      'RT': '01',
      'RW': '02',
      'Kelurahan': 'Gambir',
      'Kecamatan': 'Gambir',
      'Kode Pos': '10110',
      'No KK': '3201010101010000',
      'Nama Ayah': 'Ayah Contoh',
      'NIK Ayah': '3201010101010002',
      'Tahun Lahir Ayah': '1980',
      'Pendidikan Ayah': 'S1',
      'Pekerjaan Ayah': 'PNS',
      'Penghasilan Ayah': '5-10 Juta',
      'HP Ayah': '081234567891',
      'Nama Ibu': 'Ibu Contoh',
      'NIK Ibu': '3201010101010003',
      'Tahun Lahir Ibu': '1982',
      'Pendidikan Ibu': 'SMA',
      'Pekerjaan Ibu': 'Ibu Rumah Tangga',
      'Penghasilan Ibu': '0',
      'HP Ibu': '081234567892',
      'Tinggi Badan': '160',
      'Berat Badan': '50',
      'Anak Ke': '1',
      'Jumlah Saudara': '2',
      'Gol Darah': 'O'
    }]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Template");
    writeFile(wb, "Template_Import_Data_Siswa.xlsx");
  };

  return {
    students,
    classes,
    tahunAjaran,
    isLoaded,
    addStudent,
    updateStudent,
    deleteStudent,
    reaktifkanSiswa,
    updateTahunAjaran,
    updateClasses,
    pindahKelas,
    luluskanSiswa,
    suggestNextClass,
    importExcel,
    downloadExcelTemplate,
    syncClasses: () => syncClasses(students),
    fetchStudents
  };
}
