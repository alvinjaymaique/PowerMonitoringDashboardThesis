import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, faDownload, faExclamationTriangle, 
  faChartBar, faGears 
} from '@fortawesome/free-solid-svg-icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
import { usePowerData } from '../hooks/usePowerData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LabelList 
} from 'recharts';
import "../css/SummaryReport.css";

const SummaryReport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [featureImportance, setFeatureImportance] = useState([]);
  const [anomalyTypeImportance, setAnomalyTypeImportance] = useState({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [reportDate] = useState(new Date().toISOString().split("T")[0]);
  const [minFeatures, setMinFeatures] = useState(8);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [sampleSize, setSampleSize] = useState(500);
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [progressTimer, setProgressTimer] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadedReadings, setLoadedReadings] = useState([]);
  
  const chartContainerRef = useRef(null);
  
  const { 
    availableNodes,
    selectedNode,
    startDate,
    endDate,
    nodeMinDate,
    nodeMaxDate,
    isLoadingNodes,
    isLoadingDateRange,
    handleNodeChange,
    handleStartDateChange,
    handleEndDateChange
  } = usePowerData(true); // Pass true to skip auto-fetching

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [progressTimer]);
  
  // Function to fetch data for a specific date
// Example API query with sampling
const fetchDataForDate = async (node, year, month, day, sampleSize = null) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
      const endpoint = baseUrl.includes('/api') ? 
        `${baseUrl}/firebase/node-data/` : 
        `${baseUrl}/api/firebase/node-data/`;
      
      // Include sample_size parameter if provided
      const params = {
        node,
        year,
        month,
        day
      };
      
      if (sampleSize) {
        params.sample_size = sampleSize;
        params.anomalies_only = true; // Request only anomalies
      }
      
      const response = await axios.get(endpoint, { params });
      
      return response.data || [];
    } catch (error) {
      console.error(`Error fetching data for ${year}-${month}-${day}:`, error);
      return [];
    }
  };

// Function to fetch all data for date range
const fetchSampledData = async (node, startDate, endDate, targetSampleSize) => {
    setIsLoadingData(true);
    setCalculationProgress(0);
    
    try {
      // Calculate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateRange = [];
      let currentDate = new Date(start);
      
      while (currentDate <= end) {
        dateRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Shuffle the date range to get a more representative sample across the entire period
      const shuffledDateRange = [...dateRange].sort(() => 0.5 - Math.random());
      
      const anomalyReadings = [];
      let processedDays = 0;
      
      // Process one day at a time until we reach our target sample size
      for (const date of shuffledDateRange) {
        if (anomalyReadings.length >= Math.min(targetSampleSize * 2, 3000)) {
          break; // We have enough data for sampling
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        console.log(`Fetching data for ${node} on ${year}-${month}-${day}`);
        
        // Fetch data for this specific day
        const dailyData = await fetchDataForDate(node, year, month, day);
        
        // Filter for anomalies only
        const dailyAnomalies = dailyData.filter(r => r.is_anomaly === true);
        anomalyReadings.push(...dailyAnomalies);
        
        // Update progress - use only 60% of the progress bar for data fetching phase
        // This leaves room for the analysis phase
        processedDays++;
        setCalculationProgress(Math.min(60, (processedDays / Math.min(dateRange.length, 30)) * 60));
        
        // Add a small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log(`Completed loading: Found ${anomalyReadings.length} anomalies`);
      
      // Set progress to 70% after data fetching is complete
      setCalculationProgress(70);
      
      // Return stratified sample if we have more than needed
      if (anomalyReadings.length > targetSampleSize) {
        const sampledData = stratifiedSample(anomalyReadings, targetSampleSize);
        setCalculationProgress(75); // Update progress after sampling
        return sampledData;
      }
      
      return anomalyReadings;
      
    } catch (error) {
      console.error("Error fetching sampled data:", error);
      throw error;
    } finally {
      setIsLoadingData(false);
    }
  };
  
  const generateAnalysis = async () => {
    // Validate required selections first
    if (!selectedNode) {
      setError("Please select a node first.");
      return;
    }
    
    if (!startDate || !endDate) {
      setError("Please select a date range first.");
      return;
    }
    
    setIsGeneratingAnalysis(true);
    setIsLoading(true);
    setError(null);
    
    try {
      // Directly fetch a sample of anomalies instead of all data
      const sampledAnomalies = await fetchSampledData(selectedNode, startDate, endDate, sampleSize);
      
      if (!sampledAnomalies || sampledAnomalies.length === 0) {
        setError("No anomalies found for the selected date range. Please try a different selection.");
        return;
      }
      
      if (sampledAnomalies.length < sampleSize * 0.5 && sampledAnomalies.length < 100) {
        console.warn(`Found only ${sampledAnomalies.length} anomalies, which is less than requested sample size.`);
      }
      
      // Progress update - preparing API call
      setCalculationProgress(80);
      
      // Build the global feature importance API endpoint
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
      const featureImportanceEndpoint = baseUrl.includes('/api') ? 
        `${baseUrl}/global-feature-importance/` : 
        `${baseUrl}/api/global-feature-importance/`;
      
      // Now proceed with SHAP analysis using the pre-sampled data
      setCalculationProgress(85); // Update progress - sending request
      const shapResponse = await axios.post(featureImportanceEndpoint, {
        readings: sampledAnomalies,
        sample_size: sampledAnomalies.length
      });
      
      // Progress update - processing response
      setCalculationProgress(90);
      
      console.log("Raw API response:", shapResponse);
      
      if (shapResponse.data) {
        console.log("Feature importance data received:", shapResponse.data);
        
        if (!shapResponse.data.feature_names || !shapResponse.data.importance_values) {
          setError("Invalid data format received from server. Missing required fields.");
          return;
        }
        
        // Processing data - update progress
        setCalculationProgress(95);
        
        // Process the feature importance data
        const featureData = shapResponse.data.feature_names.map((feature, index) => {
          return {
            feature: feature,
            importance: shapResponse.data.importance_values[index]
          };
        });
        
        setFeatureImportance(featureData);
        
        if (shapResponse.data.anomaly_types) {
          setAnomalyTypeImportance(shapResponse.data.anomaly_types);
        }
        
        if (shapResponse.data.min_features) {
          setMinFeatures(shapResponse.data.min_features);
        }
  
        // Final progress update - all done
        setCalculationProgress(100);
      } else {
        setError("Received empty response from server");
      }
    } catch (error) {
      console.error("Error generating analysis:", error);
      
      if (error.response) {
        setError(`Error ${error.response.status}: ${
          error.response.data?.error || error.message || "Unknown error"
        }`);
      } else {
        setError(`Error: ${error.message || "Unknown error"}`);
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
        <>
            <option value="">Select a node</option>
            {availableNodes.map(node => (
            <option key={node} value={node}>{node}</option>
            ))}
        </>
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
      
      {(isLoadingData || isLoading) && (
        <div className="loading-container">
            <FontAwesomeIcon icon={faSpinner} spin className="spinner" />
            <p>Loading analysis...</p>
            
            {/* Progress bar - always shown during any loading state */}
            <div className="calculation-progress">
            <div className="progress-bar-wrapper">
                <div 
                className="progress-bar-fill" 
                style={{ width: `${calculationProgress}%` }}
                ></div>
            </div>
            <div className="progress-label">{Math.round(calculationProgress)}%</div>
            </div>
            
            <p className="progress-note">
            <FontAwesomeIcon icon={faGears} /> 
            {isLoadingData ? 
                `Processing data for ${selectedNode}` : 
                `Analyzing ${sampleSize} samples`}
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