const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  credits: { type: Number, default: 3 },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  semester: { type: String, default: '' },
  academicYear: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

courseSchema.index({ code: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
