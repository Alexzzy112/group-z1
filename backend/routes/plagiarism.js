const express = require('express');
const PlagiarismReport = require('../models/PlagiarismReport');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { runPlagiarismCheck } = require('../services/plagiarismService');

const router = express.Router();

router.get('/reports', auth, async (req, res) => {
  let query = {};
  if (req.query.submission) query.submission = req.query.submission;
  if (req.query.assignment) query.assignment = req.query.assignment;
  if (req.query.student) query.student = req.query.student;
  if (req.query.category) query.category = req.query.category;
  const reports = await PlagiarismReport.find(query)
    .populate('submission')
    .populate('student', 'name email studentId')
    .populate('assignment', 'title')
    .sort({ createdAt: -1 });
  res.json({ reports });
});

router.get('/reports/:id', auth, async (req, res) => {
  const report = await PlagiarismReport.findById(req.params.id)
    .populate('submission')
    .populate('student', 'name email studentId')
    .populate('assignment', 'title');
  if (!report) return res.status(404).json({ error: 'Report not found.' });
  res.json({ report });
});

router.post('/analyze', auth, async (req, res) => {
  const { submissionId } = req.body;
  try {
    const report = await runPlagiarismCheck(submissionId);
    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics', auth, roles('admin', 'lecturer'), async (req, res) => {
  const match = {};
  if (req.query.assignment) match.assignment = req.query.assignment;
  if (req.query.course) {
    const assignments = await Assignment.find({ course: req.query.course }).select('_id');
    match.assignment = { $in: assignments.map(a => a._id) };
  }

  const reports = await PlagiarismReport.find(match);
  const total = reports.length;
  const avgSimilarity = total > 0 ? Math.round(reports.reduce((s, r) => s + r.overallSimilarity, 0) / total) : 0;
  const categories = { low: 0, moderate: 0, high: 0, critical: 0 };
  reports.forEach(r => { categories[r.category]++; });
  const highRisk = reports.filter(r => r.overallSimilarity > 30).length;

  res.json({
    totalReports: total,
    averageSimilarity: avgSimilarity,
    highRiskCount: highRisk,
    categories,
    categoryPercentages: {
      low: total > 0 ? Math.round((categories.low / total) * 100) : 0,
      moderate: total > 0 ? Math.round((categories.moderate / total) * 100) : 0,
      high: total > 0 ? Math.round((categories.high / total) * 100) : 0,
      critical: total > 0 ? Math.round((categories.critical / total) * 100) : 0
    }
  });
});

module.exports = router;
