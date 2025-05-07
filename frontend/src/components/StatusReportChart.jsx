import React, { useState, useEffect } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const StatusReportChart = ({ anomalyReading }) => {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset state when anomaly reading changes
    setExplanation(null);
    setError(null);
    
    // Only fetch explanation if we have a valid anomaly
    if (anomalyReading && anomalyReading.is_anomaly) {
      fetchExplanation(anomalyReading);
    }
  }, [anomalyReading]);

  const fetchExplanation = async (reading) => {
      setLoading(true);
      try {
        // Get API base URL from environment or default
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        
        // Fix URL construction - remove trailing slash if present
        const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
        
        // Check if baseUrl already includes /api
        const endpoint = baseUrl.includes('/api') ? 
          `${baseUrl}/explain-anomaly/` : 
          `${baseUrl}/api/explain-anomaly/`;
        
        console.log(`Requesting SHAP explanation from: ${endpoint}`);
        
        // Add more debug information
        console.log("Sending reading data:", JSON.stringify(reading, null, 2));
        
        const response = await axios.post(endpoint, { reading });
        console.log("SHAP response received:", response.data);
        setExplanation(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching explanation:", err);
        // More detailed error display
        if (err.response) {
          console.error("Response data:", err.response.data);
          console.error("Response status:", err.response.status);
          setError(`Error ${err.response.status}: ${err.response.data?.error || 'Unknown error'}`);
        } else {
          setError("Failed to generate explanation. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
  };

  // Configure waterfall chart
  const getChartOptions = () => {
    if (!explanation) return {};
  
    const featureValues = explanation.feature_values;
    const featureLabels = explanation.feature_names.map(name => 
      `${name} (${featureValues[name]?.toFixed(2) || 'N/A'})`
    );
  
    // Sort features by absolute SHAP value
    const featureIndices = explanation.feature_names.map((_, i) => i);
    featureIndices.sort((a, b) => 
      Math.abs(explanation.shap_values[b]) - Math.abs(explanation.shap_values[a])
    );
  
    const sortedLabels = featureIndices.map(i => featureLabels[i]);
  
    return {
      chart: {
        type: 'bar',
        height: 360,
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        foreColor: '#333', // Better contrast for PDF export
        toolbar: {
          show: false
        },
        animations: {
          enabled: false // Disable animations for PDF capture
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 2,
          barHeight: '80%',
          distributed: false,
          colors: {
            ranges: [{
              from: -100, // negative values
              to: 0,
              color: '#E25A6A'
            }, {
              from: 0,  // positive values
              to: 100,
              color: '#38A169'
            }]
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: false
      },
      tooltip: {
        enabled: false // Disable tooltips for PDF export
      },
      title: {
        text: `Feature Impact on "${explanation.predicted_class}" Classification`,
        align: 'center',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: '#2D3748'
        }
      },
      subtitle: {
        text: 'SHAP Values (higher absolute value = stronger impact)',
        align: 'center',
        style: {
          fontSize: '12px'
        }
      },
      xaxis: {
        categories: sortedLabels,
        labels: {
          style: {
            fontSize: '10px',
            colors: '#4A5568'
          },
          formatter: function (val) {
            return parseFloat(val).toFixed(4);
          }
        },
        axisBorder: {
          show: true,
          color: '#E2E8F0'
        },
        axisTicks: {
          show: true,
          color: '#E2E8F0'
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '11px',
            colors: '#4A5568'
          },
          maxWidth: 160
        }
      },
      grid: {
        borderColor: '#E2E8F0',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: true
          }
        }
      }
    };
  };

  const getChartSeries = () => {
    if (!explanation) return [];

    // Sort features by absolute SHAP value
    const featureIndices = explanation.feature_names.map((_, i) => i);
    featureIndices.sort((a, b) => 
      Math.abs(explanation.shap_values[b]) - Math.abs(explanation.shap_values[a])
    );

    const sortedValues = featureIndices.map(i => explanation.shap_values[i]);

    return [{
      name: 'SHAP value',
      data: sortedValues
    }];
  };

  return (
    <div className="status-report-chart">
      <div className="chart-header">
        <h3>Local Explanation</h3>
      </div>

      <div className="chart-content">
        {loading && (
          <div className="loading-container">
            <FontAwesomeIcon icon={faSpinner} spin className="spinner" />
            <p>Generating explanation...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && explanation && (
          <div className="waterfall-container">
            <p className="explanation-note">
              These values show how each feature contributes to the classification prediction.
              Positive values (green) push toward the predicted class, while negative values (red) push away from it.
            </p>
            <Chart
              options={getChartOptions()}
              series={getChartSeries()}
              type="bar"
              height={380}
            />
            <div className="base-value-info">
              <p>Base value: {explanation.base_value?.toFixed(4)} (average model output)</p>
            </div>
          </div>
        )}

        {!loading && !error && !explanation && !anomalyReading && (
          <p>Select an anomaly from the table to view its feature explanation.</p>
        )}
        
        {!loading && !error && !explanation && anomalyReading && !anomalyReading.is_anomaly && (
          <p>Selected reading is not an anomaly. Please select an anomaly to view explanation.</p>
        )}
      </div>
    </div>
  );
};

export default StatusReportChart;