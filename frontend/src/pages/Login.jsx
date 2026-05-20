import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login({ username, password });
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto mb-4 border-t-primary-600"></div>
          <p className="text-slate-600 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  // Don't show login form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="card w-full max-w-md p-8 relative z-10 animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-lg mb-6 shadow-sm border border-slate-200 p-4">
            <Logo size={56} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            PT. Kencana Sari Jaya
          </h1>
          <p className="text-slate-600 font-medium">Plywood Production Monitoring</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
            <span className="text-slate-500 text-sm">Industrial Manufacturing System</span>
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-900 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="label text-charcoal-800 font-semibold mb-2.5 block">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="Masukkan username"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="label text-charcoal-800 font-semibold mb-2.5 block">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Masukkan password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3.5 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all"
          >
            {loading ? (
              <>
                <div className="spinner w-5 h-5"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Masuk ke Sistem</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-600 text-center mb-4 font-semibold uppercase tracking-wider">Default Credentials</p>
          <div className="space-y-2 text-xs">
            <div className="bg-slate-50 rounded-lg p-3 font-mono text-slate-800 border border-slate-200">
              <span className="font-bold text-primary-600">PPIC:</span> trisni / password123
            </div>
            <div className="bg-slate-50 rounded-lg p-3 font-mono text-slate-800 border border-slate-200">
              <span className="font-bold text-primary-600">PRODUKSI:</span> produksi / password123
            </div>
            <div className="bg-slate-50 rounded-lg p-3 font-mono text-slate-800 border border-slate-200">
              <span className="font-bold text-primary-600">BOS:</span> bos / password123
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}