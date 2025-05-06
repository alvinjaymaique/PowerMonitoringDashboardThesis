import React from "react";
import { useNavigate } from "react-router-dom";
import StatusReportHeader from "../components/StatusReportHeader";
import StatusReportChart from "../components/StatusReportChart";
import StatusReportExplanation from "../components/StatusReportExplanation";
import "../css/StatusReport.css";

const StatusReportPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/dashboard"); // Navigate to the main content of the dashboard
  };

  return (
    <div className="status-report-page">
      <StatusReportHeader
        reportDate={""}
        handleDateChange={() => {}}
        handleDownloadPDF={() => {}}
        isGeneratingPDF={false}
      />

      <StatusReportChart />

      <StatusReportExplanation />

      <div className="back-button-container">
        <button className="back-button" onClick={handleBack}>
          ⬅ Back
        </button>
      </div>
    </div>
  );
};

export default StatusReportPage;
