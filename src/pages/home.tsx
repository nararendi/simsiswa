import { useState, useMemo, useRef } from 'react';
import { useStudents, Student } from '@/hooks/useStudents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Users, UserCheck, User, Users2, Search, Filter, Calendar, Plus, 
  MoreVertical, FileSpreadsheet, Download, Upload, Database, 
  LayoutGrid, List, ChevronDown, CheckSquare, Settings, ArrowRightLeft,
  ArrowUpCircle, GraduationCap, Eye, Edit, Trash2, LogOut, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Import Modals
import { TahunAjaranModal } from '@/components/modals/TahunAjaranModal';
import { KelolaKelasModal } from '@/components/modals/KelolaKelasModal';
import { PindahKelasModal } from '@/components/modals/PindahKelasModal';
import { NaikKelasModal } from '@/components/modals/NaikKelasModal';
import { KelulusanModal } from '@/components/modals/KelulusanModal';
import { StudentFormModal } from '@/components/modals/StudentFormModal';
import { StudentDetailModal } from '@/components/modals/StudentDetailModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { read } from 'xlsx';
import { KelolaAdminModal } from '@/components/modals/KelolaAdminModal';
import { ImportExcelModal } from '@/components/modals/ImportExcelModal';


export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const {
    students, classes, tahunAjaran, isLoaded,
    addStudent, updateStudent, deleteStudent, updateTahunAjaran,
    updateClasses, pindahKelas, luluskanSiswa, suggestNextClass,
    importExcel, downloadExcelTemplate, syncClasses, fetchStudents
  } = useStudents();

  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Aktif');
  
  // Modals state
  const [modalTahunOpen, setModalTahunOpen] = useState(false);
  const [modalKelolaKelasOpen, setModalKelolaKelasOpen] = useState(false);
  const [modalPindahKelasOpen, setModalPindahKelasOpen] = useState(false);
  const [modalNaikKelasOpen, setModalNaikKelasOpen] = useState(false);
  const [modalKelulusanOpen, setModalKelulusanOpen] = useState(false);
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [modalDetailOpen, setModalDetailOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [modalAdminOpen, setModalAdminOpen] = useState(false);
  
  // Excel Sheet Selection state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelSheetNames, setExcelSheetNames] = useState<string[]>([]);
  const [modalImportExcelOpen, setModalImportExcelOpen] = useState(false);

  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fileInputExcelRef = useRef<HTMLInputElement>(null);

  // Derived Stats
  const stats = useMemo(() => {
    return {
      total: students.length,
      aktif: students.filter(s => s.status === 'Aktif').length,
      alumni: students.filter(s => s.status === 'Alumni').length,
      nonAktif: students.filter(s => s.status === 'Non-Aktif' || s.status === 'Pindah').length,
      laki: students.filter(s => s.jenisKelamin === 'Laki-laki').length,
      perempuan: students.filter(s => s.jenisKelamin === 'Perempuan').length
    };
  }, [students]);

  // Filtering
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchKelas = filterKelas === 'Semua' || s.kelas === filterKelas;
      const matchStatus = filterStatus === 'Semua' ? (s.status === 'Aktif') : s.status === filterStatus;
      const term = searchTerm.toLowerCase();
      const matchSearch = !term || (
        s.nama.toLowerCase().includes(term) ||
        s.nisn.toLowerCase().includes(term) ||
        s.nis.toLowerCase().includes(term) ||
        (s.alamat && s.alamat.toLowerCase().includes(term))
      );
      return matchKelas && matchStatus && matchSearch;
    });
  }, [students, filterKelas, filterStatus, searchTerm]);

  // File Handlers
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (fileInputExcelRef.current) fileInputExcelRef.current.value = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = read(data, { type: 'binary' });
        const sheetNames = workbook.SheetNames;

        if (sheetNames.length === 0) {
          toast({ variant: 'destructive', title: 'File Kosong', description: 'Tidak ada sheet di dalam file Excel.' });
          return;
        }

        if (sheetNames.length === 1) {
          // Hanya 1 sheet -> langsung impor
          const count = await importExcel(file, sheetNames[0]);
          toast({ title: 'Import Berhasil', description: `${count} data siswa dari sheet "${sheetNames[0]}" telah ditambahkan.` });
        } else {
          // Lebih dari 1 sheet -> simpan file di state dan buka modal pilihan
          setExcelFile(file);
          setExcelSheetNames(sheetNames);
          setModalImportExcelOpen(true);
        }
      } catch (err) {
        toast({ variant: 'destructive', title: 'Import Gagal', description: 'Pastikan file Excel Anda valid.' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSelectSheetImport = async (sheetName: string) => {
    if (!excelFile) return;
    try {
      const count = await importExcel(excelFile, sheetName);
      toast({ title: 'Import Berhasil', description: `${count} data siswa dari sheet "${sheetName}" telah ditambahkan.` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Import Gagal', description: 'Gagal mengimpor sheet yang dipilih.' });
    } finally {
      setExcelFile(null);
      setExcelSheetNames([]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aktif': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 font-semibold">Aktif</Badge>;
      case 'Alumni': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200 font-semibold">Alumni</Badge>;
      case 'Pindah': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 font-semibold">Pindah</Badge>;
      case 'Non-Aktif': return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200 font-semibold">Non-Aktif</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-blue-50/40 text-slate-800 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white sticky top-0 z-30 shadow-md shadow-indigo-500/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-100">SIM-SISWA</h1>
              <p className="text-xs text-slate-100 hidden sm:block">Sistem Informasi Input & Manajemen Data Siswa</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              className="bg-white/10 hover:bg-white/20 text-white border-0 flex gap-2"
              onClick={() => setModalTahunOpen(true)}
            >
              <Calendar className="w-4 h-4 text-amber-300" /> 
              <span className="hidden sm:inline font-medium">TA: {tahunAjaran || 'Belum diatur'}</span>
            </Button>

            <Button 
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-bold shadow-md shadow-amber-500/20 border-0"
              onClick={() => {
                setSelectedStudent(null);
                setModalFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Siswa
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-white/10 hover:bg-white/20 text-white border-0">
                  <Settings className="w-5 h-5 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 text-slate-800 shadow-xl">
                <DropdownMenuItem onClick={() => setModalAdminOpen(true)} className="hover:bg-slate-100 cursor-pointer">
                  <Settings className="w-4 h-4 mr-2 text-indigo-600" />
                  Kelola Akun
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 hover:bg-rose-50 cursor-pointer"
                  onClick={() => {
                    localStorage.removeItem('sim_auth_token');
                    toast({ title: 'Logout Berhasil', description: 'Anda telah keluar dari sistem.' });
                    setLocation('/login');
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar / Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1 flex flex-col gap-6">
        


        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-200/80 gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setFilterStatus('Aktif')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              filterStatus === 'Aktif'
                ? 'border-emerald-500 text-emerald-700 bg-emerald-50/80 rounded-t-lg font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Siswa Aktif
            <Badge variant="secondary" className="ml-1 bg-emerald-100 text-emerald-800 font-mono font-semibold border-0">
              {stats.aktif}
            </Badge>
          </button>

          <button
            onClick={() => setFilterStatus('Alumni')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              filterStatus === 'Alumni'
                ? 'border-blue-500 text-blue-700 bg-blue-50/80 rounded-t-lg font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-blue-600" />
            Alumni
            <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800 font-mono font-semibold border-0">
              {stats.alumni}
            </Badge>
          </button>

          <button
            onClick={() => setFilterStatus('Non-Aktif')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              filterStatus === 'Non-Aktif'
                ? 'border-rose-500 text-rose-700 bg-rose-50/80 rounded-t-lg font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            Siswa Non-Aktif
            <Badge variant="secondary" className="ml-1 bg-rose-100 text-rose-800 font-mono font-semibold border-0">
              {stats.nonAktif}
            </Badge>
          </button>

          <button
            onClick={() => setFilterStatus('Semua')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              filterStatus === 'Semua'
                ? 'border-indigo-500 text-indigo-700 bg-indigo-50/80 rounded-t-lg font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            Semua Data
            <Badge variant="secondary" className="ml-1 bg-indigo-100 text-indigo-800 font-mono font-semibold border-0">
              {stats.aktif}
            </Badge>
          </button>
        </div>

        {/* SEARCH & FILTERS PANEL */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Cari nama, NISN, atau alamat..." 
                  className="pl-9 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterKelas} onValueChange={setFilterKelas}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white border-slate-200 text-slate-800">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800">
                  <SelectItem value="Semua">Semua Kelas</SelectItem>
                  {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px] bg-white border-slate-200 text-slate-800">
                  <CheckSquare className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800">
                  <SelectItem value="Semua">Semua Status</SelectItem>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Alumni">Alumni</SelectItem>
                  <SelectItem value="Pindah">Pindah</SelectItem>
                  <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 bg-slate-100 p-1 rounded-md border border-slate-200/60">
              <Button 
                variant={viewMode === 'table' ? 'default' : 'ghost'} 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'card' ? 'default' : 'ghost'} 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-3 border-t border-slate-100 gap-4">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-semibold text-slate-800">{filteredStudents.length}</span> dari {students.length} siswa
            </p>
            
            <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" /> Kelola Data <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setModalKelolaKelasOpen(true)}>
                    <Database className="mr-2 h-4 w-4" /> Master Kelas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setModalPindahKelasOpen(true)}>
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Pindah Kelas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setModalNaikKelasOpen(true)}>
                    <ArrowUpCircle className="mr-2 h-4 w-4" /> Naik Kelas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setModalKelulusanOpen(true)}>
                    <GraduationCap className="mr-2 h-4 w-4" /> Kelulusan
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" /> Impor Excel <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={downloadExcelTemplate}>
                    <Download className="mr-2 h-4 w-4" /> Unduh Template Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputExcelRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Impor dari Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <input type="file" ref={fileInputExcelRef} className="hidden" accept=".xlsx, .xls" onChange={handleExcelImport} />
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
          {filteredStudents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
              <Search className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Tidak ada siswa ditemukan</h3>
              <p className="text-sm mt-1 text-slate-500">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
            </div>
          ) : (
            viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/90 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-left text-slate-600">No</th>
                      <th className="px-4 py-3 font-semibold text-left text-slate-600">Identitas Siswa</th>
                      <th className="px-4 py-3 font-semibold text-left text-slate-600">NISN / NIS</th>
                      <th className="px-4 py-3 font-semibold text-center text-slate-600">L/P</th>
                      <th className="px-4 py-3 font-semibold text-center text-slate-600">Kelas</th>
                      <th className="px-4 py-3 font-semibold text-center text-slate-600">Status</th>
                      {(filterStatus === 'Non-Aktif' || filterStatus === 'Semua') && (
                        <th className="px-4 py-3 font-semibold text-left text-slate-600">Keterangan Keluar</th>
                      )}
                      <th className="px-4 py-3 font-semibold text-right text-slate-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-4 py-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{student.nama}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">NIK: {student.nik || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-mono text-slate-700">{student.nisn}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{student.nis || '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={student.jenisKelamin === 'Laki-laki' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-pink-50 text-pink-700 border-pink-200'}>
                            {student.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="secondary" className="font-mono bg-slate-100 text-slate-700 border border-slate-200">{student.kelas || '-'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(student.status)}
                        </td>
                        {(filterStatus === 'Non-Aktif' || filterStatus === 'Semua') && (
                          <td className="px-4 py-3 text-left text-xs">
                            {student.status === 'Non-Aktif' || student.status === 'Pindah' ? (
                              <div className="space-y-0.5">
                                {student.alasanKeluar && (
                                  <p className="font-semibold text-rose-700">{student.alasanKeluar}</p>
                                )}
                                {student.tanggalKeluar && (
                                  <p className="text-slate-500 font-mono">Tgl: {student.tanggalKeluar}</p>
                                )}
                                {!student.alasanKeluar && !student.tanggalKeluar && (
                                  <span className="text-slate-400 font-italic">-</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setSelectedStudent(student); setModalDetailOpen(true); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                             <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-amber-600 hover:bg-amber-50" onClick={() => { setSelectedStudent(student); setModalFormOpen(true); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            {student.status !== 'Alumni' && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive hover:bg-destructive/10" onClick={() => { setSelectedStudent(student); setModalDeleteOpen(true); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col hover:border-indigo-400 hover:shadow-md transition-all relative group">
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(student.status)}
                    </div>
                    
                    <div className="flex gap-3 mb-3 items-start pr-16">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm
                        ${student.jenisKelamin === 'Laki-laki' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {student.nama.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 line-clamp-1">{student.nama}</h4>
                        <p className="text-xs text-slate-500 font-mono mt-1">{student.nisn}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm space-y-1.5 mt-2 flex-1">
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500">Kelas</span>
                        <span className="font-medium font-mono text-slate-700">{student.kelas || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500">L/P</span>
                        <span className="text-slate-700">{student.jenisKelamin === 'Laki-laki' ? 'Laki-laki' : 'Perempuan'}</span>
                      </div>
                      <div className="flex justify-between pb-1.5">
                        <span className="text-slate-500">No. HP</span>
                        <span className="font-mono text-slate-700">{student.hpSiswa || '-'}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={() => { setSelectedStudent(student); setModalDetailOpen(true); }}>
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Detail
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1 text-xs hover:text-amber-600 hover:bg-amber-50" onClick={() => { setSelectedStudent(student); setModalFormOpen(true); }}>
                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                      </Button>
                      {student.status !== 'Alumni' && (
                        <Button size="sm" variant="ghost" className="flex-none px-2 text-xs hover:text-destructive hover:bg-destructive/10" onClick={() => { setSelectedStudent(student); setModalDeleteOpen(true); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>

      {/* MODALS */}
      <TahunAjaranModal 
        isOpen={modalTahunOpen} onClose={() => setModalTahunOpen(false)} 
        currentYear={tahunAjaran} onSave={updateTahunAjaran} 
      />
      <KelolaKelasModal 
        isOpen={modalKelolaKelasOpen} onClose={() => setModalKelolaKelasOpen(false)}
        classes={classes} students={students} updateClasses={updateClasses} syncClasses={syncClasses}
      />
      <PindahKelasModal 
        isOpen={modalPindahKelasOpen} onClose={() => setModalPindahKelasOpen(false)}
        classes={classes} students={students} pindahKelas={pindahKelas}
      />
      <NaikKelasModal
        isOpen={modalNaikKelasOpen} onClose={() => setModalNaikKelasOpen(false)}
        classes={classes} students={students} pindahKelas={pindahKelas} suggestNextClass={suggestNextClass}
      />
      <KelulusanModal 
        isOpen={modalKelulusanOpen} onClose={() => setModalKelulusanOpen(false)}
        classes={classes} students={students} luluskanSiswa={luluskanSiswa}
      />
      
      {/* Student Modals */}
      <StudentFormModal 
        isOpen={modalFormOpen} 
        onClose={() => setModalFormOpen(false)}
        initialData={selectedStudent}
        classes={classes}
        onSave={(data) => {
          if (selectedStudent) {
            updateStudent(selectedStudent.id, data);
            toast({ title: 'Berhasil', description: 'Data siswa berhasil diperbarui.' });
          } else {
            addStudent({ ...data, id: 'std-' + Date.now() + Math.random().toString(36).substr(2, 9) });
            toast({ title: 'Berhasil', description: 'Siswa baru berhasil ditambahkan.' });
          }
        }}
      />
      
      <StudentDetailModal 
        isOpen={modalDetailOpen} 
        onClose={() => setModalDetailOpen(false)} 
        student={selectedStudent}
      />
      
      <ConfirmDeleteModal 
        isOpen={modalDeleteOpen} 
        onClose={() => setModalDeleteOpen(false)}
        studentName={selectedStudent?.nama || ''}
        onConfirm={(alasan, tanggal) => {
          if (selectedStudent) {
            deleteStudent(selectedStudent.id, alasan, tanggal);
            toast({ title: 'Siswa Di-non-aktifkan', description: `${selectedStudent.nama} telah dipindahkan ke daftar Non-Aktif. Alasan: ${alasan}.` });
          }
        }}
      />

      <KelolaAdminModal 
        isOpen={modalAdminOpen}
        onClose={() => setModalAdminOpen(false)}
      />

      <ImportExcelModal
        isOpen={modalImportExcelOpen}
        onClose={() => { setModalImportExcelOpen(false); setExcelFile(null); }}
        sheetNames={excelSheetNames}
        onImport={handleSelectSheetImport}
      />


    </div>
  );
}
