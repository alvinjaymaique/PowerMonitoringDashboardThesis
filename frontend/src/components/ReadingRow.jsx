import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faExclamationTriangle,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import {
  isAnomalyByThresholds,
  getAnomalyReason,
} from "../utils/powerReadingsUtils";
import "../css/ReadingRow.css";

/**
 * Component to display a single power reading row
 */
const ReadingRow = React.memo(
  ({ reading, formatDate, formatTime, onShowStatusReport }) => {
    // Check if anomalous by thresholds or by the server-side flag
    const isAnomaly = reading.is_anomaly || isAnomalyByThresholds(reading);

    // Get reason for the anomaly
    const anomalyReason = isAnomaly ? getAnomalyReason(reading) : "";

    // Get the specific anomaly type from the API or default to "Yes/No"
    let anomalyType = "Normal";
    if (isAnomaly) {
      anomalyType = reading.anomaly_type || "Yes";
    }

    // Determine color class based on anomaly type
    const getAnomalyClass = (type) => {
      if (type === "Normal") return "normal-indicator";
      if (type === "Classifying...") return "processing-anomaly";
      if (type === "Unknown") return "unknown-anomaly";
      if (
        type.includes("Excellent") ||
        type.includes("Optimal") ||
        type.includes("Stable")
      )
        return "operational-anomaly";
      return "true-anomaly";
    };

    return (
      <tr
        className={`${isAnomaly ? "anomaly-row" : ""} ${
          reading.isNew ? "new-reading" : ""
        }`}
        title={anomalyReason ? `Anomaly: ${anomalyReason}` : ""}
      >
        <td>{reading.deviceId}</td>
        <td>{formatDate(reading.timestamp)}</td>
        <td>{formatTime(reading.timestamp)}</td>
        <td
          className={
            !(217.4 <= reading.voltage && reading.voltage <= 242.6)
              ? "anomaly-value"
              : ""
          }
        >
          {reading.voltage}
        </td>
        <td>{reading.current}</td>
        <td>{reading.power}</td>
        <td
          className={
            !(59.2 <= reading.frequency && reading.frequency <= 60.8)
              ? "anomaly-value"
              : ""
          }
        >
          {reading.frequency}
        </td>
        <td
          className={
            !(0.792 <= reading.power_factor && reading.power_factor <= 1)
              ? "anomaly-value"
              : ""
          }
        >
          {reading.power_factor}
        </td>
        <td
          className={isAnomaly ? "anomaly-cell" : "normal-cell"}
          onClick={() => {
            if (isAnomaly && typeof onShowStatusReport === "function") {
              // Pass the anomaly date and time to the status report modal
              onShowStatusReport({
                ...reading,
                reportDate: formatDate(reading.timestamp),
                reportTime: formatTime(reading.timestamp),
                disableCalendar: true, // Ensure calendar is disabled
              });
            }
          }}
          style={{ cursor: isAnomaly ? "pointer" : "default" }}
        >
          {isAnomaly ? (
            <span
              className={`anomaly-type ${getAnomalyClass(anomalyType)}`}
              title={anomalyReason}
            >
              <FontAwesomeIcon
                icon={
                  anomalyType === "Classifying..."
                    ? faSpinner
                    : faExclamationTriangle
                }
                spin={anomalyType === "Classifying..."}
              />
              {anomalyType}
            </span>
          ) : (
            <span className="normal-indicator">
              <FontAwesomeIcon icon={faCheck} /> Normal
            </span>
          )}
        </td>
      </tr>
    );
  }
);

export default ReadingRow;
