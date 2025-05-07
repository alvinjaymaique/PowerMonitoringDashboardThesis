import React from "react";

const StatusReportExplanation = ({ anomalyReading }) => {
  // Check if we have an anomaly reading with classification
  const hasClassification = anomalyReading && anomalyReading.anomaly_type && 
                          anomalyReading.anomaly_type !== 'Unknown';
  
  // Get anomaly features that contributed to the classification
  const getAnomalyFeatures = () => {
    if (!anomalyReading || !anomalyReading.anomaly_parameters) return [];
    return anomalyReading.anomaly_parameters;
  };
  
  // Map anomaly type to explanation
  const getTypeExplanation = () => {
    if (!hasClassification) return "No detailed classification available";
    
    const explanations = {
      'LightLoad_VoltageSurge': 'Voltage surge under light load conditions',
      'Idle_Overvoltage': 'Elevated voltage during idle system state',
      'LightLoad_Undervoltage': 'Undervoltage during light load operation',
      'HighLoad_VoltageInstability': 'High load with significant voltage instability',
      'HighLoad_SevereTransients': 'Severe transient conditions during high load',
      'Idle_Undervoltage': 'Sustained undervoltage at idle, may indicate systemic issue',
      'LowPF_ReactiveLoad': 'Reactive load with poor power factor',
      'ModeratePF_MinorSurge': 'Minor surges with moderate power factor issues',
      'HighLoad_MixedAnomalies': 'Mixed voltage anomalies under high load conditions',
      'LightLoad_Undervoltage_LowPF': 'Combined low power factor and undervoltage issue',
      'LightLoad_MinorSurge': 'Minor voltage surges with otherwise efficient operation',
      'HighLoad_Optimal': 'Ideal high load operation (operational anomaly)',
      'Idle_Stable': 'Baseline idle condition (operational anomaly)',
      'HighLoad_Excellent': 'Excellent operation at high load (operational anomaly)',
      'PeakLoad_Excellent': 'Peak load with excellent power quality (operational anomaly)'
    };
    
    return explanations[anomalyReading.anomaly_type] || 'Classification details not available';
  };

  return (
    <div className="status-report-explanation">
      <h4>In depth explanation</h4>
      <div className="explanation-content">
        {hasClassification ? (
          <>
            <h3>Anomaly Classification: {anomalyReading.anomaly_type}</h3>
            <p><strong>Explanation:</strong> {getTypeExplanation()}</p>
            <p><strong>Abnormal Parameters:</strong> {getAnomalyFeatures().join(', ')}</p>
            <p><strong>Timestamp:</strong> {new Date(anomalyReading.timestamp).toLocaleString()}</p>
            <p><strong>Values:</strong></p>
            <ul>
              <li>Voltage: {anomalyReading.voltage}V</li>
              <li>Current: {anomalyReading.current}A</li>
              <li>Power: {anomalyReading.power}W</li>
              <li>Frequency: {anomalyReading.frequency}Hz</li>
              <li>Power Factor: {anomalyReading.power_factor}</li>
            </ul>
            {anomalyReading.anomaly_type.includes('Excellent') || 
             anomalyReading.anomaly_type.includes('Optimal') || 
             anomalyReading.anomaly_type.includes('Stable') ? (
              <div className="operational-note">
                <p>This is an operational anomaly, indicating a normal operating state that differs from baseline. 
                No corrective action is required.</p>
              </div>
            ) : (
              <div className="action-suggestions">
                <p><strong>Recommended Actions:</strong></p>
                <ul>
                  <li>Monitor the parameter trends over the next 24 hours</li>
                  <li>Check electrical connections and load distribution</li>
                  <li>Consider adjusting protection relay settings if anomalies persist</li>
                </ul>
              </div>
            )}
          </>
        ) : (
          <p>Select an anomaly from the table to view detailed analysis.</p>
        )}
      </div>
    </div>
  );
};

export default StatusReportExplanation;
