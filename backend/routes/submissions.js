const express = require('express');
const fs = require('fs');
const path = require('path');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const upload = require('../middleware/upload');
const { runPlagiarismCheck } = require('../services/plagiarismService');
const { logActivity, createNotification } = require('../utils/helpers');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

router.post('/submit', auth, roles('student'), upload.array('files', 5), async (req, res) => {
  try {
    const { assignmentId, textContent } = req.body;
    const assignment = await Assignment.findById(assignmentId).populate('course');
    if (!assignment || !assignment.isActive) return res.status(404).json({ error: 'Assignment not found.' });
    if (new Date() > new Date(assignment.deadline)) return res.status(400).json({ error: 'Deadline has passed.' });
    if (req.user.role === 'student' && !assignment.course.students.includes(req.user._id)) {
      return res.status(403).json({ error: 'You are not enrolled in this course.' });
    }

    const existing = await Submission.findOne({ assignment: assignmentId, student: req.user._id, isResubmission: false });
    if (existing && !assignment.allowResubmission) {
      return res.status(400).json({ error: 'Resubmission not allowed for this assignment.' });
    }

    const files = (req.files || []).map(f => ({
      originalName: f.originalname,
      fileName: f.filename,
      fileUrl: '/uploads/' + f.filename,
      fileType: path.extname(f.originalname),
      fileSize: f.size
    }));

    let extractedText = textContent || '';
    if (!extractedText && files.length > 0) {
      for (const f of req.files) {
        if (f.mimetype === 'text/plain' || path.extname(f.originalname).toLowerCase() === '.txt') {
          try {
            extractedText += fs.readFileSync(f.path, 'utf8') + ' ';
          } catch (e) {}
        }
      }
    }

    const submissionData = {
      assignment: assignmentId,
      student: req.user._id,
      course: assignment.course._id,
      files,
      textContent: extractedText.substring(0, 50000),
      isResubmission: !!existing
    };

    if (existing) {
      submissionData.resubmissionOf = existing._id;
    }

    const submission = await Submission.create(submissionData);

    await logActivity(req.user._id, 'submit_assignment', 'Submission', submission._id, `Submitted: ${assignment.title}`);

    let plagiarismReport = null;
    if (extractedText && extractedText.trim().length > 50) {
      try {
        plagiarismReport = await runPlagiarismCheck(submission._id);
      } catch (e) {
        console.error('Plagiarism check failed:', e.message);
      }
    }

    res.status(201).json({ submission, plagiarismReport });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  let query = {};
  if (req.user.role === 'student') query.student = req.user._id;
  if (req.user.role === 'lecturer') query.course = { $in: req.user.assignedCourses || [] };
  if (req.query.assignment) query.assignment = req.query.assignment;
  if (req.query.course) query.course = req.query.course;
  if (req.query.status) query.status = req.query.status;

  const submissions = await Submission.find(query)
    .populate('assignment', 'title deadline maxMarks')
    .populate('student', 'name email studentId')
    .populate('course', 'code title')
    .populate('plagiarismReport')
    .sort({ submittedAt: -1 });
  res.json({ submissions });
});

router.get('/:id', auth, async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate('assignment')
    .populate('student', 'name email studentId')
    .populate('course', 'code title')
    .populate('plagiarismReport')
    .populate('gradedBy', 'name');
  if (!submission) return res.status(404).json({ error: 'Submission not found.' });
  res.json({ submission });
});

router.put('/:id/grade', auth, roles('admin', 'lecturer'), async (req, res) => {
  const { grade, feedback, status } = req.body;
  const submission = await Submission.findByIdAndUpdate(
    req.params.id,
    { grade, feedback, status: status || 'graded', gradedBy: req.user._id, gradedAt: new Date() },
    { new: true }
  ).populate('student').populate('assignment');
  if (!submission) return res.status(404).json({ error: 'Submission not found.' });

  await createNotification(
    submission.student._id, 'grade',
    `Assignment Graded: ${submission.assignment.title}`,
    `Your assignment has been graded: ${grade}/${submission.assignment.maxMarks}`,
    '/student/submissions'
  );
  await logActivity(req.user._id, 'grade_submission', 'Submission', submission._id, `Graded: ${grade}/${submission.assignment.maxMarks}`);

  res.json({ submission });
});

router.put('/:id/feedback', auth, roles('admin', 'lecturer'), upload.single('feedbackFile'), async (req, res) => {
  const { feedback } = req.body;
  const updateData = { feedback };
  if (req.file) {
    updateData.feedbackFile = {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileUrl: '/uploads/' + req.file.filename
    };
  }
  const submission = await Submission.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json({ submission });
});

router.delete('/:id', auth, async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) return res.status(404).json({ error: 'Submission not found.' });
  if (req.user.role === 'student' && submission.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }
  for (const file of submission.files) {
    const filePath = path.join(uploadDir, file.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await Submission.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.post('/:id/run-plagiarism', auth, roles('admin', 'lecturer'), async (req, res) => {
  try {
    const report = await runPlagiarismCheck(req.params.id);
    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
