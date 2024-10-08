require('dotenv').config();
const axios = require('axios');
const mysql = require('mysql2');
const { DateTime } = require('luxon');
const { dev, prod } = require('./fixed.js');

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
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

// Function to fetch live prices from Binance with retry mechanism
async function fetchLivePrices(retries = 3) {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/ticker/price');
    const data = response.data;
    const usdtPairs = data.filter(item => item.symbol.endsWith('USDT'));
    return usdtPairs;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
      return fetchLivePrices(retries - 1);
    } else {
      console.error('Error fetching live prices:', error);
      return [];
    }
  }
}

// Function to update table structure if new symbols are found
async function updateTableStructure(symbols) {
  const existingColumns = await new Promise((resolve, reject) => {
    connection.query("SHOW COLUMNS FROM coin_price", (error, results) => {
      if (error) return reject(error);
      resolve(results.map(column => column.Field));
    });
  });

  const newSymbols = symbols.filter(symbol => !existingColumns.includes(symbol));
  if (newSymbols.length > 0) {
    const alterQueries = newSymbols.map(symbol => `ADD COLUMN ${symbol} DECIMAL(18, 8)`);
    const alterQuery = `ALTER TABLE coin_price ${alterQueries.join(', ')}`;
    await new Promise((resolve, reject) => {
      connection.query(alterQuery, (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });
  }
}

// Function to store prices into MySQL database
async function storePrices(prices) {
  const timestamp = DateTime.now().toUTC().toSQL({ includeOffset: false });

  const symbols = prices.map(price => price.symbol);
  await updateTableStructure(symbols);

  const columns = ['timestamp', ...symbols];
  const values = [timestamp, ...prices.map(price => price.price)];

  const query = `INSERT INTO coin_price (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
  connection.query(query, values, (error, results) => {
    if (error) {
      console.error('Error storing price:', error);
    } else {
      console.log(`Prices stored successfully @ ${timestamp}`);
    }
  });
}

// Main function to fetch and store prices
async function main() {
  const prices = await fetchLivePrices();
  await storePrices(prices);
  connection.end(err => {
    if (err) {
      console.error('Error closing MySQL connection:', err);
    } else {
      console.log('MySQL connection closed.');
    }
  });
}

// Run the main function
main();
