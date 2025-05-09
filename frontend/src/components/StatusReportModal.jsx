import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileDownload,
  faSpinner,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import StatusReportChart from "./StatusReportChart";
import StatusReportExplanation from "./StatusReportExplanation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../css/StatusReportModal.css";

const StatusReportModal = ({ anomalyReading, onClose }) => {
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reportTime, setReportTime] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Set the initial report date to the anomaly's timestamp if available
  useEffect(() => {
    if (anomalyReading && anomalyReading.timestamp) {
      const anomalyDate = new Date(anomalyReading.timestamp);
      setReportDate(anomalyDate.toISOString().split("T")[0]);
      setReportTime(anomalyDate.toLocaleTimeString());
    }
  }, [anomalyReading]);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const pdf = new jsPDF("portrait", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;

      // HEADER STYLING
      pdf.setFillColor(217, 238, 218); // Light green header background
      pdf.rect(0, 0, pageWidth, 30, "F");

      pdf.setTextColor(47, 133, 90);
      pdf.setFont("helvetica", "bold");

      // Primary Title
      pdf.setFontSize(20);
      pdf.text("POWER QUALITY MONITORING", pageWidth / 2, 15, {
        align: "center",
      });

      // Subtitle
      pdf.setFontSize(14);
      pdf.setTextColor(40, 125, 90); // Lighter green color
      pdf.text("Anomaly Analysis Report", pageWidth / 2, 23, {
        align: "center",
      });

      // BODY SECTION
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(12);
      let y = 40;
      const lineHeight = 8;

      // --- Helper to render label + value on the same line ---
      const renderField = (label, value, valueColor = [0, 0, 0]) => {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        const labelText = `${label}:`;
        const labelWidth = pdf.getTextWidth(labelText + " ");

        pdf.text(labelText, margin, y);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...valueColor);
        pdf.text(value, margin + labelWidth, y);

        y += lineHeight;
      };

      // --- Render Fields ---
      renderField("Generated", new Date().toLocaleString());

      if (anomalyReading) {
        renderField(
          "Anomaly Type",
          anomalyReading.anomaly_type || "Unknown",
          [200, 0, 0]
        ); // red
        renderField("Reading ID", anomalyReading.id || "Unknown");
        renderField(
          "Timestamp",
          new Date(anomalyReading.timestamp).toLocaleString()
        );
      }

      // CHART CAPTURE
      const chartElement = document.querySelector(".status-report-chart");
      if (chartElement) {
        const chartCanvas = await html2canvas(chartElement, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        const imgData = chartCanvas.toDataURL("image/png");
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (chartCanvas.height / chartCanvas.width) * imgWidth;

        pdf.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      }

      // ADD EXPLANATION SECTION ON NEW PAGE
      pdf.addPage();

      // Explanation content
      const explanationElement = document.querySelector(
        ".status-report-explanation"
      );
      if (explanationElement) {
        const explCanvas = await html2canvas(explanationElement, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        const explImgData = explCanvas.toDataURL("image/png");
        const explWidth = pageWidth - 2 * margin;
        const explHeight = (explCanvas.height / explCanvas.width) * explWidth;

        pdf.setTextColor(0, 0, 0);
        pdf.addImage(explImgData, "PNG", margin, 20, explWidth, explHeight);
      }

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
            <div className="date-label">Report Date and Time:</div>
            <input
              type="text"
              className="date-picker"
              value={`${reportDate} ${reportTime}`}
              readOnly
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
