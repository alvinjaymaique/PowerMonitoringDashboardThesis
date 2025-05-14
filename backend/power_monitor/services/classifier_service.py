from joblib import load
from django.conf import settings
import os
import numpy as np
import pandas as pd
import logging

# Configure logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

class MLAnomalyClassifier:
    """Service for classifying power anomalies using the trained Random Forest model."""
    
    def __init__(self):
        """Load the trained model."""
        try:
            # Path to the trained model
            model_path = os.path.join(settings.BASE_DIR, 'ml_model', 'random_forest_model.joblib')
            
            # Check if model file exists
            if not os.path.exists(model_path):
                logger.error(f"Model file not found at {model_path}")
                raise FileNotFoundError(f"Model file not found at {model_path}")
            
            logger.info(f"Loading model from {model_path}")
            self.model = load(model_path)
            logger.info(f"Model loaded successfully")
            
            # Define anomaly class labels mapping
            self.anomaly_labels = {
                0: 'LightLoad_VoltageSurge',
                1: 'Idle_Overvoltage',
                2: 'LightLoad_Undervoltage',
                3: 'HighLoad_VoltageInstability',
                4: 'HighLoad_SevereTransients',
                5: 'Idle_Undervoltage',
                6: 'LowPF_ReactiveLoad',
                7: 'ModeratePF_MinorSurge',
                8: 'HighLoad_MixedAnomalies',
                9: 'LightLoad_Undervoltage_LowPF',
                10: 'LightLoad_MinorSurge',
                11: 'HighLoad_Optimal',
                12: 'Idle_Stable',
                13: 'HighLoad_Excellent',
                14: 'PeakLoad_Excellent'
            }
            
            # Features needed for the model (in the correct order and with correct names)
            self.features = [
                'voltage', 'current', 'frequency', 'power', 'powerFactor',  
                'voltage_deviation', 'frequency_deviation', 'pf_deviation', 
                'power_voltage_ratio', 'current_voltage_ratio'
            ]
            
        except Exception as e:
            logger.error(f"ERROR initializing ML classifier: {str(e)}")
            raise e
        
    def prepare_features(self, reading):
        """Prepare features for the model prediction."""
        try:
            # Ensure we have the basic required features
            if not all(key in reading for key in ['voltage', 'current', 'power', 'frequency', 'power_factor']):
                logger.warning(f"Reading missing required features")
                return None
                    
            # Create derived features - using the EXACT feature names expected by the model
            feature_dict = {
                'voltage': reading['voltage'],
                'current': reading['current'],
                'power': reading['power'],
                'frequency': reading['frequency'],
                'powerFactor': reading['power_factor'],  # Changed from power_factor to powerFactor
                'voltage_deviation': (reading['voltage'] - 230.0) / 230.0,
                'frequency_deviation': (reading['frequency'] - 60.0) / 60.0,
                'pf_deviation': reading['power_factor'] - 1.0,
                'power_voltage_ratio': reading['power'] / (reading['voltage'] + 0.1),
                'current_voltage_ratio': reading['current'] / (reading['voltage'] + 0.1)
            }
            
            # Return as pandas DataFrame with exactly the feature names expected by the model
            return pd.DataFrame([feature_dict], columns=self.features)
        except Exception as e:
            logger.error(f"Error preparing features: {str(e)}")
            return None
        
    def classify_anomaly(self, reading):
        """Classify an anomaly reading using the trained model."""
        if not reading['is_anomaly']:
            return 'Normal'
            
        # Prepare features
        features = self.prepare_features(reading)
        if features is None:
            return 'Unknown'
            
        # Make prediction
        try:
            # Get raw prediction without logging
            prediction = self.model.predict(features)[0]
            
            # Handle the prediction based on its type
            if isinstance(prediction, (int, np.integer)):
                # If it's an integer index, look up the label
                if hasattr(prediction, 'item'):
                    prediction_idx = prediction.item()  # Convert numpy type
                else:
                    prediction_idx = int(prediction)
                
                anomaly_type = self.anomaly_labels.get(prediction_idx, 'Unknown')
            else:
                # If it's already a string label, use it directly
                anomaly_type = str(prediction)
            
            return anomaly_type
        except Exception as e:
            logger.error(f"Error classifying reading {reading.get('id', 'unknown')}: {str(e)}")
            return 'Unknown'
        
    def classify_batch(self, readings):
        """Classify a batch of readings."""
        logger.info(f"Classifying batch of {len(readings)} readings")
        anomaly_count = 0
        result_readings = []
        
        for reading in readings:
            # Only process readings flagged as anomalies
            if reading['is_anomaly']:
                reading_copy = dict(reading)  # Create copy to avoid modifying original
                reading_copy['anomaly_type'] = self.classify_anomaly(reading)
                result_readings.append(reading_copy)
                anomaly_count += 1
        
        logger.info(f"Classification complete. Found {anomaly_count} anomalies in {len(readings)} readings.")
        return result_readings