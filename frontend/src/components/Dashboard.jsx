import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Dashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileDownload, 
  faTimes, 
  faBolt, 
  faHourglass, 
  faExclamationCircle,
  faTimesCircle 
} from '@fortawesome/free-solid-svg-icons';

const Dashboard = () => {
  const [readings, setReadings] = useState([]);
  const [latestReading, setLatestReading] = useState(null);
  const apiURL = `${import.meta.env.VITE_API_URL}`;
  const [graphType, setGraphType] = useState('power'); // Default graph type
  const [dateRange, setDateRange] = useState('day'); // Default date range
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });
  const [selectedNode, setSelectedNode] = useState('C-1'); // Default selected node

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

  // Handler for node selection change
  const handleNodeChange = (e) => {
    setSelectedNode(e.target.value);
  };

  // Handler for PDF download
  const handleDownloadPDF = () => {
    alert('Downloading dashboard as PDF...');
    // Implement PDF generation and download logic here
  };

  // Handler for opening modal with specific content
  const openModal = (title, content) => {
    setModalContent({ title, content });
    setShowModal(true);
  };

  // Handler for closing modal
  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="dashboard-container">
      {/* Combined Header and Date Selection Row */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2 className="dashboard-title">Power Monitoring Dashboard</h2>
        </div>
        
        <div className="header-right">
          <div className="selector-container">
            {/* Node Selection Dropdown */}
            <div className="node-selector">
              <div className="node-label">Node:</div>
              <select 
                className="node-dropdown"
                value={selectedNode}
                onChange={handleNodeChange}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                  <option key={`C-${num}`} value={`C-${num}`}>C-{num}</option>
                ))}
              </select>
            </div>
            
            {/* Date Range Selector */}
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
          
          <button className="download-button" onClick={handleDownloadPDF}>
            <FontAwesomeIcon icon={faFileDownload} /> Download as PDF
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content">

        {/* Top row - Power quality metrics */}
        <div className="metric-cards-row">
          <div className="metric-card large bg-green">
            <h3>Power Quality Status</h3>
            <p className="metric-value">
              <span className={`status-indicator ${latestReading && latestReading.is_anomaly ? 'poor' : 'good'}`}>
                {latestReading && latestReading.is_anomaly ? 'Poor' : 'Good'}
              </span>
            </p>
            <div className="card-icon">
              <FontAwesomeIcon icon={faBolt} />
            </div>
            <div className="more-info" onClick={() => openModal("Power Quality Status", "Power quality is determined by monitoring voltage, current, and frequency levels. Good power quality ensures stable operation of electrical equipment.")}>
              More info &gt;
            </div>
          </div>
          <div className="metric-card large bg-blue">
            <h3>Average Interruption</h3>
            <p className="metric-value">2.5 <span className="unit">min</span></p>
            <div className="card-icon">
              <FontAwesomeIcon icon={faHourglass} />
            </div>
            <div className="more-info" onClick={() => openModal("Average Interruption", "The average interruption duration represents the typical length of power outages experienced. Lower values indicate better grid reliability.")}>
              More info &gt;
            </div>
          </div>
          <div className="metric-card large bg-red">
            <h3>Number of Interruptions</h3>
            <p className="metric-value">3</p>
            <div className="card-icon">
              <FontAwesomeIcon icon={faTimesCircle} />
            </div>
            <div className="more-info" onClick={() => openModal("Number of Interruptions", "This metric shows how many times the power supply has been interrupted. Frequent interruptions may indicate grid instability or equipment issues.")}>
              More info &gt;
            </div>
          </div>
          <div className="metric-card large bg-gray">
            <h3>Number of Anomalies</h3>
            <p className="metric-value">{countAnomalies()}</p>
            <div className="card-icon">
              <FontAwesomeIcon icon={faExclamationCircle} />
            </div>
            <div className="more-info" onClick={() => openModal("Number of Anomalies", "Anomalies are unusual patterns in power metrics that may indicate potential issues. Regular monitoring helps prevent equipment damage.")}>
              More info &gt;
            </div>
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
                <span className="selected-node">- Node {selectedNode}</span>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalContent.title}</h3>
              <button className="close-modal" onClick={closeModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <p>{modalContent.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;