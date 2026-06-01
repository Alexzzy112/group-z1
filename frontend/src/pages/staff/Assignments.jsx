import { useState, useEffect } from 'react';
import { assignments as assignApi, courses as courseApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FileText, Plus, Edit2, Trash2, Eye, Calendar, Clock, Users, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffAssignments() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [assignList, setAssignList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAssign, setEditAssign] = useState(null);
  const [form, setForm] = useState({ course: '', title: '', description: '', instructions: '', maxMarks: 100, deadline: '', allowedFileTypes: ['.pdf', '.docx', '.doc', '.txt', '.zip'], allowResubmission: true });
  const [showSubs, setShowSubs] = useState(false);
  const [viewSubs, setViewSubs] = useState([]);

  const fetch = () => {
    setLoading(true);
    Promise.all([assignApi.list(), courseApi.list()]).then(([aRes, cRes]) => {
      setAssignList(aRes.data.assignments);
      setCourseList(cRes.data.courses);
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditAssign(null);
    setForm({ course: '', title: '', description: '', instructions: '', maxMarks: 100, deadline: '', allowedFileTypes: ['.pdf', '.docx', '.doc', '.txt', '.zip'], allowResubmission: true });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const matched = courseList.find(c => c.code.toUpperCase() === form.course.trim().toUpperCase());
      if (!matched) return toast.error('Course not found. Check the course code.');
      const payload = { ...form, course: matched._id };
      if (editAssign) { await assignApi.update(editAssign._id, payload); toast.success('Assignment updated'); }
      else { await assignApi.create(payload); toast.success('Assignment created'); }
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    try { await assignApi.delete(id); toast.success('Assignment deleted'); fetch(); }
    catch { toast.error('Delete failed'); }
  };

  const viewSubmissions = async (id) => {
    try {
      const { data } = await assignApi.submissions(id);
      setViewSubs(data.submissions);
      setShowSubs(true);
    } catch { toast.error('Failed to load submissions'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Assignments</h1><p className="text-slate-500 dark:text-slate-400">Create and manage assignments</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> New Assignment</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignList.map(a => (
          <div key={a._id} className="card card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600"><FileText className="w-5 h-5" /></div>
              <div className="flex gap-1">
                <button onClick={() => viewSubmissions(a._id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400" title="View submissions"><Eye className="w-4 h-4" /></button>
                <button onClick={() => { setEditAssign(a); setForm({ course: a.course?.code || a.course, title: a.title, description: a.description, instructions: a.instructions, maxMarks: a.maxMarks, deadline: new Date(a.deadline).toISOString().slice(0, 16), allowedFileTypes: a.allowedFileTypes, allowResubmission: a.allowResubmission }); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-xs text-primary-600 font-medium mb-1">{a.course?.code || 'N/A'}</p>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{a.title}</h3>
            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{a.description}</p>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(a.deadline).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{Math.ceil((new Date(a.deadline) - new Date()) / 86400000)}d left</span>
              <span>{a.maxMarks} marks</span>
            </div>
          </div>
        ))}
        {assignList.length === 0 && <div className="col-span-full text-center py-12 text-slate-500">No assignments yet</div>}
      </div>

      {showSubs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSubs(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Submissions ({viewSubs.length})</h3>
              <button className="btn-secondary btn-sm" onClick={() => setShowSubs(false)}>Close</button>
            </div>
            {viewSubs.length === 0 ? <p className="text-center py-8 text-slate-500">No submissions yet</p> : (
              <div className="space-y-2">
                {viewSubs.map(sub => (
                  <div key={sub._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div><p className="text-sm font-medium text-slate-800 dark:text-white">{sub.student?.name || 'Unknown'}</p><p className="text-xs text-slate-500">{sub.student?.studentId} - {new Date(sub.submittedAt).toLocaleString()}</p></div>
                    <div className="flex items-center gap-2">
                      {sub.plagiarismScore !== null && <span className={`badge ${sub.plagiarismScore > 30 ? 'badge-danger' : 'badge-warning'}`}>{sub.plagiarismScore}%</span>}
                      {sub.grade !== null ? <span className="badge badge-success">{sub.grade}/{sub.maxMarks}</span> : <span className="badge badge-warning">Pending</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{editAssign ? 'Edit Assignment' : 'Create New Assignment'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label">Course Code</label><input className="input" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} placeholder="e.g. CSC101" required /></div>
              <div><label className="label">Title</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div><label className="label">Description</label><textarea className="input min-h-[80px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="label">Instructions</label><textarea className="input min-h-[80px]" value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Max Marks</label><input type="number" className="input" value={form.maxMarks} onChange={e => setForm({ ...form, maxMarks: parseInt(e.target.value) })} /></div>
                <div><label className="label">Deadline</label><input type="datetime-local" className="input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required /></div>
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" id="resubmit" checked={form.allowResubmission} onChange={e => setForm({ ...form, allowResubmission: e.target.checked })} /><label htmlFor="resubmit" className="text-sm text-slate-700 dark:text-slate-300">Allow resubmission</label></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn-primary">{editAssign ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
