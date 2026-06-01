import { useState, useEffect } from 'react';
import { courses as courseApi } from '../../services/api';
import { BookOpen, Users, Plus, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffCourses() {
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState({ code: '', title: '', description: '', credits: 3, semester: '', academicYear: '' });

  const fetch = () => { setLoading(true); courseApi.list().then(({ data }) => setCourseList(data.courses)).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditCourse(null); setForm({ code: '', title: '', description: '', credits: 3, semester: '', academicYear: '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCourse) { await courseApi.update(editCourse._id, form); toast.success('Course updated'); }
      else { await courseApi.create(form); toast.success('Course created'); }
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Operation failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Courses</h1><p className="text-slate-500 dark:text-slate-400">Manage your courses</p></div>
        <button onClick={openCreate} className="btn-primary self-start"><Plus className="w-4 h-4" /> New Course</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {courseList.map(course => (
          <div key={course._id} className="card card-hover group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600"><BookOpen className="w-6 h-6" /></div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditCourse(course); setForm({ code: course.code, title: course.title, description: course.description, credits: course.credits, semester: course.semester, academicYear: course.academicYear }); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><Edit2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">{course.code}</p>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{course.title}</h3>
            {course.description && <p className="text-sm text-slate-500 line-clamp-2 mb-4">{course.description}</p>}
            <div className="flex items-center gap-3 text-xs text-slate-500"><Users className="w-3.5 h-3.5" />{course.students?.length || 0} students</div>
          </div>
        ))}
        {courseList.length === 0 && <div className="col-span-full text-center py-12 text-slate-500">No courses found. Create your first course.</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{editCourse ? 'Edit Course' : 'Create New Course'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Course Code</label><input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="CSC101" required /></div>
                <div><label className="label">Credits</label><input type="number" className="input" value={form.credits} onChange={e => setForm({ ...form, credits: parseInt(e.target.value) })} /></div>
              </div>
              <div><label className="label">Course Title</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Introduction to CS" required /></div>
              <div><label className="label">Description</label><textarea className="input min-h-[80px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Semester</label><input className="input" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} placeholder="Fall 2024" /></div>
                <div><label className="label">Academic Year</label><input className="input" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} placeholder="2024/2025" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editCourse ? 'Update' : 'Create'} Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
