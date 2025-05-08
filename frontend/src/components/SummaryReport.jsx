import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faSpinner, faDownload, faExclamationTriangle, 
  faChartBar, faGears 
} from "@fortawesome/free-solid-svg-icons";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "axios";
import { usePowerData } from '../hooks/usePowerData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LabelList 
} from 'recharts';
import "../css/SummaryReport.css";

const SummaryReport = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featureImportance, setFeatureImportance] = useState([]);
  const [anomalyTypeImportance, setAnomalyTypeImportance] = useState({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [reportDate] = useState(new Date().toISOString().split("T")[0]);
  const [minFeatures, setMinFeatures] = useState(8);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [sampleSize, setSampleSize] = useState(500); // Default sample size
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [progressTimer, setProgressTimer] = useState(null);
  
  const chartContainerRef = useRef(null);
  
  const { 
    readings,
    availableNodes,
    selectedNode,
    startDate,
    endDate,
    nodeMinDate,
    nodeMaxDate,
    isLoading: isLoadingData,
    isLoadingNodes,
    isLoadingDateRange,
    handleNodeChange,
    handleStartDateChange,
    handleEndDateChange
  } = usePowerData();

  useEffect(() => {
    return () => {
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [progressTimer]);
  
  const generateAnalysis = async () => {
    if (!readings || readings.length === 0) {
      setError("No readings available for analysis. Please select a date range with data.");
      setIsLoading(false);
      return;
    }
    
    setIsGeneratingAnalysis(true);
    setIsLoading(true);
    setError(null);
    setCalculationProgress(0);
    
    // Only include anomaly readings for SHAP analysis
    const anomalyReadings = readings.filter(r => r.is_anomaly === true);
    
    if (anomalyReadings.length === 0) {
      setError("No anomalies found in the selected data. Please select a date range with anomalies.");
      setIsLoading(false);
      setIsGeneratingAnalysis(false);
      return;
    }

    // Simulate progress for better UX - will be replaced with real progress API when available
    const timer = setInterval(() => {
      setCalculationProgress(prev => {
        // Increase progress but cap at 90% until we get actual completion
        if (prev < 90) return prev + (90 - prev) / 10;
        return prev;
      });
    }, 500);
    
    setProgressTimer(timer);
    
    try {
      // Get API base URL from environment or default
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
      const endpoint = baseUrl.includes('/api') ? 
        `${baseUrl}/global-feature-importance/` : 
        `${baseUrl}/api/global-feature-importance/`;
      
      console.log(`Requesting global feature importance from ${endpoint}`);
      
      // Sample readings using stratified sampling for better performance
      let sampledReadings = anomalyReadings;
      if (anomalyReadings.length > sampleSize) {
        console.log(`Sampling ${sampleSize} readings from ${anomalyReadings.length} anomalies for performance`);
        sampledReadings = stratifiedSample(anomalyReadings, sampleSize);
      }
      
      const response = await axios.post(endpoint, {
        readings: sampledReadings,
        sample_size: sampleSize
      });
      
      console.log("Raw API response:", response);
  
      if (response.data) {
        console.log("Feature importance data received:", response.data);
        
        if (!response.data.feature_names || !response.data.importance_values) {
          setError("Invalid data format received from server. Missing required fields.");
          return;
        }
        
        // Validate data structure
        if (response.data.feature_names.length !== response.data.importance_values.length) {
          console.error("Mismatched feature names and values array lengths", {
            nameLength: response.data.feature_names.length,
            valueLength: response.data.importance_values.length
          });
          setError("Data integrity issue: Mismatched feature names and values");
          return;
        }
        
        const featureData = response.data.feature_names.map((feature, index) => {
          const importanceValue = response.data.importance_values[index];
          // Extra validation with detailed logging
          console.log(`Processing feature: ${feature}, value:`, importanceValue, 
                     `type: ${typeof importanceValue}`);
                     
          // More robust conversion
          let numericImportance = 0;
          if (typeof importanceValue === 'number') {
            numericImportance = importanceValue;
          } else if (importanceValue !== null && importanceValue !== undefined) {
            // Try to parse string or other value
            const parsed = parseFloat(importanceValue);
            if (!isNaN(parsed)) {
              numericImportance = parsed;
            }
          }
          
          return {
            feature: feature,
            importance: numericImportance
          };
        });
        
        console.log("Processed feature data:", featureData);
        setFeatureImportance(featureData);
        
        if (response.data.anomaly_types) {
          setAnomalyTypeImportance(response.data.anomaly_types);
        } else {
          setAnomalyTypeImportance({});
        }
        
        if (response.data.min_features) {
          setMinFeatures(response.data.min_features);
        }

        setCalculationProgress(100);
      } else {
        setError("Received empty response from server");
      }
    } catch (error) {
        console.error("Error fetching feature importance:", error);
  
        // Enhanced error reporting
        if (error.response) {
          console.error("Server response data:", error.response.data);
          console.error("Server response status:", error.response.status);
          setError(`Error ${error.response.status}: ${
            error.response.data?.error || error.message || "Unknown error"
          }`);
        } else {
          setError(`Error fetching feature importance: ${error.message || "Unknown error"}`);
        }
    } finally {
      if (progressTimer) clearInterval(progressTimer);
      setIsLoading(false);
      setIsGeneratingAnalysis(false);
    }
  };

  // Helper function to perform stratified sampling
  const stratifiedSample = (readings, targetSize) => {
    // Group readings by anomaly type
    const groupedByType = {};
    readings.forEach(reading => {
      const type = reading.anomaly_type || 'Unknown';
      if (!groupedByType[type]) groupedByType[type] = [];
      groupedByType[type].push(reading);
    });

    // Calculate how many to take from each group
    const totalReadings = readings.length;
    const sampledReadings = [];
    const typeCounts = {};
    
    Object.entries(groupedByType).forEach(([type, typeReadings]) => {
      const proportion = typeReadings.length / totalReadings;
      typeCounts[type] = Math.max(10, Math.round(proportion * targetSize));
    });
    
    // Adjust if total exceeds target size
    let totalTargetCount = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
    if (totalTargetCount > targetSize) {
      const scale = targetSize / totalTargetCount;
      Object.keys(typeCounts).forEach(type => {
        typeCounts[type] = Math.max(5, Math.floor(typeCounts[type] * scale));
      });
    }
    
    // Sample from each group
    Object.entries(groupedByType).forEach(([type, typeReadings]) => {
      const count = Math.min(typeCounts[type], typeReadings.length);
      const shuffled = [...typeReadings].sort(() => 0.5 - Math.random());
      sampledReadings.push(...shuffled.slice(0, count));
    });
    
    // If we need more, add random readings
    if (sampledReadings.length < targetSize) {
      const remaining = readings.filter(reading => !sampledReadings.includes(reading));
      const additional = remaining.sort(() => 0.5 - Math.random())
        .slice(0, targetSize - sampledReadings.length);
      sampledReadings.push(...additional);
    }
    
    return sampledReadings;
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const pdf = new jsPDF("portrait", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
  
      // Add title
      pdf.setFontSize(18);
      pdf.text(`Global Feature Importance Report`, margin, margin + 5);
  
      pdf.setFontSize(12);
      pdf.text(
        `Generated: ${new Date().toLocaleString()}`,
        margin,
        margin + 15
      );
  
      // Capture the overall feature importance chart
      const overallChartElement = document.querySelector(".overall-importance-chart");
      if (overallChartElement) {
        const chartCanvas = await html2canvas(overallChartElement, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff"
        });

        const chartImgData = chartCanvas.toDataURL("image/png");
        
        // Calculate dimensions that preserve aspect ratio
        const chartAspectRatio = chartCanvas.width / chartCanvas.height;
        const chartWidth = pageWidth - (margin * 2);
        const chartHeight = chartWidth / chartAspectRatio;
        
        pdf.text(`Overall Feature Importance`, margin, margin + 30);
        pdf.addImage(
          chartImgData,
          "PNG",
          margin,
          margin + 35,
          chartWidth,
          chartHeight
        );
        
        // Add a new page for anomaly-specific charts
        pdf.addPage();
        pdf.text(`Anomaly-Specific Feature Importance`, margin, margin + 10);
      }
      
      // Capture anomaly-specific charts
      const anomalyCharts = document.querySelectorAll(".anomaly-type-chart");
      let currentY = margin + 20;
      
      for (let i = 0; i < anomalyCharts.length; i++) {
        const chartCanvas = await html2canvas(anomalyCharts[i], {
          scale: 1.5,
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff"
        });
        
        const chartImgData = chartCanvas.toDataURL("image/png");
        const chartAspectRatio = chartCanvas.width / chartCanvas.height;
        const chartWidth = pageWidth - (margin * 2);
        const chartHeight = chartWidth / chartAspectRatio;
        
        // Check if we need a new page
        if (currentY + chartHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin + 10;
        }
        
        // Add chart
        pdf.addImage(
          chartImgData,
          "PNG",
          margin,
          currentY,
          chartWidth,
          chartHeight
        );
        
        // Update Y position for next chart
        currentY += chartHeight + 15;
      }

      // Save the PDF
      pdf.save(`Feature_Importance_Report_${reportDate}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF report");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Prepare data for recharts - sort by importance
    // Safe version of data preparation
    const rechartsData = featureImportance
    .slice()
    .map(item => ({
        feature: item.feature,
        importance: typeof item.importance === 'number' ? 
        item.importance : 
        (parseFloat(item.importance) || 0)
    }))
    .sort((a, b) => b.importance - a.importance);

    // Add right before the rendering of recharts data
    console.log("Feature importance data for chart:", featureImportance);
    console.log("Recharts data:", rechartsData);

    // Add before formatting top features
    rechartsData.slice(0, 3).forEach((item, index) => {
    console.log(`Top feature ${index + 1}:`, item.feature, 
                "Importance:", item.importance, 
                "Type:", typeof item.importance);
    });

    // Get top 3 features for summary with safe formatting
    const topFeatures = rechartsData.length > 0 ? 
    rechartsData.slice(0, 3).map(item => {
        const importanceVal = typeof item.importance === 'number' ? 
        item.importance.toFixed(4) : 
        'N/A';
        return `${item.feature} (${importanceVal})`;
    }).join(', ') : 'No data available';

  return (
    <div className="summary-report-container">
      <div className="summary-report-header">
        <h2>Global Feature Importance Analysis</h2>
        <div className="report-actions">
          <button 
            className="generate-button" 
            onClick={generateAnalysis}
            disabled={isGeneratingAnalysis || isLoadingData || !selectedNode}
          >
            {isGeneratingAnalysis ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Generating Analysis...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faChartBar} /> Generate Analysis
              </>
            )}
          </button>
          <button 
            className="download-button" 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF || featureImportance.length === 0}
          >
            {isGeneratingPDF ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Generating PDF...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faDownload} /> Download PDF
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Data Selection Controls */}
      <div className="data-selection-controls">
        {/* Node Selection */}
        <div className="control-group">
          <label>Node:</label>
          <select 
            value={selectedNode}
            onChange={handleNodeChange}
            disabled={isLoadingNodes || isLoadingData || isGeneratingAnalysis}
          >
            {isLoadingNodes ? (
              <option value="">Loading nodes...</option>
            ) : availableNodes.length > 0 ? (
              availableNodes.map(node => (
                <option key={node} value={node}>{node}</option>
              ))
            ) : (
              <option value="">No nodes available</option>
            )}
          </select>
        </div>
        
        {/* Date Range Selection */}
        <div className="control-group date-range-group">
          <label>Date Range:</label>
          <div className="date-inputs">
            <input 
              type="date" 
              value={startDate}
              onChange={handleStartDateChange}
              disabled={isLoadingDateRange || isLoadingData || isGeneratingAnalysis}
              min={nodeMinDate || ''}
              max={endDate || nodeMaxDate || ''}
            />
            <span>to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={handleEndDateChange}
              disabled={isLoadingDateRange || isLoadingData || isGeneratingAnalysis}
              min={startDate || nodeMinDate || ''}
              max={nodeMaxDate || ''}
            />
          </div>
        </div>
        
        {/* Sample Size Selector - NEW */}
        <div className="control-group">
          <label>Sample Size:</label>
          <select
            value={sampleSize}
            onChange={(e) => setSampleSize(Number(e.target.value))}
            disabled={isGeneratingAnalysis}
          >
            <option value={200}>Small (200 samples)</option>
            <option value={500}>Medium (500 samples)</option>
            <option value={1000}>Large (1000 samples)</option>
            <option value={2000}>Very Large (2000 samples)</option>
          </select>
          <small className="form-text">
            Smaller samples = faster calculation but less accurate
          </small>
        </div>
      </div>
      
      {isLoadingData && (
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin className="spinner" />
          <p>Loading data for selected date range...</p>
        </div>
      )}
      
      {isLoading && !isLoadingData && (
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin className="spinner" />
          <p>Calculating feature importance...</p>
          
          {/* Progress bar */}
          {calculationProgress > 0 && (
            <div className="calculation-progress">
              <div className="progress-bar-wrapper">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${calculationProgress}%` }}
                ></div>
              </div>
              <div className="progress-label">{Math.round(calculationProgress)}%</div>
            </div>
          )}
          <p className="progress-note">
            <FontAwesomeIcon icon={faGears} /> 
            {' '}Processing {sampleSize} samples for accurate analysis
          </p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <p>{error}</p>
        </div>
      )}

    {!isLoading && !error && featureImportance.length > 0 && (
    <div className="summary-report-content">
        {/* Additional validation to avoid rendering with invalid data */}
        {rechartsData.some(item => typeof item.importance !== 'number' || isNaN(item.importance)) ? (
        <div className="error-container">
            <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
            <p>Error: Invalid importance values detected. Please regenerate the analysis.</p>
            <pre className="debug-info">
            {JSON.stringify(featureImportance.slice(0, 3), null, 2)}
            </pre>
        </div>
        ) : (
        <>
            <div className="explanation-panel">
            <h3>About Feature Importance</h3>
            <p>
                This report shows the global feature importance based on SHAP (SHapley Additive exPlanations) 
                values calculated from our anomaly detection model. Each feature's importance is determined 
                by its average absolute SHAP value across all anomaly types.
            </p>
            <p>
                Key findings from this analysis:
            </p>
            <ul>
                <li>The top three influential features are {topFeatures}</li>
                <li>Different anomaly types show distinct importance patterns</li>
                <li>{minFeatures} out of {featureImportance.length} features are needed to achieve 90% explanation quality</li>
                <li><strong>Sample size:</strong> {sampleSize} anomaly readings</li>
            </ul>
            </div>
            
            <div className="chart-container overall-importance-chart" ref={chartContainerRef}>
            <h3 className="chart-title">Global Feature Importance Across All Anomaly Types</h3>
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={500}>
                <BarChart
                    data={rechartsData}
                    layout="vertical"
                    margin={{ top: 5, right: 50, left: 40, bottom: 5 }}
                    barCategoryGap="20%"
                    maxBarSize={30}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                    type="number" 
                    domain={[0, dataMax => Math.max(dataMax * 1.1, 0.035)]}
                    tickCount={6}
                    tickFormatter={val => val.toFixed(3)}
                    />
                    <YAxis 
                    dataKey="feature" 
                    type="category" 
                    width={120} 
                    tick={{ fontSize: 13 }}
                    />
                    <Tooltip 
                    formatter={(value) => [value.toFixed(4), "SHAP value"]}
                    labelFormatter={(name) => `Feature: ${name}`}
                    cursor={{fill: 'rgba(0, 0, 0, 0.05)'}}
                    />
                    <Bar 
                    dataKey="importance" 
                    fill="#38A169"
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                    >
                    <LabelList 
                        dataKey="importance" 
                        position="right" 
                        formatter={(value) => {
                        // Extra validation to prevent NaN display
                        if (typeof value !== 'number' || isNaN(value)) {
                            return 'N/A';
                        }
                        // Prevent ridiculously long decimals with safely bounded toFixed
                        if (Math.abs(value) < 0.0001) {
                            return '≈0.0000';
                        }
                        return value.toFixed(4);
                        }}
                        style={{ fontWeight: 500 }}
                        offset={5}
                    />
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>
            
            {Object.keys(anomalyTypeImportance).length > 0 && (
            <>
                <h3 className="section-title">Feature Importance by Anomaly Type</h3>
                <div className="anomaly-type-charts">
                {Object.entries(anomalyTypeImportance).map(([anomalyType, features]) => {
                    const anomalyData = Object.entries(features)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5) // Show only top 5
                    .map(([name, value]) => ({ 
                        name, 
                        value: typeof value === 'number' ? value : parseFloat(value) || 0 
                    }));
                    
                    return (
                    <div key={anomalyType} className="anomaly-type-chart">
                        <h4 className="anomaly-chart-title">{`Feature Importance for ${anomalyType}`}</h4>
                        <div className="chart-wrapper">
                        {/* Add similar validation for anomaly charts */}
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart
                            data={anomalyData}
                            layout="vertical"
                            margin={{ top: 5, right: 40, left: 40, bottom: 5 }}
                            barCategoryGap="20%"
                            maxBarSize={25}
                            >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis 
                                type="number" 
                                domain={[0, dataMax => Math.max(dataMax * 1.1, 0.05)]}
                                tickCount={5}
                                tickFormatter={val => val.toFixed(3)}
                            />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip formatter={(value) => (typeof value === 'number' ? value.toFixed(4) : 'N/A')} />
                            <Bar 
                                dataKey="value" 
                                fill="#4299E1" 
                                radius={[0, 4, 4, 0]}
                                animationDuration={1000}
                            >
                                <LabelList 
                                dataKey="value" 
                                position="right" 
                                formatter={(value) => typeof value === 'number' ? value.toFixed(3) : 'N/A'} 
                                />
                            </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        </div>
                    </div>
                    );
                })}
                </div>
            </>
            )}
            
            <div className="feature-summary">
            <p><strong>Top 5 Features:</strong> {rechartsData.slice(0, 5).map(
                item => `${item.feature} (${typeof item.importance === 'number' ? item.importance.toFixed(4) : 'N/A'})`
            ).join(', ')}</p>
            </div>
        </>
        )}
    </div>
    )}

      {!isLoading && !error && featureImportance.length === 0 && !isLoadingData && selectedNode && (
        <div className="generate-prompt">
          <p>Select a node and date range, then click "Generate Analysis" to create the feature importance report.</p>
          <p>Note: The analysis requires anomalous readings in the selected data range.</p>
          <p><strong>Tip:</strong> Start with a smaller sample size for faster results, then increase if needed for more accuracy.</p>
        </div>
      )}
    </div>
  );
};

export default SummaryReport;