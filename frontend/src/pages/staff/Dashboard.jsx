import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { courses, assignments, submissions, plagiarism, admin } from '../../services/api';
import { BookOpen, FileText, Users, AlertTriangle, BarChart3, CheckCircle, Clock, TrendingUp, Building2, Shield, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

export default function StaffDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [data, setData] = useState({ courses: [], assignments: [], submissions: [] });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const promises = [
      courses.list(),
      assignments.list(),
      submissions.list(),
    ];
    if (isAdmin) promises.push(admin.stats());
    Promise.all(promises).then(([cRes, aRes, sRes, stRes]) => {
      setData({ courses: cRes.data.courses, assignments: aRes.data.assignments, submissions: sRes.data.submissions });
      if (stRes) setStats(stRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const { courses: cours, assignments: assign, submissions: subs } = data;
  const totalStudents = cours.reduce((a, c) => a + (c.students?.length || 0), 0);
  const pendingGrading = subs.filter(s => s.status === 'submitted' || s.status === 'under_review').length;
  const graded = subs.filter(s => s.status === 'graded').length;
  const flagged = subs.filter(s => (s.plagiarismScore || 0) > 30).length;
  const activeAssignments = assign.filter(a => a.isActive && new Date(a.deadline) > new Date()).length;

  const statusData = {
    labels: ['Graded', 'Under Review', 'Pending', 'Resubmitted'],
    datasets: [{
      data: [graded, subs.filter(s => s.status === 'under_review').length, subs.filter(s => s.status === 'submitted').length, subs.filter(s => s.status === 'resubmitted').length],
      backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'],
      borderWidth: 0,
    }]
  };

  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Submissions', data: [12, 19, 8, 15, 22, subs.length],
      backgroundColor: '#3b82f6', borderRadius: 8,
    }]
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
            {isAdmin ? 'Admin Dashboard' : 'Lecturer Dashboard'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, {user?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <Link to="/staff/assignments" className="btn-primary"><FileText className="w-4 h-4" /> Manage Assignments</Link>
          {isAdmin && <Link to="/staff/users" className="btn-secondary"><Users className="w-4 h-4" /> Manage Users</Link>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="stat-card"><div className="stat-icon bg-blue-100 text-blue-600"><BookOpen className="w-6 h-6" /></div><div><p className="text-2xl font-bold">{cours.length}</p><p className="text-sm text-slate-500">Courses</p></div></div>
        <div className="stat-card"><div className="stat-icon bg-indigo-100 text-indigo-600"><FileText className="w-6 h-6" /></div><div><p className="text-2xl font-bold">{assign.length}</p><p className="text-sm text-slate-500">Assignments</p></div></div>
        <div className="stat-card"><div className="stat-icon bg-emerald-100 text-emerald-600"><Users className="w-6 h-6" /></div><div><p className="text-2xl font-bold">{totalStudents}</p><p className="text-sm text-slate-500">Students</p></div></div>
        <div className="stat-card"><div className="stat-icon bg-amber-100 text-amber-600"><Clock className="w-6 h-6" /></div><div><p className="text-2xl font-bold">{pendingGrading}</p><p className="text-sm text-slate-500">Pending Grade</p></div></div>
        <div className="stat-card"><div className="stat-icon bg-red-100 text-red-600"><AlertTriangle className="w-6 h-6" /></div><div><p className="text-2xl font-bold">{flagged}</p><p className="text-sm text-slate-500">Flagged</p></div></div>
      </div>

      {isAdmin && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><Users className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{stats.totalStudents + stats.totalLecturers}</p><p className="text-xs text-slate-500">Total Users</p></div></div></div>
          <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><Activity className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{stats.totalSubmissions}</p><p className="text-xs text-slate-500">Total Submissions</p></div></div></div>
          <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><AlertTriangle className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{stats.flaggedSubmissions}</p><p className="text-xs text-slate-500">Flagged</p></div></div></div>
          <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><TrendingUp className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{stats.avgPlagiarismScore}%</p><p className="text-xs text-slate-500">Avg Plagiarism</p></div></div></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Submission Status</h3>
          <div className="flex items-center justify-center h-64">
            <Doughnut data={statusData} options={{ cutout: '70%', plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Submission Trends</h3>
          <div className="h-64"><Bar data={monthlyData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} /></div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-800 dark:text-white">Recent Submissions</h3><Link to="/staff/assignments" className="text-sm text-primary-600">View all</Link></div>
        {subs.length === 0 ? <p className="text-slate-500 text-sm text-center py-4">No submissions yet</p> : (
          <div className="space-y-2">
            {subs.slice(0, 10).map(sub => (
              <div key={sub._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{sub.student?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{sub.assignment?.title} - {new Date(sub.submittedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {sub.plagiarismScore !== null && <span className={`badge ${sub.plagiarismScore > 30 ? 'badge-danger' : sub.plagiarismScore > 15 ? 'badge-warning' : 'badge-success'}`}>{sub.plagiarismScore}%</span>}
                  <span className={`badge ${sub.status === 'graded' ? 'badge-success' : 'badge-warning'}`}>{sub.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
