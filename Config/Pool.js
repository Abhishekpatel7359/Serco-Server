const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// MySQL connection pool setup
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER, // Replace with your MySQL username
  password: process.env.DB_PASSWORD, // Replace with your MySQL password
  database: process.env.DB_DATABASE, // Replace with your database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

});

// Promisify the pool for async/await support
module.exports = db;
