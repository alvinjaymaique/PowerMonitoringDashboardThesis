import React, { useState } from 'react';
import '../css/Dashboard.css';
import { usePowerData } from '../hooks/usePowerData';
import { getDateRangeWarning } from '../services/dataProcessingService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
// Add these imports for PDF generation
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Component imports
import DashboardHeader from './DashboardHeader';
import StatusIndicators from './StatusIndicators';
import PowerQualityStatus from './PowerQualityStatus';
import InterruptionMetrics from './InterruptionMetrics';
import AnomalyMetrics from './AnomalyMetrics';
import DashboardGraph from './DashboardGraph';
import ModalDialog from './ModalDialog';

/**
 * Power Monitoring Dashboard
 * --------------------------
 * This dashboard visualizes and analyzes power quality metrics from multiple collection nodes.
 */
const Dashboard = () => {
  // Get data and handlers from custom hook
  const { 
    readings,
    latestReading,
    availableNodes,
    selectedNode,
    startDate,
    endDate,
    nodeMinDate,
    nodeMaxDate,
    nodeDateRangeInfo,
    isLoading,
    isLoadingNodes,
    isLoadingDateRange,
    dataLoadProgress,
    isProcessingAnomalies,
    anomalyProgress,
    currentLoadingDate,
    totalDays,
    daysLoaded,
    handleNodeChange,
    handleStartDateChange,
    handleEndDateChange
  } = usePowerData();
  
  // Local state for this component
  const [graphType, setGraphType] = useState('power');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });
  // Add state for PDF generation
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Handler for graph type change
  const handleGraphTypeChange = (type) => {
    setGraphType(type);
  };

  // Handler for PDF download
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
      
      // Capture the chart with higher quality
      const chartElement = document.querySelector('.status-report-chart');
      if (chartElement) {
        const chartCanvas = await html2canvas(chartElement, {
          scale: 2.5, // Higher quality but not too large
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff"
        });
        
        const chartImgData = chartCanvas.toDataURL('image/png');
        
        // Calculate dimensions that preserve aspect ratio
        const chartAspectRatio = chartCanvas.width / chartCanvas.height;
        const chartWidth = pageWidth - (margin * 2);
        const chartHeight = chartWidth / chartAspectRatio;
        
        // Add chart with preserved aspect ratio
        pdf.addImage(chartImgData, 'PNG', margin, 55, chartWidth, chartHeight);
        
        // Track the y-position after adding the chart
        let yPosition = 55 + chartHeight + 10; // Add 10mm spacing
        
        // Capture the explanation
        const explanationElement = document.querySelector('.status-report-explanation');
        if (explanationElement) {
          const explCanvas = await html2canvas(explanationElement, {
            scale: 2.5,
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff"
          });
          
          const explImgData = explCanvas.toDataURL('image/png');
          
          // Calculate dimensions that preserve aspect ratio for explanation
          const explAspectRatio = explCanvas.width / explCanvas.height;
          const explWidth = pageWidth - (margin * 2);
          const explHeight = explWidth / explAspectRatio;
          
          // Check if explanation will fit on current page
          if (yPosition + explHeight > pageHeight - 15) {
            // Add a new page if it won't fit
            pdf.addPage();
            yPosition = margin;
          }
          
          // Add explanation with preserved aspect ratio
          pdf.addImage(explImgData, 'PNG', margin, yPosition, explWidth, explHeight);
        }
        
        // Save the PDF
        pdf.save(`Anomaly_Report_${reportDate}.pdf`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Modal handlers
  const openModal = (title, content) => {
    setModalContent({ title, content });
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
  };

  // Get date range warning
  const dateRangeWarning = getDateRangeWarning(startDate, endDate);

  return (
    <div className="dashboard-container">
      {/* Header and Controls */}
      <DashboardHeader 
        selectedNode={selectedNode}
        availableNodes={availableNodes}
        startDate={startDate}
        endDate={endDate}
        nodeMinDate={nodeMinDate}
        nodeMaxDate={nodeMaxDate}
        isLoadingNodes={isLoadingNodes}
        isLoading={isLoading || isGeneratingPDF}
        isLoadingDateRange={isLoadingDateRange}
        handleNodeChange={handleNodeChange}
        handleStartDateChange={handleStartDateChange}
        handleEndDateChange={handleEndDateChange}
        handleDownloadPDF={handleDownloadPDF}
        readings={readings}
        isGeneratingPDF={isGeneratingPDF}
      />

      {/* PDF Generation Indicator */}
      {isGeneratingPDF && (
        <div className="pdf-generating-banner">
          <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
          <span>Generating PDF report... Please wait.</span>
          <div className="progress-bar-container mini">
            <div className="progress-bar-indeterminate"></div>
          </div>
        </div>
      )}

      {/* Warning and Progress Indicators */}
      <StatusIndicators 
        dateRangeWarning={dateRangeWarning}
        dataLoadProgress={dataLoadProgress}
        daysLoaded={daysLoaded}
        totalDays={totalDays}
        currentLoadingDate={currentLoadingDate}
        isProcessingAnomalies={isProcessingAnomalies}
        anomalyProgress={anomalyProgress}
        nodeDateRangeInfo={nodeDateRangeInfo}
        selectedNode={selectedNode}
      />

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Metric Cards */}
        <div className="metric-cards-row">
          <PowerQualityStatus
            readings={readings}
            latestReading={latestReading}
            thresholds={{
              voltage: { 
                min: 217.4, 
                max: 242.6, 
                ideal: { min: 220, max: 240 }
              },
              frequency: { 
                min: 59.2, 
                max: 60.8, 
                ideal: { min: 59.8, max: 60.2 }
              },
              powerFactor: { 
                min: 0.792, 
                ideal: 0.1
              }
            }}
            method="combined"
            onModalOpen={openModal}
          />
          
          <InterruptionMetrics 
            readings={readings}
            voltageThreshold={180}
            minDurationSec={30}
            onModalOpen={openModal}
          />
          
          <AnomalyMetrics
            readings={readings}
            onModalOpen={openModal}
            isProcessing={isProcessingAnomalies}
          />
        </div>
        
        {/* Graph Section */}
        <div className="graph-row">
          <DashboardGraph 
            graphType={graphType}
            selectedNode={selectedNode}
            isProcessingAnomalies={isProcessingAnomalies}
            handleGraphTypeChange={handleGraphTypeChange}
            isLoading={isLoading}
            readings={readings}
            dataLoadProgress={dataLoadProgress}
          />
        </div>
      </div>

      {/* Modal */}
      <ModalDialog 
        showModal={showModal}
        modalContent={modalContent}
        closeModal={closeModal}
      />
    </div>
  );
};

export default Dashboard;