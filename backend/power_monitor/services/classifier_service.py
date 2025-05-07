import os
import numpy as np
import pandas as pd
from joblib import load
from django.conf import settings

class MLAnomalyClassifier:
    """Service for classifying power anomalies using the trained Random Forest model."""
    
    def __init__(self):
        """Load the trained model."""
        try:
            # Path to the trained model
            model_path = os.path.join(settings.BASE_DIR, 'ml_model', 'random_forest_model.joblib')
            
            # Check if model file exists
            if not os.path.exists(model_path):
                print(f"ERROR: Model file not found at {model_path}")
                print(f"Current working directory: {os.getcwd()}")
                print(f"BASE_DIR: {settings.BASE_DIR}")
                
                # Try to list the directory contents
                ml_dir = os.path.join(settings.BASE_DIR, 'ml_model')
                if os.path.exists(ml_dir):
                    print(f"Files in ml_model directory: {os.listdir(ml_dir)}")
                else:
                    print(f"ml_model directory doesn't exist at {ml_dir}")
                    
                raise FileNotFoundError(f"Model file not found at {model_path}")
            
            print(f"Loading model from {model_path}")
            self.model = load(model_path)
            print(f"Model loaded successfully: {type(self.model)}")
            
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
                'voltage', 'current', 'frequency', 'power', 'powerFactor',  # Changed from power_factor to powerFactor
                'voltage_deviation', 'frequency_deviation', 'pf_deviation', 
                'power_voltage_ratio', 'current_voltage_ratio'
            ]
            
            print(f"Classifier initialized with {len(self.anomaly_labels)} anomaly types")
            
        except Exception as e:
            import traceback
            print(f"ERROR initializing ML classifier: {str(e)}")
            traceback.print_exc()
            raise e
        
    def prepare_features(self, reading):
        """Prepare features for the model prediction."""
        try:
            # Ensure we have the basic required features
            if not all(key in reading for key in ['voltage', 'current', 'power', 'frequency', 'power_factor']):
                print(f"Reading missing required features: {reading}")
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
            
            # Debug info - print feature values
            print(f"Features calculated for {reading.get('id', 'unknown')}:")
            for f in ['voltage', 'current', 'frequency', 'power', 'powerFactor', 
                    'voltage_deviation', 'frequency_deviation', 'pf_deviation',
                    'power_voltage_ratio', 'current_voltage_ratio']:
                print(f"  {f}: {feature_dict[f]}")
                    
            # Return as pandas DataFrame with exactly the feature names expected by the model
            import pandas as pd
            
            # Make sure self.features also uses the correct names
            features = [
                'voltage', 'current', 'frequency', 'power', 'powerFactor',
                'voltage_deviation', 'frequency_deviation', 'pf_deviation', 
                'power_voltage_ratio', 'current_voltage_ratio'
            ]
            
            return pd.DataFrame([feature_dict], columns=features)
        except Exception as e:
            print(f"Error preparing features: {e}")
            import traceback
            traceback.print_exc()
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
            # Get raw prediction - less verbose logging
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
            
            # Log only occasionally to reduce console spam
            if reading.get('id', '').endswith('0'):  # Log only every 10th reading
                print(f"Classified {reading.get('id', 'unknown')} as '{anomaly_type}'")
                
            return anomaly_type
        except Exception as e:
            print(f"Error classifying reading {reading.get('id', 'unknown')}: {e}")
            return 'Unknown'
        
    def classify_batch(self, readings):
        """Classify a batch of readings."""
        print(f"Classifying batch of {len(readings)} readings")
        anomaly_count = 0
        
        for i, reading in enumerate(readings):
            if reading['is_anomaly']:
                reading['anomaly_type'] = self.classify_anomaly(reading)
                anomaly_count += 1
                
                # Only log every 10th reading to reduce console spam
                if i % 10 == 0: 
                    print(f"Processed {i}/{len(readings)} readings - current: {reading.get('id', 'unknown')}")
            else:
                reading['anomaly_type'] = 'Normal'
        
        print(f"Classification complete. Found {anomaly_count} anomalies in {len(readings)} readings.")
        return readings