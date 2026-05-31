import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-slate-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />
        <div className="relative z-10 text-white max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center"><GraduationCap className="w-8 h-8" /></div>
            <div><h1 className="text-3xl font-bold">GroupZ1</h1><p className="text-white/70 text-sm">Academic Portal</p></div>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">Online Assignment Submission & Plagiarism Checker</h2>
          <p className="text-lg text-white/70 mb-8">A modern platform for students, lecturers, and administrators to manage assignments, detect plagiarism, and track academic progress.</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-white/10 backdrop-blur p-4"><div className="text-2xl font-bold">3</div><div className="text-xs text-white/60">Portals</div></div>
            <div className="rounded-xl bg-white/10 backdrop-blur p-4"><div className="text-2xl font-bold">AI</div><div className="text-xs text-white/60">Detection</div></div>
            <div className="rounded-xl bg-white/10 backdrop-blur p-4"><div className="text-2xl font-bold">100%</div><div className="text-xs text-white/60">Secure</div></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center gap-2 text-primary-600 mb-2"><GraduationCap className="w-8 h-8" /><span className="text-2xl font-bold">GroupZ1</span></div>
            <p className="text-slate-500 dark:text-slate-400">Sign in to your account</p>
          </div>
          <div className="hidden lg:block text-center mb-8"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome back</h2><p className="text-slate-500 dark:text-slate-400">Sign in to continue to your portal</p></div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="email" className="input pl-11" placeholder="you@university.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type={showPw ? 'text' : 'password'} className="input pl-11 pr-11" placeholder="Enter your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><Eye className="w-5 h-5" /></button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? <span className="flex items-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Signing in...</span> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Staff Login</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">This login is for lecturers and administrators only. Students must <Link to="/register" className="underline font-medium">register here</Link> first.</p>
          </div>

          <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
            New student? <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
