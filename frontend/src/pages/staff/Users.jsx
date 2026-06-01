import { useState, useEffect } from 'react';
import { users as userApi } from '../../services/api';
import { Search, Edit2, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffUsers() {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetch = () => {
    setLoading(true);
    userApi.list({ role: roleFilter !== 'all' ? roleFilter : undefined, search: search || undefined }).then(({ data }) => setUserList(data.users)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, [roleFilter]);

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try { await userApi.deactivate(id); toast.success('User deactivated'); fetch(); } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Manage Users</h1><p className="text-slate-500 dark:text-slate-400">View and manage all system users</p></div>
      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9 py-2 text-sm" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetch()} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">{['all', 'student', 'lecturer', 'admin'].map(r => (<button key={r} onClick={() => setRoleFilter(r)} className={`btn-sm whitespace-nowrap ${roleFilter === r ? 'btn-primary' : 'btn-secondary'}`}>{r}</button>))}</div>
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
                    <button onClick={() => handleDeactivate(u._id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {userList.length === 0 && <p className="text-center py-8 text-slate-500">No users found</p>}
        </div>
      </div>
    </div>
  );
}
