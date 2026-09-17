const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'reviews.db');
const db = new Database(dbPath);

const initDb = () => {
  const createTableStmt = `
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      review_text TEXT NOT NULL,
      image_path TEXT DEFAULT NULL,
      video_path TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  db.exec(createTableStmt);
};

initDb();

const getAllReviews = () => {
  const stmt = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC');
  return stmt.all();
};

const addReview = (data) => {
  const stmt = db.prepare(`
    INSERT INTO reviews (user_name, rating, review_text, image_path, video_path)
    VALUES (@user_name, @rating, @review_text, @image_path, @video_path)
  `);
  return stmt.run(data);
};

module.exports = {
  db,
  getAllReviews,
  addReview
};
