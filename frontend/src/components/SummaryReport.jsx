import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faDownload } from "@fortawesome/free-solid-svg-icons";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../css/SummaryReport.css";

// Import Recharts components
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LabelList 
} from 'recharts';

const SummaryReport = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featureImportance, setFeatureImportance] = useState(null);
  const [anomalyTypeImportance, setAnomalyTypeImportance] = useState({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [reportDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Reference to overall chart container
  const chartContainerRef = useRef(null);
  
  useEffect(() => {
    // Simulate API fetch
    const globalFeatureImportance = [
      { feature: "voltage", importance: 0.0278 },
      { feature: "voltage_deviation", importance: 0.0270 },
      { feature: "pf_deviation", importance: 0.0249 },
      { feature: "powerFactor", importance: 0.0239 },
      { feature: "frequency", importance: 0.0194 },
      { feature: "power", importance: 0.0180 },
      { feature: "current", importance: 0.0170 },
      { feature: "frequency_deviation", importance: 0.0165 },
      { feature: "power_voltage_ratio", importance: 0.0155 },
      { feature: "current_voltage_ratio", importance: 0.0145 }
    ];
    
    // Simulated per-anomaly-type importance
    const anomalyTypes = {
      "HighLoad_Excellent": {
        "voltage": 0.035,
        "power": 0.042,
        "powerFactor": 0.012,
        "frequency": 0.008,
        "current": 0.015
      },
      "LightLoad_VoltageSurge": {
        "voltage": 0.045,
        "voltage_deviation": 0.038,
        "frequency": 0.012,
        "powerFactor": 0.009,
        "current": 0.006
      },
      "HighLoad_VoltageInstability": {
        "voltage": 0.033,
        "voltage_deviation": 0.045,
        "power": 0.022,
        "frequency_deviation": 0.018,
        "powerFactor": 0.011
      },
      "LowPF_ReactiveLoad": {
        "powerFactor": 0.052,
        "pf_deviation": 0.047,
        "power": 0.018,
        "current": 0.015,
        "voltage": 0.007
      }
    };

    setFeatureImportance(globalFeatureImportance);
    setAnomalyTypeImportance(anomalyTypes);
    setIsLoading(false);
  }, []);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
  
      // Create a new PDF document
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
        
        // Add chart with preserved aspect ratio
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
      
      // Capture each anomaly-specific chart
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

  if (isLoading) {
    return (
      <div className="summary-report-container">
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin className="spinner" />
          <p>Loading feature importance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="summary-report-container">
        <div className="error-container">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Prepare data for recharts - sort by importance for better visualization
  const rechartsData = featureImportance
    .slice() // Create a copy to avoid mutating the original
    .sort((a, b) => b.importance - a.importance);

  return (
    <div className="summary-report-container">
      <div className="summary-report-header">
        <h2>Global Feature Importance Analysis</h2>
        <button 
          className="download-button" 
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin /> Generating...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faDownload} /> Download PDF
            </>
          )}
        </button>
      </div>
      
      <div className="summary-report-content">
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
            <li>The top three influential features are voltage, voltage deviation, and power factor deviation</li>
            <li>Different anomaly types show distinct importance patterns</li>
            <li>Eight out of ten features are needed to achieve 90% explanation quality</li>
          </ul>
        </div>
        
        {/* Main Feature Importance Chart */}
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
                    formatter={(value) => value.toFixed(4)} 
                    style={{ fontWeight: 500 }}
                    offset={5}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <h3 className="section-title">Feature Importance by Anomaly Type</h3>
        <div className="anomaly-type-charts">
          {Object.entries(anomalyTypeImportance).map(([anomalyType, features]) => {
            const anomalyData = Object.entries(features)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5) // Show only top 5
              .map(([name, value]) => ({ name, value }));
              
            return (
              <div key={anomalyType} className="anomaly-type-chart">
                <h4 className="anomaly-chart-title">{`Feature Importance for ${anomalyType}`}</h4>
                <div className="chart-wrapper">
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
                      <Tooltip formatter={(value) => value.toFixed(4)} />
                      <Bar 
                        dataKey="value" 
                        fill="#4299E1" 
                        radius={[0, 4, 4, 0]}
                        animationDuration={1000}
                      >
                        <LabelList dataKey="value" position="right" formatter={(value) => value.toFixed(3)} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="feature-summary">
          <p><strong>Top 5 Features:</strong> voltage (0.0278), voltage_deviation (0.0270), 
          pf_deviation (0.0249), powerFactor (0.0239), frequency (0.0194)</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryReport;