const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Department = require('../models/Department');
const PlagiarismReport = require('../models/PlagiarismReport');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { logActivity } = require('../utils/helpers');

const router = express.Router();

router.get('/stats', auth, roles('admin'), async (req, res) => {
  const [totalStudents, totalLecturers, totalCourses, totalSubmissions, totalAssignments, totalDepartments] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'lecturer', isActive: true }),
    Course.countDocuments({ isActive: true }),
    Submission.countDocuments(),
    Assignment.countDocuments({ isActive: true }),
    Department.countDocuments({ isActive: true })
  ]);
  const recentSubmissions = await Submission.find().populate('student', 'name email studentId').populate('assignment', 'title').sort({ submittedAt: -1 }).limit(10);
  const flaggedSubmissions = await Submission.find({ plagiarismScore: { $gt: 30 } }).countDocuments();
  const avgPlagiarism = await PlagiarismReport.aggregate([{ $group: { _id: null, avg: { $avg: '$overallSimilarity' } } }]);
  res.json({
    totalStudents, totalLecturers, totalCourses, totalSubmissions, totalAssignments, totalDepartments,
    flaggedSubmissions,
    avgPlagiarismScore: avgPlagiarism.length > 0 ? Math.round(avgPlagiarism[0].avg) : 0,
    recentSubmissions
  });
});

router.get('/departments', auth, roles('admin'), async (req, res) => {
  const departments = await Department.find().populate('headOfDepartment', 'name email').sort({ name: 1 });
  res.json({ departments });
});

router.post('/departments', auth, roles('admin'), async (req, res) => {
  const { name, code, faculty, headOfDepartment } = req.body;
  const existing = await Department.findOne({ code: code.toUpperCase() });
  if (existing) return res.status(400).json({ error: 'Department code already exists.' });
  const dept = await Department.create({ name, code: code.toUpperCase(), faculty, headOfDepartment });
  await logActivity(req.user._id, 'create_department', 'Department', dept._id, `Created: ${name}`);
  res.status(201).json({ department: dept });
});

router.put('/departments/:id', auth, roles('admin'), async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ department: dept });
});

router.delete('/departments/:id', auth, roles('admin'), async (req, res) => {
  await Department.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true });
});

router.post('/notify', auth, roles('admin'), async (req, res) => {
  const { title, message, type, targetRole } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Title and message are required.' });
  const query = { isActive: true };
  if (targetRole) query.role = targetRole;
  const users = await User.find(query);
  const notifications = users.map(u => ({
    user: u._id, type: type || 'announcement', title, message,
    link: req.body.link || ''
  }));
  await Notification.insertMany(notifications);
  await logActivity(req.user._id, 'send_notification', 'Notification', null, `Sent notification: ${title} to ${users.length} users`);
  res.json({ success: true, sentTo: users.length });
});

router.get('/logs', auth, roles('admin'), async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const logs = await ActivityLog.find()
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const total = await ActivityLog.countDocuments();
  res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

router.get('/reports/export', auth, roles('admin'), async (req, res) => {
  const { type, format } = req.query;
  let data;
  if (type === 'submissions') {
    data = await Submission.find().populate('student', 'name email studentId').populate('assignment', 'title').populate('course', 'code title').lean();
  } else if (type === 'users') {
    data = await User.find().populate('department', 'name').lean();
  } else if (type === 'plagiarism') {
    data = await PlagiarismReport.find().populate('student', 'name email studentId').populate('assignment', 'title').lean();
  } else {
    return res.status(400).json({ error: 'Invalid report type.' });
  }

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
    if (data.length > 0) {
      const headers = Object.keys(data[0]).filter(k => !k.startsWith('_'));
      res.write(headers.join(',') + '\n');
      data.forEach(row => {
        res.write(headers.map(h => {
          const val = row[h];
          if (val && typeof val === 'object') return val.name || val.title || val.code || '';
          return val !== null && val !== undefined ? String(val) : '';
        }).join(',') + '\n');
      });
    }
    res.end();
  } else {
    res.json({ data });
  }
});

module.exports = router;
