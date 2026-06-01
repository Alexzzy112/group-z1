import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, BookOpen, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', studentId: '', faculty: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill required fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      toast.success('Registration successful!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative pb-12 sm:pb-0">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-slate-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />
        <div className="relative z-10 text-white max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center"><GraduationCap className="w-8 h-8" /></div>
            <div><h1 className="text-3xl font-bold">GroupZ1</h1><p className="text-white/70 text-sm">Academic Portal</p></div>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">Student Registration</h2>
          <p className="text-lg text-white/70">Create your student account to submit assignments, track your progress, and ensure originality with our plagiarism detection system.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pt-8 pb-16 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Student Registration</h2>
            <p className="text-slate-500 dark:text-slate-400">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" className="input pl-11" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="email" className="input pl-11" placeholder="you@university.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="student">Student</option>
                </select>
              </div>
              <div>
                <label className="label">Student ID</label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" className="input pl-11" placeholder="FT24CMP0001" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
                </div>
              </div>
            </div>
            <div>
              <label className="label">Faculty / Department</label>
              <div className="relative">
                <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" className="input pl-11" placeholder="Computer Science" value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type={showPw ? 'text' : 'password'} className="input pl-11 pr-11" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Eye className="w-5 h-5" /></button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
            Already registered? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
          </p>

          <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Staff?</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">Lecturers and administrators use pre-issued accounts. Go to the <Link to="/login" className="underline font-medium">sign in page</Link>.</p>
          </div>
        </div>
      </div>
      <footer className="absolute bottom-0 left-0 right-0 text-center py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-t border-slate-200 dark:border-slate-700 z-10">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium">Contact:</span> Nasarawa State University, Keffi — info@nsuk.edu.ng
        </p>
      </footer>
    </div>
  );
}
