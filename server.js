require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const { DateTime } = require('luxon');
const app = express();
const { dev, prod } = require('./fixed.js');

// MySQL connection setup
const connection = mysql.createConnection({
  host: 'localhost',
  user: process.env.NODE_ENV === 'development' ? dev.user : prod.user,
  password: process.env.NODE_ENV === 'development' ? dev.pass : prod.pass,
  database: process.env.NODE_ENV === 'development' ? dev.db : prod.db
});

// Route to get the latest data
app.get('/', (req, res) => {
  connection.query('SELECT * FROM coin_price ORDER BY id DESC LIMIT 1', (error, results) => {
    if (error) {
      return res.status(500).send('Error fetching data');
    }
    if (results.length > 0) {
      const result = results[0];
      console.log('Original timestamp:', result.timestamp); // Debugging line
      // Convert the timestamp to local time zone
      if (result.timestamp) {
        result.timestamp = DateTime.fromSQL(result.timestamp, { zone: 'utc' })
          .setZone('Africa/Addis_Ababa')
          .toSQL({ includeOffset: false });
        console.log('Converted timestamp:', result.timestamp); // Debugging line
      } else {
        console.log('Timestamp is null or undefined'); // Debugging line
      }
      res.json(result);
    } else {
      res.status(404).send('No data found');
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
