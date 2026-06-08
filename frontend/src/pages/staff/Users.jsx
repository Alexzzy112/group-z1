import { useState, useEffect } from 'react';
import { users as userApi } from '../../services/api';
import { Search, Edit2, Trash2, Users, Plus, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffUsers() {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', studentId: '' });

  const fetch = () => {
    setLoading(true);
    userApi.list({ role: roleFilter !== 'all' ? roleFilter : undefined, search: search || undefined }).then(({ data }) => setUserList(data.users)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, [roleFilter]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'student', studentId: '' });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, studentId: u.studentId || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        const payload = { name: form.name, email: form.email, role: form.role, studentId: form.studentId };
        await userApi.update(editUser._id, payload);
        toast.success('User updated');
      } else {
        if (!form.password) return toast.error('Password is required for new users');
        await userApi.create(form);
        toast.success('User created');
      }
      setShowModal(false);
      fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Operation failed'); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try { await userApi.deactivate(id); toast.success('User deactivated'); fetch(); } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Manage Users</h1><p className="text-slate-500 dark:text-slate-400">View, create, and manage all system users</p></div>
        <button onClick={openCreate} className="btn-primary self-start"><UserPlus className="w-4 h-4" /> Add User</button>
      </div>
      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9 py-2 text-sm" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetch()} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">{['all', 'student'].map(r => (<button key={r} onClick={() => setRoleFilter(r)} className={`btn-sm whitespace-nowrap ${roleFilter === r ? 'btn-primary' : 'btn-secondary'}`}>{r}</button>))}</div>
          <button onClick={fetch} className="btn-primary btn-sm"><Search className="w-4 h-4" /> Search</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase">Role</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase">Student ID</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userList.map(u => (
                <tr key={u._id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-2"><span className="font-medium text-slate-800 dark:text-white">{u.name}</span></td>
                  <td className="py-3 px-2 text-sm text-slate-500">{u.email}</td>
                  <td className="py-3 px-2"><span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'lecturer' ? 'badge-info' : 'badge-success'}`}>{u.role}</span></td>
                  <td className="py-3 px-2 text-sm text-slate-500">{u.studentId || '-'}</td>
                  <td className="py-3 px-2"><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="py-3 px-2 text-right">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeactivate(u._id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {userList.length === 0 && <p className="text-center py-8 text-slate-500">No users found</p>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{editUser ? 'Edit User' : 'Create New User'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
              {!editUser && <div><label className="label">Password</label><input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editUser} minLength={6} /></div>}
              <div><label className="label">Role</label>
                <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="student">Student</option>
                </select>
              </div>
              <div><label className="label">Student ID (optional)</label><input className="input" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editUser ? 'Update' : 'Create'} User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}