import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Dashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileDownload } from '@fortawesome/free-solid-svg-icons';

const Dashboard = () => {
  const [readings, setReadings] = useState([]);
  const [latestReading, setLatestReading] = useState(null);
  const apiURL = `${import.meta.env.VITE_API_URL}`;
  const [graphType, setGraphType] = useState('power'); // Default graph type
  const [dateRange, setDateRange] = useState('day'); // Default date range

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const response = await axios.get(apiURL);
        setReadings(response.data);
        
        // Set the latest reading
        if (response.data.length > 0) {
          setLatestReading(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchReadings();
    // Fetch data every 5 seconds
    const interval = setInterval(fetchReadings, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate metrics
  const countAnomalies = () => {
    return readings.filter(reading => reading.is_anomaly).length;
  };

  // Handler for graph type change
  const handleGraphTypeChange = (type) => {
    setGraphType(type);
  };

  // Handler for date range change
  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
  };

  // Handler for PDF download
  const handleDownloadPDF = () => {
    alert('Downloading dashboard as PDF...');
    // Implement PDF generation and download logic here
  };

  return (
    <div className="dashboard-container">
      {/* Header Row */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">Power Monitoring Dashboard</h2>
        <div className="dashboard-actions">
          <div className="dashboard-date">
            <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button className="download-button" onClick={handleDownloadPDF}>
            <FontAwesomeIcon icon={faFileDownload} /> Download as PDF
          </button>
        </div>
      </div>

      {/* Date Selection Row */}
        <div className="date-selection-row">
        <div className="date-range-selector">
            <div className="date-range-label">Date Range:</div>
            <div className="date-range-inputs">
            <input 
                type="date" 
                className="date-picker" 
                name="start-date"
            />
            <span className="date-separator">-</span>
            <input 
                type="date" 
                className="date-picker" 
                name="end-date"
            />
            </div>
        </div>
        </div>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {/* First row - 4 metric cards */}
        <div className="metric-cards-row">
          {latestReading && (
            <>
              <div className="metric-card">
                <h3>Voltage</h3>
                <p className="metric-value">{latestReading.voltage} <span className="unit">V</span></p>
              </div>
              <div className="metric-card">
                <h3>Current</h3>
                <p className="metric-value">{latestReading.current} <span className="unit">A</span></p>
              </div>
              <div className="metric-card">
                <h3>Power</h3>
                <p className="metric-value">{latestReading.power} <span className="unit">W</span></p>
              </div>
              <div className="metric-card">
                <h3>Power Factor</h3>
                <p className="metric-value">{latestReading.power_factor}</p>
              </div>
            </>
          )}
        </div>
        
        {/* Middle row - Power quality metrics */}
        <div className="metric-cards-row">
          <div className="metric-card">
            <h3>Power Quality Status</h3>
            <p className="metric-value">
              <span className={`status-indicator ${latestReading && latestReading.is_anomaly ? 'poor' : 'good'}`}>
                {latestReading && latestReading.is_anomaly ? 'Poor' : 'Good'}
              </span>
            </p>
          </div>
          <div className="metric-card">
            <h3>Average Interruption</h3>
            <p className="metric-value">2.5 <span className="unit">min</span></p>
          </div>
          <div className="metric-card">
            <h3>Number of Interruptions</h3>
            <p className="metric-value">3</p>
          </div>
          <div className="metric-card">
            <h3>Number of Anomalies</h3>
            <p className="metric-value">{countAnomalies()}</p>
          </div>
        </div>
        
        {/* Bottom row - Graph */}
        <div className="graph-row">
          <div className="graph-card">
            {/* Graph header as first row */}
            <div className="graph-header">
              <h3>
                {graphType === 'powerFactor' 
                    ? 'Power Factor Over Time'
                    : graphType.charAt(0).toUpperCase() + graphType.slice(1) + ' Over Time'}
              </h3>            
              <div className="graph-controls">
                <button 
                  className={`graph-type-button ${graphType === 'voltage' ? 'active' : ''}`} 
                  onClick={() => handleGraphTypeChange('voltage')}
                >
                  Voltage
                </button>
                <button 
                  className={`graph-type-button ${graphType === 'current' ? 'active' : ''}`} 
                  onClick={() => handleGraphTypeChange('current')}
                >
                  Current
                </button>
                <button 
                  className={`graph-type-button ${graphType === 'power' ? 'active' : ''}`} 
                  onClick={() => handleGraphTypeChange('power')}
                >
                  Power
                </button>
                <button 
                  className={`graph-type-button ${graphType === 'frequency' ? 'active' : ''}`} 
                  onClick={() => handleGraphTypeChange('frequency')}
                >
                  Frequency
                </button>
                <button 
                  className={`graph-type-button ${graphType === 'powerFactor' ? 'active' : ''}`} 
                  onClick={() => handleGraphTypeChange('powerFactor')}
                >
                  Power Factor
                </button>
              </div>
            </div>
            
            {/* Graph content as second row */}
            <div className="graph-content">
              <div className="graph-placeholder">
                <div className="graph-message">
                  <p>{graphType === 'powerFactor' ? 'Power Factor' : graphType.charAt(0).toUpperCase() + graphType.slice(1)} graph will be displayed here showing trends over time.</p>
                  <p>Date range: {dateRange}, Data points: {readings.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;