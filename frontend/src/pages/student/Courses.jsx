import { useState, useEffect } from 'react';
import { courses } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Clock, User, FileText, ChevronRight } from 'lucide-react';

export default function StudentCourses() {
  const { user } = useAuth();
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courses.list().then(({ data }) => setCourseList(data.courses)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Courses</h1><p className="text-slate-500 dark:text-slate-400">Courses you are currently enrolled in</p></div>

      {courseList.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">No Courses Enrolled</h3>
          <p className="text-slate-500 dark:text-slate-400">You are not enrolled in any courses yet. Contact your lecturer or administrator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courseList.map(course => (
            <div key={course._id} className="card card-hover group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-primary-500 transition-colors" />
              </div>
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">{course.code}</p>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{course.title}</h3>
              {course.description && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{course.description}</p>}
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-auto">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{course.lecturer?.name || 'N/A'}</span>
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{course.credits} Credits</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
