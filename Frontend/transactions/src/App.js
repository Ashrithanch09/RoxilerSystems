import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import Chart from "chart.js/auto";

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [totalSaleAmount, setTotalSaleAmount] = useState(0);
  const [totalSoldItems, setTotalSoldItems] = useState(0);
  const [totalNotSoldItems, setTotalNotSoldItems] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState("03");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchTransactions();
    fetchStatistics();
    fetchBarChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/transactions?month=${selectedMonth}&search=${searchText}&page=${currentPage}`
      );
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions: ", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/statistics?month=${selectedMonth}`
      );
      setTotalSaleAmount(response.data.totalSaleAmount);
      setTotalSoldItems(response.data.totalSoldItems);
      setTotalNotSoldItems(response.data.totalNotSoldItems);
    } catch (error) {
      console.error("Error fetching statistics: ", error);
    }
  };

  const fetchBarChartData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/bar-chart?month=${selectedMonth}`
      );
      renderBarChart(response.data);
    } catch (error) {
      console.error("Error fetching bar chart data: ", error);
    }
  };

  const renderBarChart = (data) => {
    const labels = data.map((item) => item.price_range);
    const counts = data.map((item) => item.count);

    // Check if a chart with ID 'barChart' already exists
    const existingChart = Chart.getChart("barChart");
    if (existingChart) {
      existingChart.destroy(); // Destroy the existing chart
    }

    const ctx = document.getElementById("barChart");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Number of Items",
            data: counts,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  };

  const handleSearch = (event) => {
    setSearchText(event.target.value);
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(currentPage - 1);
  };

  return (
    <div className="container mt-5">
      <h1>Transactions Table</h1>
      <div className="row mt-3">
        <div className="col-md-4">
          <select
            className="form-select"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              fetchTransactions();
              fetchStatistics();
              fetchBarChartData();
            }}
          >
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            value={searchText}
            onChange={handleSearch}
            placeholder="Search transaction..."
          />
        </div>
      </div>
      <table className="table table-striped mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
            <th>Category</th>
            <th>Sold</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.id}</td>
              <td>{transaction.title}</td>
              <td>{transaction.description}</td>
              <td>{transaction.price}</td>
              <td>{transaction.category}</td>
              <td>{transaction.sold}</td>
              <td>{transaction.image}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <button
          className="btn btn-primary me-2"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <button className="btn btn-primary" onClick={handleNextPage}>
          Next
        </button>
      </div>

      <h2 className="mt-5">Transactions Statistics</h2>
      <div className="row mt-3">
        <div className="col-md-4">
          <p>Total Sale Amount: {totalSaleAmount}</p>
        </div>
        <div className="col-md-4">
          <p>Total Sold Items: {totalSoldItems}</p>
        </div>
        <div className="col-md-4">
          <p>Total Not Sold Items: {totalNotSoldItems}</p>
        </div>
      </div>

      <h2 className="mt-5">Transactions Bar Chart</h2>
      <div className="row mt-3">
        <div className="col-md-6">
          <canvas id="barChart" width="400" height="200"></canvas>
        </div>
      </div>
    </div>
  );
};

export default App;
