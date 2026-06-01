const express = require('express');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { logActivity, createNotification } = require('../utils/helpers');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  let query = {};
  if (req.query.course) query.course = req.query.course;
  if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
  if (req.user.role === 'lecturer') query.createdBy = req.user._id;
  const assignments = await Assignment.find(query)
    .populate('course', 'code title')
    .populate('createdBy', 'name')
    .sort({ deadline: -1 });
  res.json({ assignments });
});

router.get('/:id', auth, async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('course', 'code title department')
    .populate('createdBy', 'name email');
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  const submissionCount = await Submission.countDocuments({ assignment: assignment._id });
  res.json({ assignment, submissionCount });
});

router.post('/', auth, roles('admin', 'lecturer'), async (req, res) => {
  const { course, title, description, instructions, maxMarks, deadline, allowedFileTypes, maxFileSize, allowResubmission } = req.body;
  const assignment = await Assignment.create({
    course, title, description, instructions, maxMarks,
    deadline: new Date(deadline),
    allowedFileTypes: allowedFileTypes || ['.pdf', '.docx', '.doc', '.txt', '.zip'],
    maxFileSize: maxFileSize || 1048576,
    allowResubmission: allowResubmission !== false,
    createdBy: req.user._id
  });
  await logActivity(req.user._id, 'create_assignment', 'Assignment', assignment._id, `Created: ${title}`);
  res.status(201).json({ assignment });
});

router.put('/:id', auth, roles('admin', 'lecturer'), async (req, res) => {
  const updates = {};
  ['title', 'description', 'instructions', 'maxMarks', 'deadline', 'allowedFileTypes', 'maxFileSize', 'allowResubmission', 'isActive'].forEach(k => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });
  if (updates.deadline) updates.deadline = new Date(updates.deadline);
  const assignment = await Assignment.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  res.json({ assignment });
});

router.delete('/:id', auth, roles('admin', 'lecturer'), async (req, res) => {
  const assignment = await Assignment.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  res.json({ success: true });
});

router.get('/:id/submissions', auth, roles('admin', 'lecturer'), async (req, res) => {
  const submissions = await Submission.find({ assignment: req.params.id })
    .populate('student', 'name email studentId')
    .populate('plagiarismReport')
    .sort({ submittedAt: -1 });
  res.json({ submissions });
});

module.exports = router;
