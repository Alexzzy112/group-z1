const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  files: [{
    originalName: String,
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    cloudinaryPublicId: String
  }],
  textContent: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'submitted', 'under_review', 'graded', 'resubmitted'], default: 'submitted' },
  plagiarismScore: { type: Number, default: null },
  plagiarismReport: { type: mongoose.Schema.Types.ObjectId, ref: 'PlagiarismReport' },
  grade: { type: Number, default: null },
  maxMarks: { type: Number, default: 100 },
  feedback: { type: String, default: '' },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: { type: Date },
  isResubmission: { type: Boolean, default: false },
  resubmissionOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

submissionSchema.index({ assignment: 1, student: 1 });
submissionSchema.index({ course: 1, student: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
