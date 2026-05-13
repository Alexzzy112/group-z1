const express = require('express');
const multer = require('multer');
const cors = require('cors');
const stringSimilarity = require('string-similarity');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { put, del } = require('@vercel/blob');
const { MongoClient } = require('mongodb');
const cloudinary = require('cloudinary').v2;

require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const app = express();
const port = process.env.PORT || 3000;
const isServerless = !!process.env.VERCEL;
const storageBase = isServerless ? path.join('/tmp') : __dirname;
const staticRoot = (() => {
    const localRoot = path.join(__dirname);
    const publicRoot = path.join(__dirname, 'public');
    if (fs.existsSync(path.join(publicRoot, 'index.html'))) {
        return publicRoot;
    }
    if (fs.existsSync(path.join(localRoot, 'index.html'))) {
        return localRoot;
    }
    return process.cwd();
})();

const useCloudinary = !!(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_API_KEY);
if (useCloudinary) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
}

const mongoUri = process.env.MONGODB_URI;
const localMongoUri = process.env.MONGODB_LOCAL_URI || process.env.LOCAL_MONGODB_URI || null;
const mongoDbName = process.env.MONGODB_DB || 'groupz1';
let mongoClient;
let referenceCollection;
let submissionsCollection;
let useMongo = false;
let referenceDatabaseCache = [];
let submissionsHistoryCache = [];

async function connectMongo(uri) {
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
        directConnection: false
    });
    await client.connect();
    return client;
}

function loadFallbackData() {
    const sourceDbPath = path.join(staticRoot, 'database.json');
    const sourceSubPath = path.join(staticRoot, 'submissions.json');

    if (fs.existsSync(sourceDbPath)) {
        referenceDatabaseCache = JSON.parse(fs.readFileSync(sourceDbPath, 'utf8'));
    } else {
        referenceDatabaseCache = [
            { id: 1, title: "History of Computer Science", text: "Computer science is the study of computation, information, and automation. Computer science spans theoretical disciplines to practical disciplines." },
            { id: 2, title: "Machine Learning Basics", text: "Machine learning is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks." },
            { id: 3, title: "The Solar System", text: "The Solar System is the gravitationally bound system of the Sun and the objects that orbit it. It formed 4.6 billion years ago from the gravitational collapse of a giant interstellar molecular cloud." },
            { id: 4, title: "Student Sample Assignment", text: "In this assignment, we will explore the impacts of artificial intelligence on modern society. AI has drastically changed how we process data and communicate." }
        ];
        // persist initial reference DB so the virtual DB exists on disk
        try {
            fs.writeFileSync(sourceDbPath, JSON.stringify(referenceDatabaseCache, null, 2));
            console.log('Created', sourceDbPath, 'with sample references');
        } catch (e) {
            console.warn('Could not write sample database.json:', e && e.message ? e.message : e);
        }
    }

    if (fs.existsSync(sourceSubPath)) {
        submissionsHistoryCache = JSON.parse(fs.readFileSync(sourceSubPath, 'utf8'));
    } else {
        submissionsHistoryCache = [];
        // persist empty submissions file so it exists for later writes
        try {
            fs.writeFileSync(sourceSubPath, JSON.stringify(submissionsHistoryCache, null, 2));
            console.log('Created', sourceSubPath);
        } catch (e) {
            console.warn('Could not write submissions.json:', e && e.message ? e.message : e);
        }
    }
}

async function initMongo() {
    const candidates = [];
    if (mongoUri) candidates.push(mongoUri);
    if (localMongoUri && localMongoUri !== mongoUri) candidates.push(localMongoUri);

    // If no MongoDB URIs provided, use the built-in file-based fallback as the virtual DB
    if (candidates.length === 0) {
        console.warn('No MongoDB URI provided. Using file-based virtual database.');
        loadFallbackData();
        return;
    }

    let lastError = null;
    for (const uri of candidates) {
        try {
            mongoClient = await connectMongo(uri);
            console.log('Connected to MongoDB:', uri);
            useMongo = true;
            break;
        } catch (error) {
            lastError = error;
            console.error(`MongoDB connection failed for ${uri}:`, error.message || error);
        }
    }

    if (!useMongo) {
        console.warn('MongoDB is unavailable. Falling back to local JSON storage. Uploads will still work locally, but data is not persisted in MongoDB.');
        loadFallbackData();
        return;
    }

    const db = mongoClient.db(mongoDbName);
    referenceCollection = db.collection('references');
    submissionsCollection = db.collection('submissions');

    const referenceCount = await referenceCollection.countDocuments();
    if (referenceCount === 0) {
        let referenceDatabase = [];
        const sourceDbPath = path.join(staticRoot, 'database.json');
        if (fs.existsSync(sourceDbPath)) {
            referenceDatabase = JSON.parse(fs.readFileSync(sourceDbPath, 'utf8'));
        } else {
            referenceDatabase = [
                { id: 1, title: "History of Computer Science", text: "Computer science is the study of computation, information, and automation. Computer science spans theoretical disciplines to practical disciplines." },
                { id: 2, title: "Machine Learning Basics", text: "Machine learning is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks." },
                { id: 3, title: "The Solar System", text: "The Solar System is the gravitationally bound system of the Sun and the objects that orbit it. It formed 4.6 billion years ago from the gravitational collapse of a giant interstellar molecular cloud." },
                { id: 4, title: "Student Sample Assignment", text: "In this assignment, we will explore the impacts of artificial intelligence on modern society. AI has drastically changed how we process data and communicate." }
            ];
        }
        if (referenceDatabase.length > 0) {
            await referenceCollection.insertMany(referenceDatabase.map((doc, index) => ({
                id: doc.id ?? index + 1,
                title: doc.title,
                text: doc.text
            })));
        }
    }
    const submissionsCount = await submissionsCollection.countDocuments();
    if (submissionsCount === 0 && fs.existsSync(path.join(staticRoot, 'submissions.json'))) {
        const fallbackSubmissions = JSON.parse(fs.readFileSync(path.join(staticRoot, 'submissions.json'), 'utf8'));
        if (Array.isArray(fallbackSubmissions) && fallbackSubmissions.length > 0) {
            await submissionsCollection.insertMany(fallbackSubmissions);
        }
    }
}

// Setup Middleware
app.use(cors());
// Increase body size limits for file uploads
const bodyLimit = isServerless ? '10mb' : '100mb';
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ limit: bodyLimit, extended: true }));

// Serve frontend static files (index.html, styles.css, script.js)
app.use(express.static(staticRoot));

// Serve uploads directory
const uploadDir = path.join(storageBase, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Setup Multer for disk storage locally or memory storage on Vercel
const storage = isServerless ? multer.memoryStorage() : multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ 
    storage: storage, 
    limits: { 
        fileSize: isServerless ? 10 * 1024 * 1024 : 50 * 1024 * 1024 // 10MB on Vercel, 50MB locally
    } 
}); // File size limit


// Function to extract text based on file type
async function extractText(file) {
    const mimeType = file.mimetype;
    let fileContent;
    
    if (file.buffer) {
        fileContent = file.buffer.toString('utf8');
    } else {
        fileContent = fs.readFileSync(file.path, 'utf8');
    }
    
    if (mimeType === 'text/plain') {
        return fileContent;
    } else if (mimeType === 'application/pdf') {
        // We removed pdf-parse due to Node v24 compatibility issues. 
        // For the prototype, we simulate extraction by using the filename or a dummy string
        // In production, we'd use a different parser.
        return "Simulated text from PDF: " + file.originalname + " " + "Computer science is the study of computation.";
    } else if (mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Simulate extraction for Word documents for the prototype.
        return "Simulated text from Word document: " + file.originalname + " " + "Computer science is the study of computation.";
    } else {
        throw new Error('Unsupported file format. Please upload PDF or TXT.');
    }
}

async function uploadToCloudinary(file) {
    if (!useCloudinary) {
        throw new Error('Cloudinary is not configured.');
    }

    // Choose resource_type: use 'raw' for non-image files (pdf/doc/docx), otherwise 'auto'
    const isRaw = /\.(pdf|docx|doc|txt)$/i.test(file.originalname) || (file.mimetype && !file.mimetype.startsWith('image'));
    const resourceType = isRaw ? 'raw' : 'auto';

    if (file.path && fs.existsSync(file.path)) {
        return await cloudinary.uploader.upload(file.path, {
            resource_type: resourceType,
            folder: 'groupz1_uploads'
        });
    }

    return await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                folder: 'groupz1_uploads'
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        Readable.from(file.buffer).pipe(uploadStream);
    });
}

// Upload and Scan Endpoint
app.post('/api/scan', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 1. Extract Text
        const uploadedText = await extractText(req.file);
        
        if (!uploadedText || uploadedText.trim() === '') {
            return res.status(400).json({ error: 'Could not extract text from file or file is empty' });
        }

        // 2. Perform Similarity Check
        let highestSimilarity = 0;
        let matchedSource = "None";
        let bestMatchDetails = null;

        // Extract reference texts to compare against
        const referenceDatabase = useMongo
            ? await referenceCollection.find().toArray()
            : referenceDatabaseCache;
        const referenceTexts = referenceDatabase.map(doc => doc.text);
        
        if (referenceTexts.length > 0) {
            const matchResult = stringSimilarity.findBestMatch(uploadedText, referenceTexts);
            highestSimilarity = Math.round(matchResult.bestMatch.rating * 100);
            bestMatchDetails = referenceDatabase[matchResult.bestMatchIndex];
            matchedSource = bestMatchDetails?.title || matchedSource;
        }

        // To make the report look realistic, we'll assign the highest similarity to the overall score
        // and distribute it pseudo-randomly among categories, but heavily weighting 'Student Papers' if it's a known assignment, etc.
        const score = highestSimilarity;
        
        // Distribution (just for the UI)
        let internetScore = 0;
        let publicationScore = 0;
        let studentScore = 0;
        
        if (score > 0) {
            // For this mockup, let's just distribute the score
            internetScore = Math.round(score * 0.4);
            publicationScore = Math.round(score * 0.3);
            studentScore = score - internetScore - publicationScore;
        }

        // Save file to Cloudinary if configured, otherwise preserve local upload URL.
        let fileUrl = '/uploads/' + req.file.filename;
        let cloudinaryPublicId = null;

        if (useCloudinary) {
            try {
                const uploadResult = await uploadToCloudinary(req.file);
                fileUrl = uploadResult.secure_url;
                cloudinaryPublicId = uploadResult.public_id;
            } catch (uploadError) {
                console.error('Cloudinary upload failed:', uploadError);
                if (!isServerless) {
                    fileUrl = '/uploads/' + req.file.filename;
                } else {
                    fileUrl = '/uploads/failed-to-upload';
                }
            }
        }

        // Save submission to history
        const newSubmission = {
            id: Date.now().toString(),
            studentId: req.body.studentId || 'Unknown ID',
            studentEmail: req.body.studentEmail || 'No Email',
            fileName: req.file.originalname,
            fileUrl: fileUrl,
            cloudinaryPublicId: cloudinaryPublicId,
            date: new Date().toISOString(),
            score: score,
            breakdown: { internet: internetScore, publications: publicationScore, students: studentScore },
            topMatch: matchedSource
        };
        
        if (useMongo) {
            const savedSubmission = await submissionsCollection.insertOne(newSubmission);
            newSubmission._id = savedSubmission.insertedId;
        } else {
            submissionsHistoryCache.unshift(newSubmission);
            try {
                fs.writeFileSync(path.join(__dirname, 'submissions.json'), JSON.stringify(submissionsHistoryCache, null, 2));
            } catch (err) {
                console.error('Failed to save submission to local cache:', err);
            }
        }

        // 3. Return Results (include fileUrl and id so client can download)
        setTimeout(() => {
            // Added artificial delay to simulate "processing time"
            res.json({
                success: true,
                id: newSubmission.id,
                fileUrl: newSubmission.fileUrl,
                score: score,
                breakdown: {
                    internet: internetScore,
                    publications: publicationScore,
                    students: studentScore
                },
                topMatch: matchedSource,
                message: score > 30 ? 'Significant similarity detected.' : 'Originality is within acceptable limits.'
            });
        }, 1500);

    } catch (error) {
        console.error("Scan Error:", error);
        res.status(500).json({ error: error.message || 'An error occurred during scanning' });
    }
});

// Admin Login Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Hardcoded credentials for prototype
    if (username === 'admin' && password === 'password') {
        res.json({ success: true, token: 'fake-jwt-token-123' });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// Admin Dashboard Endpoint
app.get('/api/submissions', async (req, res) => {
    // In a real app, verify the authorization token here
    try {
        const submissions = useMongo
            ? await submissionsCollection.find().sort({ date: -1 }).toArray()
            : submissionsHistoryCache.slice();
        res.json({ success: true, submissions });
    } catch (error) {
        console.error('Failed to fetch submissions:', error);
        res.status(500).json({ success: false, error: 'Failed to retrieve submissions' });
    }
});

// Admin Delete Endpoint
app.delete('/api/submissions/:id', async (req, res) => {
    const { id } = req.params;

    try {
        let submissionToDelete;
        if (useMongo) {
            submissionToDelete = await submissionsCollection.findOne({ id: id });
        } else {
            submissionToDelete = submissionsHistoryCache.find(sub => sub.id === id);
        }

        if (!submissionToDelete) {
            return res.status(404).json({ success: false, error: 'Submission not found' });
        }

        if (submissionToDelete.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(submissionToDelete.cloudinaryPublicId, { resource_type: 'auto' });
            } catch (e) {
                console.error('Could not delete file from Cloudinary:', e);
            }
        } else if (submissionToDelete.fileUrl) {
            if (submissionToDelete.fileUrl.includes('public.blob.vercel-storage.com')) {
                try {
                    if (process.env.BLOB_READ_WRITE_TOKEN) {
                        await del(submissionToDelete.fileUrl);
                    }
                } catch (e) {
                    console.error('Could not delete file from Vercel Blob:', e);
                }
            } else {
                const filePath = path.join(uploadDir, path.basename(submissionToDelete.fileUrl));
                if (fs.existsSync(filePath)) {
                    try { fs.unlinkSync(filePath); } catch (e) { console.error('Could not delete file:', e); }
                }
            }
        }

        if (useMongo) {
            const deleteResult = await submissionsCollection.deleteOne({ id: id });
            if (deleteResult.deletedCount === 1) {
                res.json({ success: true });
            } else {
                res.status(500).json({ success: false, error: 'Failed to delete submission' });
            }
        } else {
            submissionsHistoryCache = submissionsHistoryCache.filter(sub => sub.id !== id);
            try {
                fs.writeFileSync(path.join(__dirname, 'submissions.json'), JSON.stringify(submissionsHistoryCache, null, 2));
            } catch (err) {
                console.error('Failed to update local submissions cache:', err);
            }
            res.json({ success: true });
        }
    } catch (error) {
        console.error('Delete submission error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete submission' });
    }
});

// Download submission file (serve local file or redirect to remote)
app.get('/api/submissions/:id/download', async (req, res) => {
    const { id } = req.params;
    try {
        let submission;
        if (useMongo) {
            submission = await submissionsCollection.findOne({ id: id });
        } else {
            submission = submissionsHistoryCache.find(s => s.id === id);
        }

        if (!submission) {
            return res.status(404).json({ success: false, error: 'Submission not found' });
        }
            const fileUrl = submission.fileUrl;

            // If we have a Cloudinary public id, try to resolve a delivery URL server-side and redirect
            if (submission.cloudinaryPublicId) {
                try {
                    const info = await cloudinary.api.resource(submission.cloudinaryPublicId, { resource_type: 'auto' });
                    if (info && info.secure_url) {
                        return res.redirect(info.secure_url);
                    }
                } catch (e) {
                    console.warn('Could not resolve Cloudinary resource via API:', e && e.message ? e.message : e);
                    // Try generating a signed delivery URL as a fallback (useful for private/authenticated assets)
                    try {
                        const signedUrl = cloudinary.url(submission.cloudinaryPublicId, { resource_type: 'auto', sign_url: true, secure: true });
                        if (signedUrl) return res.redirect(signedUrl);
                    } catch (e2) {
                        console.warn('Could not generate signed Cloudinary URL:', e2 && e2.message ? e2.message : e2);
                    }
                    // Fall through to try fileUrl/local serve
                }
            }

            // If fileUrl is an absolute http(s) URL (Cloudinary raw URL or external blob), redirect to it
            if (typeof fileUrl === 'string' && /^https?:\/\//i.test(fileUrl)) {
                return res.redirect(fileUrl);
            }

            // If it's a Vercel Blob public URL, redirect as well
            if (typeof fileUrl === 'string' && fileUrl.includes('public.blob.vercel-storage.com')) {
                return res.redirect(fileUrl);
            }

            // Otherwise assume it's a local upload under /uploads
            if (typeof fileUrl === 'string' && fileUrl.startsWith('/uploads/')) {
                const filename = path.basename(fileUrl);
                const filePath = path.join(uploadDir, filename);
                if (fs.existsSync(filePath)) {
                    return res.download(filePath, submission.fileName || filename, (err) => {
                        if (err) console.error('Download error:', err);
                    });
                }
                return res.status(404).json({ success: false, error: 'File not found on server' });
            }

            return res.status(400).json({ success: false, error: 'Unsupported file location' });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ success: false, error: 'Failed to download file' });
    }
});

// Fallback route: serve index.html for all non-API client-side routes
app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    return res.sendFile(path.join(staticRoot, 'index.html'));
});

initMongo().then(() => {
    if (!isServerless) {
        app.listen(port, () => {
            console.log(`Plagiarism Scanner API running at http://localhost:${port}`);
        });
    }
}).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

module.exports = app;
