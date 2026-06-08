import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';

import StudentDashboard from './pages/student/Dashboard';
import StudentCourses from './pages/student/Courses';
import StudentSubmit from './pages/student/SubmitAssignment';
import StudentSubmissions from './pages/student/Submissions';

import StaffDashboard from './pages/staff/Dashboard';
import StaffCourses from './pages/staff/Courses';
import StaffAssignments from './pages/staff/Assignments';
import StaffPlagiarism from './pages/staff/Plagiarism';
import StaffUsers from './pages/staff/Users';
import StaffDepartments from './pages/staff/Departments';
import StaffReports from './pages/staff/Reports';
import StaffSettings from './pages/staff/Settings';
import AdminNotifications from './pages/staff/AdminNotifications';

function AppLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Navbar onMenuClick={() => setMobileOpen(!mobileOpen)} />
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  const staffRoles = ['lecturer', 'admin'];
  const getDefaultRoute = (role) => {
    if (role === 'student') return '/student/dashboard';
    return '/staff/dashboard';
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getDefaultRoute(user.role)} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={getDefaultRoute(user.role)} /> : <Register />} />
      <Route path="/" element={user ? <Navigate to={getDefaultRoute(user.role)} /> : <Navigate to="/login" />} />

      <Route path="/student/dashboard" element={<ProtectedRoute roles={['student']}><AppLayout><StudentDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/student/courses" element={<ProtectedRoute roles={['student']}><AppLayout><StudentCourses /></AppLayout></ProtectedRoute>} />
      <Route path="/student/submit" element={<ProtectedRoute roles={['student']}><AppLayout><StudentSubmit /></AppLayout></ProtectedRoute>} />
      <Route path="/student/submissions" element={<ProtectedRoute roles={['student']}><AppLayout><StudentSubmissions /></AppLayout></ProtectedRoute>} />

      <Route path="/staff/dashboard" element={<ProtectedRoute roles={staffRoles}><AppLayout><StaffDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/staff/courses" element={<ProtectedRoute roles={staffRoles}><AppLayout><StaffCourses /></AppLayout></ProtectedRoute>} />
      <Route path="/staff/assignments" element={<ProtectedRoute roles={staffRoles}><AppLayout><StaffAssignments /></AppLayout></ProtectedRoute>} />
      <Route path="/staff/plagiarism" element={<ProtectedRoute roles={staffRoles}><AppLayout><StaffPlagiarism /></AppLayout></ProtectedRoute>} />
      <Route path="/staff/users" element={<ProtectedRoute roles={['admin']}><AppLayout><StaffUsers /></AppLayout></ProtectedRoute>} />
      <Route path="/staff/departments" element={<ProtectedRoute roles={['admin']}><AppLayout><StaffDepartments /></AppLayout></ProtectedRoute>} />
      <Route path="/staff/reports" element={<ProtectedRoute roles={['admin']}><AppLayout><StaffReports /></AppLayout></ProtectedRoute>} />
      <Route path="/staff/settings" element={<ProtectedRoute roles={['admin']}><AppLayout><StaffSettings /></AppLayout></ProtectedRoute>} />
      <Route path="/staff/notifications" element={<ProtectedRoute roles={['admin']}><AppLayout><AdminNotifications /></AppLayout></ProtectedRoute>} />

      <Route path="/lecturer/*" element={user && staffRoles.includes(user.role) ? <Navigate to="/staff/dashboard" /> : <Navigate to="/login" />} />
      <Route path="/admin/*" element={user && staffRoles.includes(user.role) ? <Navigate to="/staff/dashboard" /> : <Navigate to="/login" />} />

      <Route path="*" element={<Navigate to={user ? getDefaultRoute(user.role) : '/login'} />} />
    </Routes>
  );
}
