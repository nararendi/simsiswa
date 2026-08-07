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
  ArrowUpCircle, GraduationCap, Eye, Edit, Trash2, LogOut
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
import { KelolaAdminModal } from '@/components/modals/KelolaAdminModal';

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const {
    students, classes, tahunAjaran, isLoaded,
    addStudent, updateStudent, deleteStudent, updateTahunAjaran,
    updateClasses, pindahKelas, luluskanSiswa, suggestNextClass,
    syncClasses, importExcel, downloadExcelTemplate, exportCSV, backupJSON, restoreJSON
  } = useStudents();

  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  
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
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fileInputExcelRef = useRef<HTMLInputElement>(null);
  const fileInputJSONRef = useRef<HTMLInputElement>(null);

  // Derived Stats
  const stats = useMemo(() => {
    return {
      total: students.length,
      aktif: students.filter(s => s.status === 'Aktif').length,
      laki: students.filter(s => s.jenisKelamin === 'Laki-laki').length,
      perempuan: students.filter(s => s.jenisKelamin === 'Perempuan').length
    };
  }, [students]);

  // Filtering
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchKelas = filterKelas === 'Semua' || s.kelas === filterKelas;
      const matchStatus = filterStatus === 'Semua' || s.status === filterStatus;
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
    try {
      const count = await importExcel(file);
      toast({ title: 'Import Berhasil', description: `${count} data siswa telah ditambahkan.` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Import Gagal', description: 'Pastikan format file Excel sesuai template.' });
    }
    if (fileInputExcelRef.current) fileInputExcelRef.current.value = '';
  };

  const handleJSONRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await restoreJSON(file);
      toast({ title: 'Restore Berhasil', description: `${count} data siswa berhasil dipulihkan.` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Restore Gagal', description: 'File JSON tidak valid.' });
    }
    if (fileInputJSONRef.current) fileInputJSONRef.current.value = '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aktif': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0">Aktif</Badge>;
      case 'Alumni': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">Alumni</Badge>;
      case 'Pindah': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">Pindah</Badge>;
      case 'Non-Aktif': return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-0">Non-Aktif</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-30 shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">SIM-SISWA</h1>
              <p className="text-xs text-primary-foreground/70 hidden sm:block">Sistem Informasi Input & Manajemen Data Siswa</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="hover:bg-primary-foreground/10 text-primary-foreground flex gap-2"
              onClick={() => setModalTahunOpen(true)}
            >
              <Calendar className="w-4 h-4" /> 
              <span className="hidden sm:inline">TA: {tahunAjaran || 'Belum diatur'}</span>
            </Button>
            <Button 
              className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-semibold"
              onClick={() => {
                setSelectedStudent(null);
                setModalFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Siswa
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10 text-primary-foreground">
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setModalAdminOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Kelola Akun
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
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
        
        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Siswa</p>
              <h3 className="text-2xl font-bold font-mono text-slate-800">{stats.total}</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Siswa Aktif</p>
              <h3 className="text-2xl font-bold font-mono text-slate-800">{stats.aktif}</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Laki-Laki</p>
              <h3 className="text-2xl font-bold font-mono text-slate-800">{stats.laki}</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
              <Users2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Perempuan</p>
              <h3 className="text-2xl font-bold font-mono text-slate-800">{stats.perempuan}</h3>
            </div>
          </div>
        </div>

        {/* TOOLBAR PANEL */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Cari nama, NISN, atau alamat..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterKelas} onValueChange={setFilterKelas}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Kelas</SelectItem>
                  {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <CheckSquare className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Status</SelectItem>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Alumni">Alumni</SelectItem>
                  <SelectItem value="Pindah">Pindah</SelectItem>
                  <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 bg-slate-100 p-1 rounded-md">
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
                    <FileSpreadsheet className="w-4 h-4" /> Impor / Ekspor <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={downloadExcelTemplate}>
                    <Download className="mr-2 h-4 w-4" /> Unduh Template Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputExcelRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Impor dari Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportCSV}>
                    <Download className="mr-2 h-4 w-4" /> Ekspor ke CSV
                  </DropdownMenuItem>
                  <div className="border-t my-1"></div>
                  <DropdownMenuItem onClick={backupJSON}>
                    <Download className="mr-2 h-4 w-4" /> Backup Database (JSON)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputJSONRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4 text-destructive" /> Restore Database (JSON)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <input type="file" ref={fileInputExcelRef} className="hidden" accept=".xlsx, .xls" onChange={handleExcelImport} />
              <input type="file" ref={fileInputJSONRef} className="hidden" accept=".json" onChange={handleJSONRestore} />
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {filteredStudents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
              <Search className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Tidak ada siswa ditemukan</h3>
              <p className="text-sm mt-1">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
            </div>
          ) : (
            viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-left text-slate-600">No</th>
                      <th className="px-4 py-3 font-semibold text-left text-slate-600">Identitas Siswa</th>
                      <th className="px-4 py-3 font-semibold text-left text-slate-600">NISN / NIS</th>
                      <th className="px-4 py-3 font-semibold text-center text-slate-600">L/P</th>
                      <th className="px-4 py-3 font-semibold text-center text-slate-600">Kelas</th>
                      <th className="px-4 py-3 font-semibold text-center text-slate-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-right text-slate-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
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
                          <Badge variant="secondary" className="font-mono">{student.kelas || '-'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(student.status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-600 hover:text-primary hover:bg-primary/10" onClick={() => { setSelectedStudent(student); setModalDetailOpen(true); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-600 hover:text-amber-600 hover:bg-amber-50" onClick={() => { setSelectedStudent(student); setModalFormOpen(true); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-600 hover:text-destructive hover:bg-destructive/10" onClick={() => { setSelectedStudent(student); setModalDeleteOpen(true); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white flex flex-col group relative">
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(student.status)}
                    </div>
                    
                    <div className="flex gap-3 mb-3 items-start pr-16">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm
                        ${student.jenisKelamin === 'Laki-laki' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {student.nama.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 leading-tight line-clamp-2">{student.nama}</h4>
                        <p className="text-xs text-slate-500 font-mono mt-1">{student.nisn}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm space-y-1.5 mt-2 flex-1">
                      <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span className="text-slate-500">Kelas</span>
                        <span className="font-medium font-mono">{student.kelas || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span className="text-slate-500">L/P</span>
                        <span>{student.jenisKelamin === 'Laki-laki' ? 'Laki-laki' : 'Perempuan'}</span>
                      </div>
                      <div className="flex justify-between pb-1.5">
                        <span className="text-slate-500">No. HP</span>
                        <span className="font-mono">{student.hpSiswa || '-'}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={() => { setSelectedStudent(student); setModalDetailOpen(true); }}>
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Detail
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1 text-xs hover:text-amber-600 hover:bg-amber-50" onClick={() => { setSelectedStudent(student); setModalFormOpen(true); }}>
                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-none px-2 text-xs hover:text-destructive hover:bg-destructive/10" onClick={() => { setSelectedStudent(student); setModalDeleteOpen(true); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
        onConfirm={() => {
          if (selectedStudent) {
            deleteStudent(selectedStudent.id);
            toast({ title: 'Terhapus', description: `Data siswa ${selectedStudent.nama} berhasil dihapus.` });
          }
        }}
      />

      <KelolaAdminModal 
        isOpen={modalAdminOpen}
        onClose={() => setModalAdminOpen(false)}
      />
    </div>
  );
}
