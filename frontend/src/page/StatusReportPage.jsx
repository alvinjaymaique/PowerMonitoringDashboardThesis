import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StatusReportHeader from "../components/StatusReportHeader";
import StatusReportChart from "../components/StatusReportChart";
import StatusReportExplanation from "../components/StatusReportExplanation";
import "../css/StatusReportPage.css";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const StatusReportPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anomalyReading, setAnomalyReading] = useState(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Extract anomaly data from location state if available
  useEffect(() => {
    if (location.state && location.state.anomalyReading) {
      setAnomalyReading(location.state.anomalyReading);
    }
  }, [location]);

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleDateChange = (e) => {
    setReportDate(e.target.value);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      // Create a new PDF document
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      
      // Add title
      pdf.setFontSize(18);
      pdf.text(`Anomaly Analysis Report`, margin, margin + 5);
      
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, margin + 15);
      
      if (anomalyReading) {
        pdf.text(`Anomaly Type: ${anomalyReading.anomaly_type || 'Unknown'}`, margin, margin + 25);
        pdf.text(`Reading ID: ${anomalyReading.id || 'Unknown'}`, margin, margin + 35);
        pdf.text(`Timestamp: ${new Date(anomalyReading.timestamp).toLocaleString()}`, margin, margin + 45);
      }
      
      // Capture the chart
      const chartElement = document.querySelector('.status-report-chart');
      if (chartElement) {
        const chartCanvas = await html2canvas(chartElement, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true
        });
        
        const chartImgData = chartCanvas.toDataURL('image/png');
        pdf.addImage(chartImgData, 'PNG', margin, 60, pageWidth - (margin * 2), 120);
      }
      
      // Capture the explanation
      const explanationElement = document.querySelector('.status-report-explanation');
      if (explanationElement) {
        const explCanvas = await html2canvas(explanationElement, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true
        });
        
        const explImgData = explCanvas.toDataURL('image/png');
        pdf.addImage(explImgData, 'PNG', margin, 190, pageWidth - (margin * 2), 80);
      }
      
      // Save the PDF
      pdf.save(`Anomaly_Report_${reportDate}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="status-report-page">
      <StatusReportHeader
        reportDate={reportDate}
        handleDateChange={handleDateChange}
        handleDownloadPDF={handleDownloadPDF}
        isGeneratingPDF={isGeneratingPDF}
      />

      <StatusReportChart anomalyReading={anomalyReading} />

      <StatusReportExplanation anomalyReading={anomalyReading} />

      <div className="back-button-container">
        <button className="back-button" onClick={handleBack}>
          ⬅ Back
        </button>
      </div>
    </div>
  );
};

export default StatusReportPage;