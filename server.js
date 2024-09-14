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
  
        // Ensure timestamp exists
        if (result.timestamp) {
          // Try to parse using different formats if necessary
          let dateTime;
          
          try {
            // First, try parsing as ISO 8601
            dateTime = DateTime.fromISO(result.timestamp, { zone: 'utc' });
          } catch (e) {
            console.log('ISO parsing failed:', e.message);
          }
          
          if (!dateTime.isValid) {
            try {
              // If ISO parsing fails, try parsing as a general Date string
              dateTime = DateTime.fromJSDate(new Date(result.timestamp), { zone: 'utc' });
            } catch (e) {
              console.log('JSDate parsing failed:', e.message);
            }
          }

          if (dateTime && dateTime.isValid) {
            // Convert to the desired format and time zone
            result.timestamp = dateTime.setZone('Africa/Addis_Ababa')
              .toFormat('yyyy-MM-dd HH:mm:ss');
            console.log('Formatted timestamp:', result.timestamp); // Debugging line
          } else {
            console.log('Invalid timestamp format:', dateTime ? dateTime.invalidExplanation : 'Unknown'); // Debugging line
          }
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
