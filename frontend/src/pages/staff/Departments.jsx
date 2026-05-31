import { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffDepartments() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', faculty: '' });

  const fetch = () => { admin.departments().then(({ data }) => setDepts(data.departments)).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editDept) { await admin.updateDepartment(editDept._id, form); toast.success('Department updated'); }
      else { await admin.createDepartment(form); toast.success('Department created'); }
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this department?')) return;
    try { await admin.deleteDepartment(id); toast.success('Department deactivated'); fetch(); } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Departments</h1><p className="text-slate-500 dark:text-slate-400">Manage departments and faculties</p></div>
        <button onClick={() => { setEditDept(null); setForm({ name: '', code: '', faculty: '' }); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> New Department</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {depts.map(d => (
          <div key={d._id} className="card card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600"><Building2 className="w-6 h-6" /></div>
              <div className="flex gap-1">
                <button onClick={() => { setEditDept(d); setForm({ name: d.name, code: d.code, faculty: d.faculty }); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(d._id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-xs font-semibold text-primary-600 uppercase mb-1">{d.code}</p>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-1">{d.name}</h3>
            <p className="text-sm text-slate-500">{d.faculty}</p>
          </div>
        ))}
        {depts.length === 0 && <div className="col-span-full text-center py-12 text-slate-500">No departments found</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{editDept ? 'Edit Department' : 'Create Department'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4"><div><label className="label">Code</label><input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="CSC" required /></div><div><label className="label">Faculty</label><input className="input" value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })} placeholder="Engineering" required /></div></div>
              <div><label className="label">Department Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Computer Science" required /></div>
              <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn-primary">{editDept ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
