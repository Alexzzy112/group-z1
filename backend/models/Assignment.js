const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  instructions: { type: String, default: '' },
  maxMarks: { type: Number, required: true, default: 100 },
  deadline: { type: Date, required: true },
  allowedFileTypes: { type: [String], default: ['.pdf', '.docx', '.doc', '.txt', '.zip'] },
  maxFileSize: { type: Number, default: 52428800 },
  allowResubmission: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
