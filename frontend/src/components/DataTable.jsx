import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReadingRow from './ReadingRow';
import { formatDate, formatTime } from '../utils/powerReadingsUtils';

const DataTable = ({ readings }) => {
  const [classifiedReadings, setClassifiedReadings] = useState({});
  const [isClassifying, setIsClassifying] = useState(false);

  // Fix API URL construction
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  
  // Identify readings that need classification
  useEffect(() => {
    const anomalyReadings = readings.filter(r => r.is_anomaly && 
                                          (r.anomaly_type === 'Unclassified' || 
                                           r.anomaly_type === 'Unknown'));
    
    if (anomalyReadings.length > 0 && !isClassifying) {
      // console.log(`Requesting classification for ${anomalyReadings.length} anomalies`);
      setIsClassifying(true);
      
      // FIX: Remove any trailing slash to prevent double slashes
      const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
      
      // FIX: Use proper URL construction - check if baseUrl already includes /api
      const endpoint = baseUrl.includes('/api') ? 
        `${baseUrl}/classify-readings/` : 
        `${baseUrl}/api/classify-readings/`;
      
      // console.log(`Sending request to: ${endpoint}`);
      
      // Request classifications for these readings with corrected URL
      axios.post(endpoint, { readings: anomalyReadings })
        .then(response => {
          const { classifications } = response.data;
          // console.log('Received classifications:', classifications);
          setClassifiedReadings(prev => ({...prev, ...classifications}));
          setIsClassifying(false);
        })
        .catch(error => {
          console.error('Error classifying readings:', error);
          setIsClassifying(false);
          
          // Handle error by providing fallback classifications
          const fallbackClassifications = {};
          anomalyReadings.forEach(r => {
            fallbackClassifications[r.id] = 'Unknown';
          });
          setClassifiedReadings(prev => ({...prev, ...fallbackClassifications}));
        });
    }
  }, [readings, isClassifying, apiBaseUrl]);
  
  // Get actual anomaly type (either from our state or from the original reading)
  const getAnomalyType = (reading) => {
    if (!reading.is_anomaly) return 'Normal';
    
    if (reading.id in classifiedReadings) {
      return classifiedReadings[reading.id];
    }
    
    if (reading.anomaly_type && reading.anomaly_type !== 'Unclassified') {
      return reading.anomaly_type;
    }
    
    return 'Classifying...';  // Show this while waiting for classification
  };
  
  if (readings.length === 0) return null;
  
  return (
    <div className="table-container">
      <table className="readings-table">
        <thead>
          <tr>
            <th>Node Code</th>
            <th>Date</th>
            <th>Time</th>
            <th>Voltage (V)</th>
            <th>Current (A)</th>
            <th>Power (W)</th>
            <th>Frequency (Hz)</th>
            <th>Power Factor</th>
            <th>Anomaly</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((reading) => (
            <ReadingRow 
              key={reading.id}
              reading={{...reading, anomaly_type: getAnomalyType(reading)}}
              formatDate={formatDate}
              formatTime={formatTime}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(DataTable);