const mongoose = require('mongoose');

const matchDetailSchema = new mongoose.Schema({
  source: { type: String, required: true },
  sourceType: { type: String, enum: ['internal', 'previous_submission', 'institutional', 'internet'], required: true },
  similarityPercentage: { type: Number, required: true },
  matchedText: { type: String, default: '' },
  sourceText: { type: String, default: '' },
  startIndex: { type: Number },
  endIndex: { type: Number }
}, { _id: false });

const plagiarismReportSchema = new mongoose.Schema({
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  overallSimilarity: { type: Number, required: true },
  internetSources: { type: Number, default: 0 },
  publications: { type: Number, default: 0 },
  studentPapers: { type: Number, default: 0 },
  matchDetails: [matchDetailSchema],
  category: { type: String, enum: ['low', 'moderate', 'high', 'critical'], default: 'low' },
  excludedReferences: { type: Boolean, default: false },
  excludedCitations: { type: Boolean, default: false },
  excludedQuotations: { type: Boolean, default: false },
  originalTextLength: { type: Number },
  processedTextLength: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PlagiarismReport', plagiarismReportSchema);
