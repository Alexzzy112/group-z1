const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { logActivity } = require('../utils/helpers');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  let query = {};
  if (req.query.all !== 'true') {
    if (req.user.role === 'lecturer') query.lecturer = req.user._id;
    if (req.user.role === 'student') query.students = req.user._id;
  }
  if (req.query.department) query.department = req.query.department;
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { code: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  const courses = await Course.find(query)
    .populate('lecturer', 'name email')
    .populate('department', 'name code')
    .sort({ createdAt: -1 });
  res.json({ courses });
});

router.get('/:id', auth, async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('lecturer', 'name email')
    .populate('department', 'name code')
    .populate('students', 'name email studentId');
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  res.json({ course });
});

router.post('/', auth, roles('admin', 'lecturer'), async (req, res) => {
  const { code, title, description, credits, department, semester, academicYear } = req.body;
  const existing = await Course.findOne({ code: code.toUpperCase() });
  if (existing) return res.status(400).json({ error: 'Course code already exists.' });
  const course = await Course.create({
    code: code.toUpperCase(), title, description, credits, department: department || undefined,
    lecturer: req.user._id, semester, academicYear
  });
  await logActivity(req.user._id, 'create_course', 'Course', course._id, `Created course: ${code}`);
  res.status(201).json({ course });
});

router.put('/:id', auth, roles('admin', 'lecturer'), async (req, res) => {
  const updates = {};
  ['title', 'description', 'credits', 'semester', 'academicYear', 'isActive', 'lecturer'].forEach(k => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });
  const course = await Course.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  res.json({ course });
});

router.delete('/:id', auth, roles('admin'), async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  res.json({ success: true });
});

router.post('/:id/enroll-students', auth, roles('admin', 'lecturer'), async (req, res) => {
  const { studentIds } = req.body;
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { students: { $each: studentIds } } },
    { new: true }
  );
  await User.updateMany(
    { _id: { $in: studentIds } },
    { $addToSet: { enrolledCourses: req.params.id } }
  );
  res.json({ course });
});

module.exports = router;
