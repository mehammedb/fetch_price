
require('dotenv').config();
const {dev,prod} = require('./fixed.js')
const mysql = require('mysql2');

// MySQL connection setup
const connection = mysql.createConnection({
    host: 'localhost',
    user: process.env.NODE_ENV === 'development' ? dev.user : prod.user,
    password: process.env.NODE_ENV === 'development' ? dev.pass : prod.pass,
    database: process.env.NODE_ENV === 'development' ? dev.db : prod.db
  });

connection.connect(error => {
  if (error) {
    console.error('Error connecting to MySQL:', error);
    return;
  }
  console.log('Connected to MySQL');
});
