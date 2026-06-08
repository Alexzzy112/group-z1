const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

const router = express.Router();

router.get('/', auth, roles('admin', 'lecturer'), async (req, res) => {
  const { role, department, search, page = 1, limit = 50 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (department) query.department = department;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } }
    ];
  }
  const users = await User.find(query)
    .populate('department')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const total = await User.countDocuments(query);
  res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

router.get('/:id', auth, async (req, res) => {
  const user = await User.findById(req.params.id).populate('department').populate('enrolledCourses').populate('assignedCourses');
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

router.post('/', auth, roles('admin', 'lecturer'), async (req, res) => {
  const { name, email, password, role, studentId, department, faculty } = req.body;
  if (req.user.role === 'lecturer' && role === 'admin') return res.status(403).json({ error: 'Lecturers cannot create admin accounts.' });
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: 'Email already in use.' });
  const user = await User.create({ name, email, password, role: role || 'student', studentId, department, faculty });
  await logActivity(req.user._id, 'create_user', 'User', user._id, `Created user: ${name} (${role})`);
  res.status(201).json({ user });
});

router.put('/:id', auth, roles('admin', 'lecturer'), async (req, res) => {
  const allowed = ['name', 'email', 'role', 'department', 'faculty', 'isActive', 'studentId'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('department');
  if (!user) return res.status(404).json({ error: 'User not found.' });
  await logActivity(req.user._id, 'update_user', 'User', req.params.id, `Updated user: ${user.name}`);
  res.json({ user });
});

router.delete('/:id', auth, roles('admin'), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ success: true, message: 'User deactivated.' });
});

router.post('/:id/enroll', auth, roles('admin', 'lecturer'), async (req, res) => {
  const { courseId } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { enrolledCourses: courseId } },
    { new: true }
  );
  res.json({ user });
});

router.post('/:id/remove-course', auth, roles('admin', 'lecturer'), async (req, res) => {
  const { courseId } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $pull: { enrolledCourses: courseId } },
    { new: true }
  );
  res.json({ user });
});

module.exports = router;
