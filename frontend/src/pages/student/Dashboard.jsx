import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submissions, assignments, courses as courseApi } from '../../services/api';
import { FileText, Upload, Clock, CheckCircle, AlertTriangle, BookOpen, TrendingUp, BarChart3, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ submissions: [], assignments: [], courses: [] });
  const [loading, setLoading] = useState(true);
  const [allCourses, setAllCourses] = useState([]);
  const [enrollCode, setEnrollCode] = useState('');

  useEffect(() => {
    Promise.all([
      submissions.list({ student: user._id }),
      assignments.list({ course: { $in: user.enrolledCourses } }),
      courseApi.list(),
      courseApi.list({ all: 'true' }),
    ]).then(([subRes, assignRes, courseRes, allRes]) => {
      setData({ submissions: subRes.data.submissions, assignments: assignRes.data.assignments, courses: courseRes.data.courses });
      setAllCourses(allRes.data.courses || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!enrollCode.trim()) return;
    try {
      await courseApi.enroll(enrollCode.trim());
      toast.success(`Enrolled in ${enrollCode.trim().toUpperCase()}`);
      setEnrollCode('');
      const [courseRes, allRes] = await Promise.all([courseApi.list(), courseApi.list({ all: 'true' })]);
      setData(prev => ({ ...prev, courses: courseRes.data.courses }));
      setAllCourses(allRes.data.courses || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Enrollment failed');
    }
  };

  const { submissions: subs, assignments: assign, courses: cours } = data;
  const pending = subs.filter(s => s.status === 'pending' || s.status === 'submitted').length;
  const graded = subs.filter(s => s.status === 'graded').length;
  const underReview = subs.filter(s => s.status === 'under_review').length;
  const flagged = subs.filter(s => (s.plagiarismScore || 0) > 30).length;
  const avgScore = subs.length > 0 ? Math.round(subs.reduce((a, s) => a + (s.grade || 0), 0) / subs.length) : 0;
  const upcomingDeadlines = assign.filter(a => new Date(a.deadline) > new Date()).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 5);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Student Dashboard</h1><p className="text-slate-500 dark:text-slate-400">Welcome back, {user?.name}</p></div>
        <Link to="/student/submit" className="btn-primary self-start"><Upload className="w-4 h-4" /> Submit Assignment</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="stat-card"><div className="stat-icon bg-blue-100 text-blue-600"><FileText className="w-6 h-6" /></div><div><p className="text-2xl font-bold text-slate-800 dark:text-white">{subs.length}</p><p className="text-sm text-slate-500">Total Submissions</p></div></div>
        <div className="stat-card"><div className="stat-icon bg-amber-100 text-amber-600"><Clock className="w-6 h-6" /></div><div><p className="text-2xl font-bold text-slate-800 dark:text-white">{pending}</p><p className="text-sm text-slate-500">Pending Review</p></div></div>
        <div className="stat-card"><div className="stat-icon bg-emerald-100 text-emerald-600"><CheckCircle className="w-6 h-6" /></div><div><p className="text-2xl font-bold text-slate-800 dark:text-white">{graded}</p><p className="text-sm text-slate-500">Graded</p></div></div>
        <div className="stat-card"><div className="stat-icon bg-red-100 text-red-600"><AlertTriangle className="w-6 h-6" /></div><div><p className="text-2xl font-bold text-slate-800 dark:text-white">{flagged}</p><p className="text-sm text-slate-500">Flagged {'>30%'}</p></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-800 dark:text-white">Recent Submissions</h3><Link to="/student/submissions" className="text-sm text-primary-600 hover:text-primary-700">View all</Link></div>
          {subs.length === 0 ? <p className="text-slate-500 text-sm py-4 text-center">No submissions yet. Submit your first assignment!</p> : (
            <div className="space-y-3">
              {subs.slice(0, 5).map(sub => (
                <div key={sub._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="min-w-0"><p className="text-sm font-medium text-slate-800 dark:text-white truncate">{sub.assignment?.title || 'Unknown Assignment'}</p><p className="text-xs text-slate-500">{new Date(sub.submittedAt).toLocaleDateString()}</p></div>
                  <div className="flex items-center gap-2">
                    {sub.plagiarismScore !== null && <span className={`badge ${sub.plagiarismScore > 30 ? 'badge-danger' : sub.plagiarismScore > 15 ? 'badge-warning' : 'badge-success'}`}>{sub.plagiarismScore}%</span>}
                    <span className={`badge ${sub.status === 'graded' ? 'badge-success' : sub.status === 'under_review' ? 'badge-warning' : 'badge-neutral'}`}>{sub.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-800 dark:text-white">Upcoming Deadlines</h3><BookOpen className="w-5 h-5 text-slate-400" /></div>
          {upcomingDeadlines.length === 0 ? <p className="text-slate-500 text-sm py-4 text-center">No upcoming deadlines</p> : (
            <div className="space-y-3">
              {upcomingDeadlines.map(a => (
                <div key={a._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="min-w-0"><p className="text-sm font-medium text-slate-800 dark:text-white truncate">{a.title}</p><p className="text-xs text-slate-500">{a.course?.code || 'Course'}</p></div>
                  <div className="text-right"><p className="text-sm font-medium text-slate-800 dark:text-white">{new Date(a.deadline).toLocaleDateString()}</p><p className={`text-xs ${new Date(a.deadline) < new Date(Date.now() + 86400000 * 3) ? 'text-red-500' : 'text-slate-500'}`}>{Math.ceil((new Date(a.deadline) - new Date()) / 86400000)} days left</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">My Courses</h3>
        {cours.length === 0 ? <p className="text-slate-500 text-sm py-4 text-center">No enrolled courses</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {cours.map(c => (
              <div key={c._id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-primary-600 mb-1">{c.code}</p>
                <p className="font-medium text-slate-800 dark:text-white mb-1">{c.title}</p>
                <p className="text-xs text-slate-500">{c.lecturer?.name || 'N/A'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Register for a Course</h3>
        <form onSubmit={handleEnroll} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input className="input flex-1" value={enrollCode} onChange={e => setEnrollCode(e.target.value)} placeholder="Enter course code (e.g. CSC101)" />
          <button type="submit" className="btn-primary whitespace-nowrap"><LogIn className="w-4 h-4" /> Enroll</button>
        </form>
        {allCourses.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Available Courses:</p>
            <div className="flex flex-wrap gap-2">
              {allCourses.filter(ac => !cours.some(ec => ec._id === ac._id)).slice(0, 10).map(c => (
                <button key={c._id} type="button" onClick={() => setEnrollCode(c.code)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-100 hover:text-primary-700 transition-colors">
                  {c.code} - {c.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
