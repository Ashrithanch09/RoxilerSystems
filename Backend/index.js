const express = require("express");
const axios = require("axios");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Create MySQL connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "app",
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: ", err);
    return;
  }
  console.log("Connected to MySQL");
});

// Create transactions table if not exists
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    price DECIMAL(10, 2),
    category VARCHAR(255),
    sold ENUM('yes', 'no'),
    image VARCHAR(255),
    date_of_sale DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;
connection.query(createTableQuery, (err, result) => {
  if (err) {
    console.error("Error creating transactions table: ", err);
  } else {
    console.log("Transactions table created successfully");
    // Fetch data from URL and insert into the database
    fetchAndInsertData();
  }
});

// Function to fetch data from URL and insert into the database
const fetchAndInsertData = async () => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const data = response.data;
    const values = data.map((transaction) => [
      transaction.title,
      transaction.description,
      transaction.price,
      transaction.category,
      transaction.sold ? "yes" : "no",
      transaction.image,
      new Date(transaction.dateOfSale)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
    ]);
    const sql = `INSERT INTO transactions (title, description, price, category, sold, image, date_of_sale) VALUES ?`;
    connection.query(sql, [values], (error, results) => {
      if (error) {
        console.error("Error inserting data into transactions table: ", error);
      } else {
        console.log("Data inserted into transactions table successfully");
      }
    });
  } catch (error) {
    console.error("Error fetching data from URL: ", error);
  }
};

// List Transactions API
app.get("/transactions", (req, res) => {
  const { month, search = "", page = 1, perPage = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(perPage);
  const limit = parseInt(perPage);
  const query = `
    SELECT * 
    FROM transactions 
    WHERE MONTH(date_of_sale) = ? 
    AND (title LIKE ? OR description LIKE ? OR price LIKE ?)
    LIMIT ? OFFSET ?
  `;
  const searchValue = `%${search}%`;
  connection.query(
    query,
    [month, searchValue, searchValue, searchValue, limit, offset],
    (error, results) => {
      if (error) {
        console.error("Error fetching transactions: ", error);
        res.status(500).send("Error fetching transactions.");
        return;
      }
      res.json(results);
    }
  );
});

// Statistics API
app.get("/statistics", (req, res) => {
  const { month } = req.query;
  const query = `
    SELECT 
      SUM(price) AS totalSaleAmount, 
      SUM(CASE WHEN sold = 'yes' THEN 1 ELSE 0 END) AS totalSoldItems,
      SUM(CASE WHEN sold = 'no' THEN 1 ELSE 0 END) AS totalNotSoldItems
    FROM transactions 
    WHERE MONTH(date_of_sale) = ? 
  `;
  connection.query(query, [month], (error, results) => {
    if (error) {
      console.error("Error fetching statistics: ", error);
      res.status(500).send("Error fetching statistics.");
      return;
    }
    res.json(results[0]);
  });
});

// Bar Chart API
app.get("/bar-chart", (req, res) => {
  const { month } = req.query;
  const query = `
    SELECT 
      CASE 
        WHEN price BETWEEN 0 AND 100 THEN '0 - 100'
        WHEN price BETWEEN 101 AND 200 THEN '101 - 200'
        WHEN price BETWEEN 201 AND 300 THEN '201 - 300'
        WHEN price BETWEEN 301 AND 400 THEN '301 - 400'
        WHEN price BETWEEN 401 AND 500 THEN '401 - 500'
        WHEN price BETWEEN 501 AND 600 THEN '501 - 600'
        WHEN price BETWEEN 601 AND 700 THEN '601 - 700'
        WHEN price BETWEEN 701 AND 800 THEN '701 - 800'
        WHEN price BETWEEN 801 AND 900 THEN '801 - 900'
        ELSE '901 - above'
      END AS price_range,
      COUNT(*) AS count
    FROM transactions
    WHERE MONTH(date_of_sale) = ?
    GROUP BY price_range
  `;
  connection.query(query, [month], (error, results) => {
    if (error) {
      console.error("Error fetching bar chart data: ", error);
      res.status(500).send("Error fetching bar chart data.");
      return;
    }
    res.json(results);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
