import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileDownload, faSpinner } from "@fortawesome/free-solid-svg-icons";

const StatusReportHeader = ({
  reportDate,
  handleDateChange,
  handleDownloadPDF,
  isGeneratingPDF,
}) => {
  return (
    <div className="status-report-header">
      <div className="header-left">
        <h2 className="report-title">Status Report</h2>
      </div>

      <div className="header-right">
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
              <FontAwesomeIcon icon={faSpinner} spin /> Generating PDF...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faFileDownload} /> Download .pdf
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StatusReportHeader;
