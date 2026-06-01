const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch (e) { /* ignore on Vercel */ }

const { connectDB } = require('./utils/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');
const plagiarismRoutes = require('./routes/plagiarism');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;
const isServerless = !!process.env.VERCEL;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});

app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use('/api/', limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const uploadDir = isServerless ? '/tmp/uploads' : path.join(__dirname, '..', 'uploads');
try { if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) { /* read-only fs on Vercel */ }
app.use('/uploads', express.static(uploadDir));

const staticDir = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
}

app.use('/api/', async (req, res, next) => {
  if (req.path === '/health') return next();
  const db = await connectDB();
  if (!db) return res.status(503).json({ error: 'Database connection unavailable' });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/plagiarism', plagiarismRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get(/.*/, (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found' });
  const indexPath = path.join(staticDir, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  res.status(200).json({ message: 'GroupZ1 API is running' });
});

connectDB();

if (!isServerless) {
  app.listen(PORT, () => {
    console.log(`GroupZ1 Platform running at http://localhost:${PORT}`);
  });
}

module.exports = app;
