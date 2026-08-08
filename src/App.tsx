import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import Home from '@/pages/home';
import Login from '@/pages/login';
import { useEffect } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';

const queryClient = new QueryClient();

// HOC/Wrapper untuk mengamankan route
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('sim_auth_token') === 'logged_in_admin';
    if (!isLoggedIn) {
      setLocation('/login');
    }
  }, [setLocation]);

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => <ProtectedRoute component={Home} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Jika database belum dikonfigurasi di Vercel/Environment Variables
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">Database Belum Dikonfigurasi</h2>
            <p className="text-sm text-slate-600">
              Aplikasi ini membutuhkan variabel lingkungan database Supabase agar dapat berjalan di Vercel.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-800">Langkah Konfigurasi di Dashboard Vercel:</p>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
              <li>Buka dashboard Vercel Anda.</li>
              <li>Pilih menu <strong>Settings</strong> → <strong>Environment Variables</strong>.</li>
              <li>Tambahkan variabel berikut sesuai dengan file <code className="font-mono text-rose-600">.env</code> lokal Anda:
                <ul className="list-disc list-inside pl-4 mt-1 font-mono text-[10px] space-y-0.5 text-rose-700 bg-rose-50/50 p-1.5 rounded">
                  <li>VITE_SUPABASE_URL</li>
                  <li>VITE_SUPABASE_ANON_KEY</li>
                </ul>
              </li>
              <li>Klik <strong>Save</strong> dan lakukan <strong>Redeploy</strong> project Anda di Vercel.</li>
            </ol>
          </div>
          <p className="text-[11px] text-slate-400">
            Detail konfigurasi dapat dibaca pada file .env di folder project lokal Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
