import { useState, useEffect } from 'react';
import { admin as adminApi, notifications as notifApi } from '../../services/api';
import { Bell, Send, Trash2, Users, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminNotifications() {
  const [notifList, setNotifList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', message: '', type: 'announcement', targetRole: '' });

  const fetchSent = () => {
    setLoading(true);
    notifApi.list().then(({ data }) => setNotifList(data.notifications)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetchSent(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return toast.error('Title and message required');
    try {
      const { data } = await adminApi.notify(form);
      toast.success(`Notification sent to ${data.sentTo} users`);
      setForm({ title: '', message: '', type: 'announcement', targetRole: '' });
    } catch { toast.error('Failed to send notification'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Send Notification</h1><p className="text-slate-500 dark:text-slate-400">Send announcements to students and lecturers</p></div>

      <div className="card">
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Notification Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="announcement">Announcement</option>
                <option value="deadline">Deadline Reminder</option>
                <option value="general">General</option>
              </select>
            </div>
            <div><label className="label">Target Audience</label>
              <select className="input" value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })}>
                <option value="">All Users</option>
                <option value="student">Students Only</option>
                <option value="lecturer">Lecturers Only</option>
              </select>
            </div>
          </div>
          <div><label className="label">Title</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Notification title" required /></div>
          <div><label className="label">Message</label><textarea className="input min-h-[100px]" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Enter your notification message..." required /></div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary"><Send className="w-4 h-4" /> Send Notification</button>
          </div>
        </form>
      </div>
    </div>
  );
}