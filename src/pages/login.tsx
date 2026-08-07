import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Database, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Ambil kredensial admin dari localStorage atau gunakan default
    const storedAdmin = localStorage.getItem('sim_admin_cred');
    const adminCred = storedAdmin 
      ? JSON.parse(storedAdmin) 
      : { email: 'admin@gmail.com', password: 'admin123' };

    setTimeout(() => {
      setIsLoading(false);
      if (email === adminCred.email && password === adminCred.password) {
        localStorage.setItem('sim_auth_token', 'logged_in_admin');
        toast({
          title: 'Login Berhasil',
          description: 'Selamat datang kembali di SIM-SISWA!',
        });
        setLocation('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Gagal',
          description: 'Email atau password salah.',
        });
      }
    }, 8000); // loading animation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Database className="w-7 h-7" />
        </div>
        <div>
          <h1 className="font-bold text-2xl leading-tight tracking-tight text-slate-800">SIM-SISWA</h1>
          <p className="text-xs text-slate-600">Sistem Informasi Input & Manajemen Siswa</p>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-xl border-slate-200/80 bg-white">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">Masuk ke SIM</CardTitle>
          <CardDescription className="text-slate-500">
            Masukkan email dan password admin Anda
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@gmail.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
              {isLoading ? 'Sedang Masuk...' : 'Masuk'}
            </Button>
            <div className="text-xs text-center text-slate-400 mt-2">
              Default: admin@gmail.com / admin123
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
