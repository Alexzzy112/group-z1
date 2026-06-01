import { useState, useEffect } from 'react';
import { plagiarism } from '../../services/api';
import { Shield, AlertTriangle, TrendingUp, PieChart, Search } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function StaffPlagiarism() {
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('all');

  useEffect(() => {
    Promise.all([plagiarism.analytics(), plagiarism.reports()])
      .then(([aRes, rRes]) => { setAnalytics(aRes.data); setReports(rRes.data.reports); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filterCat === 'all' ? reports : reports.filter(r => r.category === filterCat);

  const catData = analytics ? {
    labels: ['Low (0-15%)', 'Moderate (16-30%)', 'High (31-50%)', 'Critical (50%+)'],
    datasets: [{ data: [analytics.categories.low, analytics.categories.moderate, analytics.categories.high, analytics.categories.critical], backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#ef4444'], borderWidth: 0 }]
  } : null;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Plagiarism Analytics</h1><p className="text-slate-500 dark:text-slate-400">Monitor and analyze plagiarism across submissions</p></div>

      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="stat-card"><div className="stat-icon bg-blue-100 text-blue-600"><Shield className="w-6 h-6" /></div><div><p className="text-2xl font-bold">{analytics.totalReports}</p><p className="text-sm text-slate-500">Reports Analyzed</p></div></div>
          <div className="stat-card"><div className="stat-icon bg-emerald-100 text-emerald-600"><TrendingUp className="w-6 h-6" /></div><div><p className="text-2xl font-bold">{analytics.averageSimilarity}%</p><p className="text-sm text-slate-500">Avg Similarity</p></div></div>
          <div className="stat-card"><div className="stat-icon bg-amber-100 text-amber-600"><PieChart className="w-6 h-6" /></div><div><p className="text-2xl font-bold">{analytics.highRiskCount}</p><p className="text-sm text-slate-500">High Risk</p></div></div>
          <div className="stat-card"><div className="stat-icon bg-green-100 text-green-600"><AlertTriangle className="w-6 h-6" /></div><div><p className="text-2xl font-bold">{analytics.categories.low}</p><p className="text-sm text-slate-500">Low Risk</p></div></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card"><h3 className="font-semibold text-slate-800 dark:text-white mb-4">Plagiarism Categories</h3>{catData && <div className="flex items-center justify-center h-64"><Doughnut data={catData} options={{ cutout: '60%', plugins: { legend: { position: 'bottom' } } }} /></div>}</div>
        <div className="card">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Category Distribution</h3>
          {analytics && <div className="space-y-4">{Object.entries(analytics.categoryPercentages).map(([key, val]) => (<div key={key}><div className="flex justify-between text-sm mb-1"><span className="capitalize text-slate-700 dark:text-slate-300">{key}</span><span className="font-medium">{val}%</span></div><div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${key === 'low' ? 'bg-emerald-500' : key === 'moderate' ? 'bg-amber-500' : key === 'high' ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${val}%` }} /></div></div>))}</div>}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white">Plagiarism Reports</h3>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">{['all', 'low', 'moderate', 'high', 'critical'].map(c => (<button key={c} onClick={() => setFilterCat(c)} className={`btn-sm whitespace-nowrap ${filterCat === c ? 'btn-primary' : 'btn-secondary'}`}>{c}</button>))}</div>
        </div>
        {filtered.length === 0 ? <p className="text-center py-8 text-slate-500">No reports found</p> : (
          <div className="space-y-2">{filtered.map(r => (<div key={r._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"><div className="min-w-0"><p className="text-sm font-medium text-slate-800 dark:text-white">{r.student?.name || 'Unknown'}</p><p className="text-xs text-slate-500">{r.assignment?.title} - {r.student?.studentId}</p></div><div className="flex items-center gap-3"><span className="text-sm font-bold">{r.overallSimilarity}%</span><span className={`badge ${r.category === 'critical' ? 'badge-danger' : r.category === 'high' ? 'badge-warning' : r.category === 'moderate' ? 'badge-info' : 'badge-success'}`}>{r.category}</span></div></div>))}</div>
        )}
      </div>
    </div>
  );
}
