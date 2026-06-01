import { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import { Download, FileSpreadsheet, FileText, BarChart3, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffReports() {
  const [reportType, setReportType] = useState('submissions');
  const [stats, setStats] = useState(null);

  useEffect(() => { admin.stats().then(({ data }) => setStats(data)).catch(() => {}); }, []);

  const handleExport = async (format) => {
    try {
      const { data } = await admin.exportReport({ type: reportType, format });
      const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${reportType}-report.${format}`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Reports</h1><p className="text-slate-500 dark:text-slate-400">Generate and download system reports</p></div>
      {stats && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><Users className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{stats.totalStudents + stats.totalLecturers}</p><p className="text-xs text-slate-500">Total Users</p></div></div></div>
        <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><FileText className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{stats.totalSubmissions}</p><p className="text-xs text-slate-500">Submissions</p></div></div></div>
        <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><AlertTriangle className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{stats.flaggedSubmissions}</p><p className="text-xs text-slate-500">Flagged</p></div></div></div>
        <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><BarChart3 className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{stats.avgPlagiarismScore}%</p><p className="text-xs text-slate-500">Avg Plagiarism</p></div></div></div>
      </div>}
      <div className="card">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Generate Report</h3>
        <div className="space-y-4">
          <div><label className="label">Report Type</label><div className="flex flex-wrap gap-2">{[{ id: 'submissions', label: 'Submissions', icon: FileText }, { id: 'users', label: 'Users', icon: Users }, { id: 'plagiarism', label: 'Plagiarism', icon: AlertTriangle }].map(t => (<button key={t.id} onClick={() => setReportType(t.id)} className={`btn ${reportType === t.id ? 'btn-primary' : 'btn-secondary'}`}><t.icon className="w-4 h-4" /> {t.label}</button>))}</div></div>
          <div><label className="label">Download Format</label><div className="flex flex-wrap gap-3"><button onClick={() => handleExport('csv')} className="btn-outline"><FileSpreadsheet className="w-4 h-4" /> Export as CSV</button><button onClick={() => handleExport('json')} className="btn-outline"><FileText className="w-4 h-4" /> Export as JSON</button></div></div>
        </div>
      </div>
    </div>
  );
}
