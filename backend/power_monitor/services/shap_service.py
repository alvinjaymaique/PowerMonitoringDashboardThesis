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
        
    def safely_convert_to_float(self, np_value):
        """Safely convert numpy values to Python floats, even for arrays."""
        import numpy as np
        
        if np_value is None:
            return 0.0
            
        try:
            # If it's already a scalar-like object that can be converted to float
            return float(np_value)
        except (TypeError, ValueError):
            # If it's an array, get the mean value
            if hasattr(np_value, 'mean'):
                return float(np_value.mean())
            # If it's a list or other iterable
            elif hasattr(np_value, '__iter__'):
                values = list(np_value)
                if not values:
                    return 0.0
                # Recursively convert any nested arrays
                return sum(self.safely_convert_to_float(v) for v in values) / len(values)
            # Fallback
            return 0.0
    
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
        
    def smart_sample_readings(self, readings, sample_size=500):
        """Perform stratified sampling of readings to maintain anomaly type distribution."""
        import random
        
        if len(readings) <= sample_size:
            return readings
        
        # Group readings by anomaly type
        type_groups = {}
        for reading in readings:
            anomaly_type = reading.get('anomaly_type', 'Unknown')
            if anomaly_type not in type_groups:
                type_groups[anomaly_type] = []
            type_groups[anomaly_type].append(reading)
        
        total = len(readings)
        sampled = []
        
        # Calculate how many to sample from each group
        for anomaly_type, group in type_groups.items():
            group_size = len(group)
            # Calculate proportional sample size with minimum threshold
            group_sample = max(5, int(round(group_size / total * sample_size)))
            # Ensure we don't try to sample more than available
            group_sample = min(group_sample, group_size)
            
            # Sample from this group
            sampled.extend(random.sample(group, group_sample))
        
        # If we sampled too many, trim randomly
        if len(sampled) > sample_size:
            sampled = random.sample(sampled, sample_size)
        
        # If we didn't sample enough, add more randomly
        elif len(sampled) < sample_size:
            remaining = [r for r in readings if r not in sampled]
            additional_needed = sample_size - len(sampled)
            if remaining and additional_needed > 0:
                additional = random.sample(remaining, min(additional_needed, len(remaining)))
                sampled.extend(additional)
        
        return sampled
        
    def generate_global_feature_importance(self, readings, sample_size=500):
        """Generate global feature importance across all anomaly types."""
        import traceback
        import logging
        
        logger = logging.getLogger(__name__)
        
        try:
            logger.info(f"Generating global feature importance from {len(readings)} readings")
            
            # If we have too many readings, use smart sampling
            if len(readings) > sample_size:
                sampled_readings = self.smart_sample_readings(readings, sample_size)
                logger.info(f"Sampled {len(sampled_readings)} readings from {len(readings)} total")
            else:
                sampled_readings = readings
            
            # Extract features for the model
            feature_data = []
            for reading in sampled_readings:
                features = self.classifier.prepare_features(reading)
                if features is not None:
                    feature_data.append(features.iloc[0].to_dict())
            
            if not feature_data:
                logger.warning("No valid feature data extracted from readings")
                return None
            
            # Convert to DataFrame for SHAP analysis
            features_df = pd.DataFrame(feature_data)
            
            # Run SHAP analysis
            logger.info("Calculating SHAP values for global feature importance")
            shap_values = self.explainer.shap_values(features_df)
            
            # Handle multi-class output (TreeExplainer returns a list)
            if isinstance(shap_values, list):
                # Calculate mean absolute SHAP values for each class
                class_importances = []
                for i in range(len(shap_values)):
                    class_importance = np.abs(shap_values[i]).mean(axis=0)
                    class_importances.append(class_importance)
                
                # Average across all classes
                feature_importances = np.mean(class_importances, axis=0)
            else:
                feature_importances = np.abs(shap_values).mean(axis=0)
            
            # Ensure we convert NumPy types to Python native types for JSON serialization
            feature_importances = [self.safely_convert_to_float(x) for x in feature_importances]
            
            # Create result dictionary
            result = {
                'feature_names': self.classifier.features,
                'importance_values': feature_importances,
                'sample_size': len(features_df),
                'min_features': 8  # We know from compacity analysis that 8 features give 90% explanation
            }
            
            # Calculate per-anomaly type importance
            try:
                anomaly_types = {}
                classes = self.classifier.model.classes_
                
                # In the try block where anomaly_types dictionary is built:
                if isinstance(shap_values, list) and len(shap_values) == len(classes):
                    for i, anomaly_class in enumerate(classes):
                        class_importance = np.abs(shap_values[i]).mean(axis=0)
                        anomaly_types[anomaly_class] = {
                            feat: self.safely_convert_to_float(imp) for feat, imp in zip(self.classifier.features, class_importance)
                        }
                
                result['anomaly_types'] = anomaly_types
            except Exception as e:
                logger.warning(f"Could not calculate per-anomaly type importance: {str(e)}")
            
            return result
        except Exception as e:
            logger.error(f"Error generating global feature importance: {str(e)}")
            logger.error(traceback.format_exc())
            return None