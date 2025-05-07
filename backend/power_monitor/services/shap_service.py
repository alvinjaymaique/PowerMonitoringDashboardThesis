import numpy as np
import pandas as pd
import shap
import logging
import traceback
import os
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
            
            # Create a SHAP explainer using the trained model - match the notebook approach exactly
            logger.info("Creating SHAP TreeExplainer...")
            
            # Initialize explainer with model - TreeExplainer was chosen in the notebook
            # because it had the best metrics (stability score = 1.0)
            self.explainer = shap.TreeExplainer(self.classifier.model)
            logger.info("SHAP TreeExplainer initialized successfully")
            
            # Create output directory for SHAP plots if used
            os.makedirs('shap_plots', exist_ok=True)
            
            # Define anomaly class mapping (should match classifier)
            self.anomaly_labels = self.classifier.anomaly_labels
            
        except Exception as e:
            logger.error(f"Error initializing SHAP explainer: {str(e)}")
            logger.error(traceback.format_exc())
            raise e
    
    def explain_reading(self, reading):
        """Generate SHAP values for a specific reading."""
        try:
            # Prepare features using the classifier's method
            features = self.classifier.prepare_features(reading)
            if features is None:
                logger.error(f"Failed to prepare features for reading: {reading.get('id', 'unknown')}")
                return None
                    
            print(f"Features prepared successfully: {features.columns.tolist()}")
            logger.info(f"Features prepared successfully: {features.columns.tolist()}")
            
            # Calculate SHAP values - mirroring the notebook approach
            logger.info(f"Calculating SHAP values...")
            shap_values = self.explainer.shap_values(features)
            logger.info(f"SHAP values calculated successfully with shape: {np.array(shap_values).shape if isinstance(shap_values, list) else shap_values.shape}")
            print(f"SHAP values calculated successfully with shape: {np.array(shap_values).shape if isinstance(shap_values, list) else shap_values.shape}")
            
            # Get the prediction class index
            prediction = self.classifier.model.predict(features)[0]
            logger.info(f"Prediction class: {prediction}")
            
            # Handle different prediction types
            if hasattr(prediction, 'item'):
                prediction_idx = prediction.item()  # Convert numpy integer to Python int
            elif isinstance(prediction, (int, np.integer)):
                prediction_idx = int(prediction)
            elif isinstance(prediction, str):
                # If prediction is a string label, find its index in anomaly_labels
                for idx, label in self.classifier.anomaly_labels.items():
                    if label == prediction:
                        prediction_idx = idx
                        break
                else:
                    # If string not found in labels, default to index 0
                    logger.warning(f"Prediction '{prediction}' not found in anomaly_labels, defaulting to 0")
                    prediction_idx = 0
            else:
                # Unexpected type - log and default to 0
                logger.error(f"Unexpected prediction type: {type(prediction)}")
                prediction_idx = 0
                    
            logger.info(f"Predicted class index: {prediction_idx}")
            
            # In the notebook, different handling occurs based on SHAP values format
            if isinstance(shap_values, list):
                # For TreeExplainer with multi-class output (as in the notebook)
                class_shap_values = shap_values[prediction_idx][0]  # First sample, specific class
                base_value = self.explainer.expected_value[prediction_idx]
                logger.info(f"Using class-specific SHAP values for class {prediction_idx}")
            elif len(shap_values.shape) == 3:
                # For 3D array from other explainers (samples, features, classes) - ADDED THIS CASE
                class_shap_values = shap_values[0, :, prediction_idx]
                if isinstance(self.explainer.expected_value, np.ndarray) or isinstance(self.explainer.expected_value, list):
                    base_value = self.explainer.expected_value[prediction_idx]
                else:
                    base_value = self.explainer.expected_value
                logger.info(f"Using 3D array SHAP values for class {prediction_idx}")
            else:
                # For single output or other explainers
                class_shap_values = shap_values[0]  # Just take the first sample
                base_value = float(self.explainer.expected_value)
                logger.info("Using general SHAP values")
            
            logger.info(f"Base value: {base_value}")
            
            # Format the result for the frontend waterfall chart
            result = {
                'feature_names': self.classifier.features,
                'shap_values': class_shap_values.tolist(),  # Convert numpy array to list
                'base_value': float(base_value),  # Ensure this is a native Python float
                'predicted_class': self.anomaly_labels.get(prediction_idx, 'Unknown'),
                'feature_values': features.iloc[0].to_dict()
            }
            print(f"SHAP explanation generated successfully for reading {reading.get('id', 'unknown')}")
            logger.info(f"SHAP explanation generated successfully for reading {reading.get('id', 'unknown')}")
            return result
            
        except Exception as e:
            print(f"Error generating SHAP explanation: {str(e)}")
            print(traceback.format_exc())
            logger.error(f"Error generating SHAP explanation: {str(e)}")
            logger.error(traceback.format_exc())
            return None