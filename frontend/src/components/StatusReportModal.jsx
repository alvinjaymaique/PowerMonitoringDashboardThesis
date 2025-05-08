import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileDownload, faSpinner, faTimes } from "@fortawesome/free-solid-svg-icons";
import StatusReportChart from "./StatusReportChart";
import StatusReportExplanation from "./StatusReportExplanation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../css/StatusReportModal.css";

const StatusReportModal = ({ anomalyReading, onClose }) => {
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDateChange = (e) => {
    setReportDate(e.target.value);
  };

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
      pdf.text(`Anomaly Analysis Report`, margin, margin + 5);
  
      pdf.setFontSize(12);
      pdf.text(
        `Generated: ${new Date().toLocaleString()}`,
        margin,
        margin + 15
      );
  
      if (anomalyReading) {
        pdf.text(
          `Anomaly Type: ${anomalyReading.anomaly_type || "Unknown"}`,
          margin,
          margin + 25
        );
        pdf.text(
          `Reading ID: ${anomalyReading.id || "Unknown"}`,
          margin,
          margin + 35
        );
        pdf.text(
          `Timestamp: ${new Date(anomalyReading.timestamp).toLocaleString()}`,
          margin,
          margin + 45
        );
      }
  
      // Capture the chart with higher quality
      const chartElement = document.querySelector(".status-report-chart");
      if (chartElement) {
        const chartCanvas = await html2canvas(chartElement, {
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
        
        // Add chart with preserved aspect ratio on first page
        pdf.addImage(
          chartImgData,
          "PNG",
          margin,
          60,
          chartWidth,
          chartHeight
        );
        
        // Always start a new page for explanation section
        pdf.addPage();
        
        // Add explanation title to second page
        pdf.setFontSize(16);
        pdf.text(`Anomaly Classification Details`, margin, margin + 10);
        pdf.setFontSize(12);
  
        // Capture the explanation
        const explanationElement = document.querySelector(
          ".status-report-explanation"
        );
        if (explanationElement) {
          const explCanvas = await html2canvas(explanationElement, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff"
          });
  
          const explImgData = explCanvas.toDataURL("image/png");
          
          // Calculate explanation dimensions
          const explAspectRatio = explCanvas.width / explCanvas.height;
          const explWidth = chartWidth;
          const explHeight = explWidth / explAspectRatio;
          
          // Add explanation to second page
          pdf.addImage(
            explImgData,
            "PNG",
            margin,
            margin + 20,
            explWidth,
            explHeight
          );
        }
      }
  
      // Save the PDF
      pdf.save(`Anomaly_Report_${reportDate}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF report");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="status-report-modal-overlay">
      <div className="status-report-modal">
        <div className="status-report-modal-header">
          <h2>Anomaly Status Report</h2>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="status-report-modal-toolbar">
          <div className="date-selector">
            <div className="date-label">Report Date:</div>
            <input
              type="date"
              className="date-picker"
              value={reportDate}
              onChange={handleDateChange}
            />
          </div>

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
                <FontAwesomeIcon icon={faFileDownload} /> Download PDF
              </>
            )}
          </button>
        </div>

        <div className="status-report-modal-content">
          <StatusReportChart anomalyReading={anomalyReading} />
          <StatusReportExplanation anomalyReading={anomalyReading} />
        </div>
      </div>
    </div>
  );
};

export default StatusReportModal;