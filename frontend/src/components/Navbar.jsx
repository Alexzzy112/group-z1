import { useAuth } from '../context/AuthContext';
import { Bell, Moon, Sun, Menu, X, CheckCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { notifications as notifApi } from '../services/api';
import { Link } from 'react-router-dom';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const [dark, setDark] = useState(localStorage.getItem('darkMode') === 'true');
  const [notifCount, setNotifCount] = useState(0);
  const [notifList, setNotifList] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef();

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  const fetchNotifs = () => {
    if (user) {
      notifApi.list().then(({ data }) => {
        setNotifCount(data.unreadCount);
        setNotifList(data.notifications);
      }).catch(() => {});
    }
  };

  useEffect(() => { fetchNotifs(); }, [user]);

  useEffect(() => {
    const handleClick = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleDark = () => {
    setDark(!dark);
    localStorage.setItem('darkMode', !dark);
  };

  const markRead = async (id) => {
    try { await notifApi.markRead(id); fetchNotifs(); } catch {}
  };

  const markAllRead = async () => {
    try { await notifApi.markAllRead(); fetchNotifs(); } catch {}
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 sticky top-0 z-30">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotif(!showNotif)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors relative">
            <Bell className="w-5 h-5" />
            {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{notifCount > 9 ? '9+' : notifCount}</span>}
          </button>
          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border dark:border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b dark:border-slate-700">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-white">Notifications</h3>
                {notifCount > 0 && <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline flex items-center gap-1"><CheckCheck className="w-3 h-3" /> Mark all read</button>}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifList.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-6">No notifications</p>
                ) : notifList.map(n => (
                  <div key={n._id} className={`px-4 py-3 border-b dark:border-slate-700 last:border-0 ${!n.isRead ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                      {!n.isRead && <button onClick={() => markRead(n._id)} className="shrink-0 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><X className="w-3 h-3 text-slate-400" /></button>}
                    </div>
                  </div>
                ))}
              </div>
              <Link to={user?.role === 'student' ? '/student/submissions' : '/staff/assignments'} className="block text-center text-xs text-primary-600 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50" onClick={() => setShowNotif(false)}>View all</Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-800 dark:text-white">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
