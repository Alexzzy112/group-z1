import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignments, submissions } from '../../services/api';
import { Upload, File, X, FileText, CheckCircle, AlertTriangle, Loader2, ScrollText, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubmitAssignment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropRef = useRef(null);
  const [assignList, setAssignList] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [assignmentDetail, setAssignmentDetail] = useState(null);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    assignments.list().then(({ data }) => setAssignList(data.assignments.filter(a => a.isActive))).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      assignments.get(selectedAssignment).then(({ data }) => setAssignmentDetail(data.assignment)).catch(() => setAssignmentDetail(null));
    }
  }, [selectedAssignment]);

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragIn = (e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); };
  const handleDragOut = (e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); if (e.dataTransfer.files.length > 0) addFiles(Array.from(e.dataTransfer.files)); };

  const addFiles = (newFiles) => {
    const valid = newFiles.filter(f => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      return ['.pdf', '.docx', '.doc', '.txt', '.zip', '.rar', '.7z'].includes(ext);
    });
    if (valid.length !== newFiles.length) toast.error('Some files were skipped (invalid format)');
    setFiles(prev => [...prev, ...valid].slice(0, 5));
  };

  const removeFile = (index) => setFiles(files.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!selectedAssignment) return toast.error('Please select an assignment');
    if (files.length === 0 && !textContent.trim()) return toast.error('Please upload a file or enter text');
    setUploading(true);
    setProgress(10);
    const formData = new FormData();
    formData.append('assignmentId', selectedAssignment);
    if (textContent.trim()) formData.append('textContent', textContent);
    files.forEach(f => formData.append('files', f));
    try {
      setProgress(60);
      const { data } = await submissions.submit(formData);
      setProgress(100);
      toast.success('Assignment submitted successfully!');
      setTimeout(() => navigate('/student/submissions'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Submit Assignment</h1><p className="text-slate-500 dark:text-slate-400">Upload your assignment files for plagiarism checking and grading</p></div>

      <div className="card">
        <label className="label">Select Assignment</label>
        <select className="input" value={selectedAssignment} onChange={(e) => setSelectedAssignment(e.target.value)} disabled={uploading}>
          <option value="">-- Choose an assignment --</option>
          {assignList.map(a => (
            <option key={a._id} value={a._id} disabled={new Date(a.deadline) < new Date()}>
              {a.title} ({a.course?.code || 'N/A'}) - Due: {new Date(a.deadline).toLocaleDateString()} {new Date(a.deadline) < new Date() ? '(CLOSED)' : ''}
            </option>
          ))}
        </select>
      </div>

      {assignmentDetail && (
        <div className="card bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">{assignmentDetail.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{assignmentDetail.description}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
                <span>Max Marks: <strong>{assignmentDetail.maxMarks}</strong></span>
                <span>Deadline: <strong className={new Date(assignmentDetail.deadline) < new Date() ? 'text-red-500' : ''}>{new Date(assignmentDetail.deadline).toLocaleString()}</strong></span>
                <span>Allowed: <strong>{assignmentDetail.allowedFileTypes?.join(', ')}</strong></span>
                {assignmentDetail.allowResubmission && <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="w-4 h-4" />Resubmission allowed</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <label className="label">Upload Files (PDF, DOCX, DOC, TXT, ZIP)</label>
        <div
          ref={dropRef}
          className={`file-drop-zone ${dragging ? 'dragging' : ''}`}
          onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <Upload className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-500 mb-3" />
          <p className="font-medium text-slate-700 dark:text-slate-300">Drag & drop files here, or click to browse</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Supports PDF, DOCX, DOC, TXT, ZIP (Max 100MB each)</p>
        </div>
        <input id="file-input" type="file" multiple className="hidden" accept=".pdf,.docx,.doc,.txt,.zip,.rar,.7z" onChange={(e) => addFiles(Array.from(e.target.files))} />

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3 min-w-0">
                  <File className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <div className="min-w-0"><p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{f.name}</p><p className="text-xs text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p></div>
                </div>
                {!uploading && <button onClick={() => removeFile(i)} className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <label className="label">Or Paste Text Content</label>
        <textarea className="input min-h-[120px] resize-y" placeholder="Paste your assignment text here (optional, for plagiarism checking)..." value={textContent} onChange={(e) => setTextContent(e.target.value)} disabled={uploading} />
      </div>

      {uploading && (
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Processing submission & running plagiarism check...</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button className="btn-secondary" onClick={() => navigate('/student/submissions')} disabled={uploading}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={uploading || !selectedAssignment}>
          {uploading ? 'Submitting...' : <><Upload className="w-4 h-4" /> Submit Assignment</>}
        </button>
      </div>
    </div>
  );
}
