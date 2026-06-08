import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, BookOpen, FileText, Upload, BarChart3, Users, Building2, Settings, LogOut, Shield, GraduationCap, FileSpreadsheet, LogIn, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const studentLinks = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/courses', icon: BookOpen, label: 'My Courses' },
  { to: '/student/submit', icon: Upload, label: 'Submit Assignment' },
  { to: '/student/submissions', icon: FileText, label: 'My Submissions' },
  { to: '/student/dashboard', icon: LogIn, label: 'Register Courses' },
];

const staffLinks = [
  { to: '/staff/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/staff/courses', icon: BookOpen, label: 'Courses' },
  { to: '/staff/assignments', icon: FileText, label: 'Assignments' },
  { to: '/staff/users', icon: Users, label: 'Users' },
  { to: '/staff/plagiarism', icon: Shield, label: 'Plagiarism' },
];

const adminLinks = [
  { to: '/staff/departments', icon: Building2, label: 'Departments' },
  { to: '/staff/reports', icon: FileSpreadsheet, label: 'Reports' },
  { to: '/staff/notifications', icon: Bell, label: 'Notifications' },
  { to: '/staff/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  const links = isStudent ? studentLinks : staffLinks;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const sidebarContent = (
    <aside className={`h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200 dark:border-slate-700">
        <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <span className="font-bold text-lg text-slate-800 dark:text-white">GroupZ1</span>}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onMobileClose}
            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}

        {!isStudent && !collapsed && (
          <div className="pt-4 pb-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-4">Administration</div>
          </div>
        )}
        {!isStudent && adminLinks.map((link) => {
          if (!isAdmin && link.to !== '/staff/reports') return null;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onMobileClose}
              className={({ isActive }) => isActive ? 'sidebar-link-active' : (isAdmin ? 'sidebar-link-inactive' : 'sidebar-link-inactive opacity-50 pointer-events-none')}
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="sidebar-link-inactive w-full">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      <button onClick={onToggle} className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm">
        <svg className={`w-3 h-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:flex fixed left-0 top-0 h-screen z-40">
        {sidebarContent}
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="fixed left-0 top-0 h-screen animate-slide-up">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
