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
  connectionLimit: 20,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true

});

// Handle connection errors
db.on('connection', function (connection) {
  console.log('DB Connection established as id ' + connection.threadId);
});

db.on('error', function(err) {
  console.error('Database error', err);
  if(err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Database connection was closed.');
  }
  if(err.code === 'ER_CON_COUNT_ERROR') {
    console.log('Database has too many connections.');
  }
  if(err.code === 'ECONNREFUSED') {
    console.log('Database connection was refused.');
  }
});

// Promisify the pool for async/await support
module.exports = db;
