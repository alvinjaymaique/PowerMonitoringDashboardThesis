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
      'HighLoad_SevereDips': 'Significant voltage drops during high power consumption',
      'Idle_Undervoltage': 'Sustained undervoltage at idle, may indicate systemic issue',
      'LightLoad_SeverePF': 'Light load with severely poor power factor',
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
  
  // Determine parameter class based on type
  const getParameterClass = (paramName) => {
    if (paramName === 'voltage') return 'anomaly-type-voltage';
    if (paramName === 'frequency') return 'anomaly-type-frequency';
    if (paramName === 'power_factor') return 'anomaly-type-pf';
    return 'anomaly-type-normal';
  };

  return (
    <div className="status-report-explanation">
      <h4>Anomaly Classification Details</h4>
      <div className="explanation-content">
        {hasClassification ? (
          <>
            <h3>Anomaly Classification: {anomalyReading.anomaly_type}</h3>
            <p><strong>Characteristics:</strong> {getTypeExplanation()}</p>
            <p><strong>Abnormal Parameters:</strong> {getAnomalyFeatures().join(', ')}</p>
            
            <div className="timestamp-info">
              <strong>Recorded at:</strong> {new Date(anomalyReading.timestamp).toLocaleString()}
            </div>
            
            <div className="parameter-values">
              <div className={`parameter-item ${getParameterClass('voltage')}`}>
                <div className="parameter-label">Voltage</div>
                <div className="parameter-value">{anomalyReading.voltage}V</div>
              </div>
              
              <div className={`parameter-item ${getParameterClass('current')}`}>
                <div className="parameter-label">Current</div>
                <div className="parameter-value">{anomalyReading.current}A</div>
              </div>
              
              <div className={`parameter-item ${getParameterClass('power')}`}>
                <div className="parameter-label">Power</div>
                <div className="parameter-value">{anomalyReading.power}W</div>
              </div>
              
              <div className={`parameter-item ${getParameterClass('frequency')}`}>
                <div className="parameter-label">Frequency</div>
                <div className="parameter-value">{anomalyReading.frequency}Hz</div>
              </div>
              
              <div className={`parameter-item ${getParameterClass('power_factor')}`}>
                <div className="parameter-label">Power Factor</div>
                <div className="parameter-value">{anomalyReading.power_factor}</div>
              </div>
            </div>
            
            {anomalyReading.anomaly_type.includes('Excellent') || 
             anomalyReading.anomaly_type.includes('Optimal') || 
             anomalyReading.anomaly_type.includes('Stable') ? (
              <div className="operational-note">
                <p>This is an operational anomaly, indicating a normal operating state that differs from baseline. This reading is within acceptable operational parameters.</p>
              </div>
            ) : null}
          </>
        ) : (
          <p>Select an anomaly from the table to view detailed analysis.</p>
        )}
      </div>
    </div>
  );
};

export default StatusReportExplanation;