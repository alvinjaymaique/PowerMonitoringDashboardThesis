import numpy as np
import pandas as pd
import shap
import logging
import traceback
from .classifier_service import MLAnomalyClassifier

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ShapExplainerService:
    """Service for generating SHAP explanations for anomaly classifications."""
    
    def __init__(self):
        """Initialize the explainer with the ML classifier."""
        try:
            # Get the trained model from classifier service
            self.classifier = MLAnomalyClassifier()
            logger.info(f"ML Classifier loaded successfully with features: {self.classifier.features}")
            
            # Create a SHAP explainer using the trained model
            logger.info("Creating SHAP TreeExplainer...")
            
            # Initialize explainer with model
            self.explainer = shap.TreeExplainer(self.classifier.model)
            logger.info("SHAP TreeExplainer initialized successfully")
            
            # Test explainer to verify it works
            logger.info("Testing SHAP explainer functionality...")
            test_data = pd.DataFrame({
                'voltage': [235.9],
                'current': [0.723],
                'power': [86.7],
                'frequency': [59.8],
                'powerFactor': [0.51],
                'voltage_deviation': [(235.9 - 230.0) / 230.0],
                'frequency_deviation': [(59.8 - 60.0) / 60.0],
                'pf_deviation': [0.51 - 1.0],
                'power_voltage_ratio': [86.7 / 235.9],
                'current_voltage_ratio': [0.723 / 235.9]
            }, columns=self.classifier.features)
            
            # Test SHAP values calculation
            shap_values = self.explainer.shap_values(test_data)
            logger.info(f"Test SHAP values successfully generated with shape: {np.array(shap_values).shape}")
            
        except Exception as e:
            logger.error(f"Error initializing SHAP explainer: {str(e)}")
            logger.error(traceback.format_exc())
            raise e
    
    def explain_reading(self, reading):
        """Generate SHAP values for a specific reading."""
        try:
            # Extra debugging for the input reading
            logger.info(f"Explaining reading with ID: {reading.get('id', 'unknown')}")
            
            # Prepare features for the model using the classifier's method
            features = self.classifier.prepare_features(reading)
            if features is None:
                logger.error(f"Failed to prepare features for reading: {reading.get('id', 'unknown')}")
                return None
                
            logger.info(f"Features prepared successfully: {features.columns.tolist()}")
            logger.info(f"Feature values: {features.iloc[0].to_dict()}")
            
            # Calculate SHAP values
            logger.info(f"Calculating SHAP values...")
            shap_values = self.explainer.shap_values(features)
            logger.info(f"SHAP values calculated successfully")
            
            # Get the prediction class index
            prediction = self.classifier.model.predict(features)[0]
            logger.info(f"Prediction class: {prediction}")
            
            if hasattr(prediction, 'item'):
                prediction_idx = prediction.item()  # Convert numpy integer to Python int
            else:
                prediction_idx = int(prediction)
                
            logger.info(f"Predicted class index: {prediction_idx}")
            logger.info(f"Predicted class label: {self.classifier.anomaly_labels.get(prediction_idx, 'Unknown')}")
            
            # Get the SHAP values for this prediction class
            # Different SHAP explainers structure output differently
            if isinstance(shap_values, list):
                # If shap_values is a list of arrays (one per class), use the predicted class
                class_shap_values = shap_values[prediction_idx][0]
                logger.info(f"Using class-specific SHAP values for class {prediction_idx}")
            else:
                # If it's just an array of values
                class_shap_values = shap_values[0]
                logger.info("Using general SHAP values")
            
            # Get expected value based on the type
            if isinstance(self.explainer.expected_value, list):
                base_value = float(self.explainer.expected_value[prediction_idx])
            else:
                base_value = float(self.explainer.expected_value)
                
            logger.info(f"Base value: {base_value}")
            
            # Format the result for the frontend waterfall chart
            result = {
                'feature_names': self.classifier.features,
                'shap_values': class_shap_values.tolist(),  # Convert numpy array to list
                'base_value': base_value,
                'predicted_class': self.classifier.anomaly_labels.get(prediction_idx, 'Unknown'),
                'feature_values': features.iloc[0].to_dict()
            }
            
            logger.info(f"SHAP explanation generated successfully for reading {reading.get('id', 'unknown')}")
            return result
            
        except Exception as e:
            logger.error(f"Error generating SHAP explanation: {str(e)}")
            logger.error(traceback.format_exc())
            return None