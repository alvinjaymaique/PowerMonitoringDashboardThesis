import numpy as np
import pandas as pd
import shap
import logging
from .classifier_service import MLAnomalyClassifier

logger = logging.getLogger(__name__)

class ShapExplainerService:
    """Service for generating SHAP explanations for anomaly classifications."""
    
    def __init__(self):
        """Initialize the explainer with the ML classifier."""
        try:
            # Use the same model as the classifier
            self.classifier = MLAnomalyClassifier()
            
            # Initialize SHAP explainer - using TreeExplainer as per results
            self.explainer = shap.TreeExplainer(self.classifier.model)
            logger.info("SHAP TreeExplainer initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing SHAP explainer: {str(e)}")
            raise e
    
    def explain_reading(self, reading):
        """Generate SHAP values for a specific reading."""
        try:
            # Prepare features as the classifier would
            features = self.classifier.prepare_features(reading)
            if features is None:
                return None
                
            # Calculate SHAP values
            shap_values = self.explainer.shap_values(features)
            
            # Get the prediction class index
            prediction = self.classifier.model.predict(features)[0]
            if hasattr(prediction, 'item'):
                prediction_idx = prediction.item()
            else:
                prediction_idx = int(prediction)
                
            # Get the SHAP values for this specific prediction class
            class_shap_values = shap_values[prediction_idx][0]
            
            # Format for waterfall plot
            result = {
                'feature_names': self.classifier.features,
                'shap_values': class_shap_values.tolist(),
                'base_value': self.explainer.expected_value[prediction_idx],
                'predicted_class': self.classifier.anomaly_labels.get(prediction_idx, 'Unknown'),
                'feature_values': features.iloc[0].to_dict()
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating SHAP explanation: {str(e)}")
            return None