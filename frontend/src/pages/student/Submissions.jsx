import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { submissions as subApi } from '../../services/api';
import { FileText, Download, Eye, Filter, Search, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentSubmissions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetch = () => {
    setLoading(true);
    subApi.list().then(({ data }) => setSubs(data.submissions)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const filtered = subs.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search && !s.assignment?.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    const map = { pending: 'badge-neutral', submitted: 'badge-info', under_review: 'badge-warning', graded: 'badge-success', resubmitted: 'badge-neutral' };
    return map[status] || 'badge-neutral';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Submissions</h1><p className="text-slate-500 dark:text-slate-400">Track your assignment submissions and grades</p></div>
        <div className="flex items-center gap-2">
          <button onClick={fetch} className="btn-secondary btn-sm"><RefreshCw className="w-4 h-4" /> Refresh</button>
          <Link to="/student/submit" className="btn-primary btn-sm"><FileText className="w-4 h-4" /> New Submission</Link>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9 py-2 text-sm" placeholder="Search by assignment title..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            {['all', 'submitted', 'under_review', 'graded'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}>{s.replace('_', ' ')}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">No Submissions Found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">{subs.length === 0 ? 'You have not submitted any assignments yet.' : 'Try adjusting your filters.'}</p>
            {subs.length === 0 && <Link to="/student/submit" className="btn-primary">Submit Your First Assignment</Link>}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(sub => (
              <div key={sub._id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 transition-colors">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800 dark:text-white">{sub.assignment?.title || 'Unknown'}</span>
                      <span className={`badge ${getStatusBadge(sub.status)}`}>{sub.status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{sub.files?.length || 0} file(s)</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(sub.submittedAt).toLocaleString()}</span>
                      {sub.assignment?.maxMarks && <span>Max: {sub.assignment.maxMarks} marks</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {sub.plagiarismScore !== null && (
                      <div className="text-center">
                        <div className={`text-lg font-bold ${sub.plagiarismScore > 30 ? 'text-red-500' : sub.plagiarismScore > 15 ? 'text-amber-500' : 'text-emerald-500'}`}>{sub.plagiarismScore}%</div>
                        <div className="text-[10px] text-slate-500">Similarity</div>
                      </div>
                    )}
                    {sub.grade !== null && (
                      <div className="text-center">
                        <div className={`text-lg font-bold ${sub.grade >= (sub.assignment?.maxMarks || 100) * 0.7 ? 'text-emerald-500' : 'text-amber-500'}`}>{sub.grade}/{sub.assignment?.maxMarks || 100}</div>
                        <div className="text-[10px] text-slate-500">Grade</div>
                      </div>
                    )}
                  </div>
                </div>
                {sub.feedback && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Feedback:</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{sub.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
