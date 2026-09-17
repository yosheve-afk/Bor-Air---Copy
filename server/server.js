/**
 * ============================================
 * REVIEW SYSTEM — Express Server
 * ============================================
 * 
 * Node.js/Express backend with Multer for handling
 * multipart/form-data file uploads (photos + videos).
 * Data is persisted in SQLite via better-sqlite3.
 * 
 * ENDPOINTS:
 *   GET  /api/reviews       → Fetch all reviews (newest first)
 *   POST /api/reviews       → Submit a new review with optional media
 * 
 * DEPENDENCIES:
 *   npm install express multer better-sqlite3 cors
 * 
 * RUN:
 *   node server/server.js
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getAllReviews, addReview } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// CORS — allow front-end origin
// =============================================
app.use(cors());

// =============================================
// STATIC FILES — serve uploaded media
// =============================================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploads at /uploads/*
app.use('/uploads', express.static(uploadsDir));

// Serve front-end files from project root
app.use(express.static(path.join(__dirname, '..')));

// =============================================
// MULTER — file upload configuration
// =============================================
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Unique filename: timestamp-random + original extension
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedImage = /^image\/(jpeg|jpg|png|gif|webp)$/;
  const allowedVideo = /^video\/(mp4|webm|ogg|mov|quicktime)$/;

  if (allowedImage.test(file.mimetype) || allowedVideo.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipe file tidak diizinkan. Hanya gambar (JPEG, PNG, GIF, WebP) dan video (MP4, WebM, OGG, MOV).'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max per file
  }
});

// Accept image + video fields
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

// =============================================
// ROUTES
// =============================================

/**
 * GET /api/reviews
 * Returns all reviews, newest first.
 */
app.get('/api/reviews', (_req, res) => {
  try {
    const reviews = getAllReviews();
    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat ulasan.' });
  }
});

/**
 * POST /api/reviews
 * Expects multipart/form-data with fields:
 *   - user_name  (text, required)
 *   - rating     (number 1-5, required)
 *   - review_text (text, required)
 *   - image      (file, optional)
 *   - video      (file, optional)
 */
app.post('/api/reviews', (req, res) => {
  uploadFields(req, res, (err) => {
    // Handle Multer errors
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran file terlalu besar (maks 50MB).' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Validate required fields
    const { user_name, rating, review_text } = req.body;

    if (!user_name || !user_name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama wajib diisi.' });
    }
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating harus antara 1-5.' });
    }
    if (!review_text || !review_text.trim()) {
      return res.status(400).json({ success: false, message: 'Ulasan wajib diisi.' });
    }

    // Build file paths (relative URL for front-end)
    const imagePath = req.files?.image?.[0]
      ? `/uploads/${req.files.image[0].filename}`
      : null;

    const videoPath = req.files?.video?.[0]
      ? `/uploads/${req.files.video[0].filename}`
      : null;

    try {
      addReview({
        user_name: user_name.trim(),
        rating: parseInt(rating, 10),
        review_text: review_text.trim(),
        image_path: imagePath,
        video_path: videoPath
      });

      res.status(201).json({ success: true, message: 'Ulasan berhasil dikirim!' });
    } catch (dbErr) {
      console.error('Error saving review:', dbErr);
      res.status(500).json({ success: false, message: 'Gagal menyimpan ulasan.' });
    }
  });
});

// =============================================
// ERROR HANDLING
// =============================================
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
});

// =============================================
// START SERVER
// =============================================
app.listen(PORT, () => {
  console.log(`✅ Review server running at http://localhost:${PORT}`);
});
