import { useState, useEffect, useCallback } from 'react';
import { utils, read, writeFile } from 'xlsx';

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
}

const STORAGE_KEY_STUDENTS = 'sim_siswa_data';
const STORAGE_KEY_CLASSES = 'sim_kelas_data';
const STORAGE_KEY_YEAR = 'sim_tahun_ajaran';

const initialDemoStudents: Student[] = [
  {
    id: 'demo-1',
    nisn: '0051234567',
    nis: '23241001',
    nik: '3201010101050001',
    nama: 'Budi Santoso',
    asalSekolah: 'SMPN 1 Jakarta',
    kelas: 'X IPA 1',
    jenisKelamin: 'Laki-laki',
    agama: 'Islam',
    kotaLahir: 'Jakarta',
    tanggalLahir: '2005-08-17',
    hpSiswa: '081234567890',
    status: 'Aktif',
    alamat: 'Jl. Merdeka No. 45',
    rt: '001',
    rw: '002',
    kelurahan: 'Gambir',
    kecamatan: 'Gambir',
    kodePos: '10110',
    noKk: '3201010101050000',
    namaAyah: 'Haryanto',
    nikAyah: '3201010101800001',
    thnLahirAyah: '1980',
    pendidikanAyah: 'S1',
    pekerjaanAyah: 'Pegawai Negeri',
    penghasilanAyah: '5-10 Juta',
    hpAyah: '081298765432',
    namaIbu: 'Siti Aminah',
    nikIbu: '3201014101820002',
    thnLahirIbu: '1982',
    pendidikanIbu: 'SMA',
    pekerjaanIbu: 'Ibu Rumah Tangga',
    penghasilanIbu: 'Tidak Berpenghasilan',
    hpIbu: '081298765433',
    tinggiBadan: '165',
    beratBadan: '55',
    anakKe: '1',
    jumlahSaudara: '2',
    golDarah: 'O'
  },
  {
    id: 'demo-2',
    nisn: '0057654321',
    nis: '23241002',
    nik: '3201014101050002',
    nama: 'Rina Wijaya',
    asalSekolah: 'SMPN 2 Jakarta',
    kelas: 'X IPA 1',
    jenisKelamin: 'Perempuan',
    agama: 'Kristen Protestan',
    kotaLahir: 'Bandung',
    tanggalLahir: '2005-11-20',
    hpSiswa: '085612345678',
    status: 'Aktif',
    alamat: 'Jl. Sudirman No. 8',
    rt: '003',
    rw: '004',
    kelurahan: 'Senayan',
    kecamatan: 'Kebayoran Baru',
    kodePos: '12190',
    noKk: '3201010101050003',
    namaAyah: 'Hendrik Wijaya',
    nikAyah: '3201010101780003',
    thnLahirAyah: '1978',
    pendidikanAyah: 'S2',
    pekerjaanAyah: 'Wiraswasta',
    penghasilanAyah: '>20 Juta',
    hpAyah: '085698765432',
    namaIbu: 'Maria',
    nikIbu: '3201014101800004',
    thnLahirIbu: '1980',
    pendidikanIbu: 'S1',
    pekerjaanIbu: 'Karyawan Swasta',
    penghasilanIbu: '5-10 Juta',
    hpIbu: '085698765433',
    tinggiBadan: '158',
    beratBadan: '48',
    anakKe: '2',
    jumlahSaudara: '3',
    golDarah: 'A'
  }
];

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from local storage
    const storedStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
    const storedClasses = localStorage.getItem(STORAGE_KEY_CLASSES);
    const storedYear = localStorage.getItem(STORAGE_KEY_YEAR);

    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    } else {
      setStudents(initialDemoStudents);
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(initialDemoStudents));
    }

    if (storedClasses) {
      setClasses(JSON.parse(storedClasses));
    } else {
      const demoClasses = ['X IPA 1'];
      setClasses(demoClasses);
      localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(demoClasses));
    }

    if (storedYear) {
      setTahunAjaran(storedYear);
    } else {
      const defaultYear = '2024/2025';
      setTahunAjaran(defaultYear);
      localStorage.setItem(STORAGE_KEY_YEAR, defaultYear);
    }

    setIsLoaded(true);
  }, []);

  const syncClasses = useCallback((currentStudents: Student[]) => {
    const uniqueClasses = Array.from(new Set(currentStudents.map((s) => s.kelas).filter(Boolean)));
    uniqueClasses.sort();
    
    // Merge with existing classes in case some classes are empty but shouldn't be deleted yet
    setClasses((prevClasses) => {
      const merged = Array.from(new Set([...prevClasses, ...uniqueClasses])).sort();
      localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const saveStudents = useCallback((newStudents: Student[]) => {
    setStudents(newStudents);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(newStudents));
    syncClasses(newStudents);
  }, [syncClasses]);

  const addStudent = (student: Student) => {
    saveStudents([student, ...students]);
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    const updated = students.map((s) => (s.id === id ? { ...s, ...data } : s));
    saveStudents(updated);
  };

  const deleteStudent = (id: string) => {
    const updated = students.filter((s) => s.id !== id);
    saveStudents(updated);
  };

  const updateTahunAjaran = (year: string) => {
    setTahunAjaran(year);
    localStorage.setItem(STORAGE_KEY_YEAR, year);
  };

  const updateClasses = (newClasses: string[]) => {
    setClasses(newClasses);
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(newClasses));
  };

  const pindahKelas = (studentIds: string[], targetClass: string) => {
    const updated = students.map((s) => {
      if (studentIds.includes(s.id)) {
        return { ...s, kelas: targetClass };
      }
      return s;
    });
    saveStudents(updated);
  };

  const luluskanSiswa = (studentIds: string[]) => {
    const updated = students.map((s) => {
      if (studentIds.includes(s.id)) {
        return { ...s, status: 'Alumni' as const };
      }
      return s;
    });
    saveStudents(updated);
  };

  // suggestNextClass based on simple regex (X -> XI -> XII)
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

  const importExcel = async (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = utils.sheet_to_json(worksheet);

          let importedCount = 0;
          const newStudents: Student[] = [];

          json.forEach((row: any) => {
            const rawNama = row['nama'] || row['Nama'] || row['NAMA LENGKAP'] || row['nama lengkap'];
            const rawNisn = row['nisn'] || row['NISN'];

            if (rawNama && rawNisn) {
              const newStudent: Student = {
                id: 'std-' + Date.now() + Math.random().toString(36).substr(2, 9),
                nama: String(rawNama),
                nisn: String(rawNisn),
                nis: String(row['nis'] || row['NIS'] || ''),
                nik: String(row['nik'] || row['NIK'] || ''),
                kelas: String(row['kelas'] || row['Kelas'] || ''),
                asalSekolah: String(row['asal sekolah'] || row['Asal Sekolah'] || ''),
                jenisKelamin: String(row['jk'] || row['JK'] || row['jenis kelamin']) === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
                agama: String(row['agama'] || row['Agama'] || 'Lainnya'),
                kotaLahir: String(row['tempat lahir'] || row['Tempat Lahir'] || ''),
                tanggalLahir: String(row['tanggal lahir'] || row['Tanggal Lahir'] || ''),
                hpSiswa: String(row['no hp'] || row['HP'] || ''),
                status: 'Aktif',
                alamat: String(row['alamat'] || row['Alamat'] || ''),
                rt: String(row['rt'] || row['RT'] || ''),
                rw: String(row['rw'] || row['RW'] || ''),
                kelurahan: String(row['kelurahan'] || row['Kelurahan'] || ''),
                kecamatan: String(row['kecamatan'] || row['Kecamatan'] || ''),
                kodePos: String(row['kode pos'] || row['Kode Pos'] || ''),
                noKk: String(row['no kk'] || row['No KK'] || ''),
                namaAyah: String(row['nama ayah'] || row['Nama Ayah'] || ''),
                nikAyah: String(row['nik ayah'] || row['NIK Ayah'] || ''),
                thnLahirAyah: String(row['tahun lahir ayah'] || ''),
                pendidikanAyah: String(row['pendidikan ayah'] || ''),
                pekerjaanAyah: String(row['pekerjaan ayah'] || ''),
                penghasilanAyah: String(row['penghasilan ayah'] || ''),
                hpAyah: String(row['hp ayah'] || ''),
                namaIbu: String(row['nama ibu'] || row['Nama Ibu'] || ''),
                nikIbu: String(row['nik ibu'] || row['NIK Ibu'] || ''),
                thnLahirIbu: String(row['tahun lahir ibu'] || ''),
                pendidikanIbu: String(row['pendidikan ibu'] || ''),
                pekerjaanIbu: String(row['pekerjaan ibu'] || ''),
                penghasilanIbu: String(row['penghasilan ibu'] || ''),
                hpIbu: String(row['hp ibu'] || ''),
                tinggiBadan: String(row['tinggi badan'] || ''),
                beratBadan: String(row['berat badan'] || ''),
                anakKe: String(row['anak ke'] || ''),
                jumlahSaudara: String(row['jumlah saudara'] || ''),
                golDarah: String(row['gol darah'] || '')
              };
              newStudents.push(newStudent);
              importedCount++;
            }
          });

          if (importedCount > 0) {
            saveStudents([...newStudents, ...students]);
          }
          resolve(importedCount);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
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
    updateTahunAjaran,
    updateClasses,
    pindahKelas,
    luluskanSiswa,
    suggestNextClass,
    importExcel,
    downloadExcelTemplate,
    syncClasses: () => syncClasses(students)
  };
}
