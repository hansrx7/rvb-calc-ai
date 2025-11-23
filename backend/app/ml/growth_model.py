"""
ML growth prediction model for ZIP codes.

Provides predictions for home appreciation and rent growth rates using
trained GradientBoostingRegressor models.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional, Tuple
import joblib
import logging

logger = logging.getLogger(__name__)

# Paths
# __file__ is backend/app/ml/growth_model.py
# So parent.parent.parent = backend/
# Then we go to backend/app/ml/models and src/data
BASE_DIR = Path(__file__).parent.parent.parent.parent  # Go up to repo root
MODEL_DIR = BASE_DIR / 'backend' / 'app' / 'ml' / 'models'
DATA_DIR = BASE_DIR / 'src' / 'data'

HOME_MODEL_PATH = MODEL_DIR / 'zip_home_growth_model.joblib'
RENT_MODEL_PATH = MODEL_DIR / 'zip_rent_growth_model.joblib'
TRAINING_DATA_PATH = DATA_DIR / 'zip_growth_training.csv'

# Global variables for loaded models and data
_home_model: Optional[object] = None
_rent_model: Optional[object] = None
_features_df: Optional[pd.DataFrame] = None
_feature_columns: Optional[list] = None
_models_loaded: bool = False


def load_models() -> bool:
    """
    Load ML models and training data into memory.
    
    Returns:
        bool: True if models loaded successfully, False otherwise
    """
    global _home_model, _rent_model, _features_df, _feature_columns, _models_loaded
    
    if _models_loaded:
        return True
    
    try:
        # Load models
        logger.info(f"Loading home growth model from {HOME_MODEL_PATH}")
        _home_model = joblib.load(HOME_MODEL_PATH)
        
        logger.info(f"Loading rent growth model from {RENT_MODEL_PATH}")
        _rent_model = joblib.load(RENT_MODEL_PATH)
        
        # Load training data for feature lookup
        logger.info(f"Loading training data from {TRAINING_DATA_PATH}")
        _features_df = pd.read_csv(TRAINING_DATA_PATH)
        
        # Set ZIP as index for fast lookup
        _features_df = _features_df.set_index('zip')
        
        # Define feature columns (same as training script)
        # All columns except zip, state, city, and targets
        exclude_cols = {'zip', 'state', 'city', 'y_home_growth_next', 'y_rent_growth_next'}
        _feature_columns = [col for col in _features_df.columns if col not in exclude_cols]
        
        # Handle missing values in features (fill with median)
        for col in _feature_columns:
            if _features_df[col].isna().any():
                median_val = _features_df[col].median()
                _features_df[col].fillna(median_val, inplace=True)
        
        _models_loaded = True
        logger.info(f"Models loaded successfully. {len(_features_df)} ZIP codes available.")
        return True
        
    except FileNotFoundError as e:
        logger.error(f"Model or data file not found: {e}")
        return False
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        return False


def get_zip_home_volatility(zip_code: str, fallback_sigma: float) -> float:
    """
    Return the 5-year home return volatility (sigma) for a given ZIP code.
    
    Args:
        zip_code: ZIP code string (will be normalized by stripping whitespace)
        fallback_sigma: Fallback volatility value in decimal form (e.g., 0.15 for 15%)
                       to return if ZIP is not found or value is missing
    
    Returns:
        float: The 5-year home return volatility in decimal form (e.g., 0.15 for 15%).
               Returns fallback_sigma if ZIP not found or home_vol_5y is missing/NaN.
    
    Example:
        volatility = get_zip_home_volatility("90210", 0.15)
        # Returns 0.18 if ZIP 90210 has 18% volatility, or 0.15 if not found
    """
    # Ensure models/data are loaded
    if not _models_loaded:
        if not load_models():
            logger.debug("Models/data not loaded, returning fallback volatility")
            return fallback_sigma
    
    try:
        # Normalize ZIP code by stripping whitespace and treating as string
        zip_code_str = str(zip_code).strip()
        
        # Try to look up ZIP in the DataFrame
        # The index might be stored as string or int, so try both
        zip_lookup = zip_code_str
        try:
            zip_code_int = int(zip_code_str)
            # Try int first if conversion succeeds
            if zip_code_int in _features_df.index:
                zip_lookup = zip_code_int
        except ValueError:
            pass  # Keep as string if conversion fails
        
        # Check if ZIP exists in the DataFrame
        if zip_lookup not in _features_df.index:
            logger.debug(f"ZIP code {zip_code} not found in training data")
            return fallback_sigma
        
        # Extract the row for this ZIP (returns a Series when indexed)
        zip_row = _features_df.loc[zip_lookup]
        
        # Check if home_vol_5y column exists in the DataFrame
        if 'home_vol_5y' not in _features_df.columns:
            logger.debug(f"home_vol_5y column not found in training data")
            return fallback_sigma
        
        # Get the volatility value from the Series
        vol_value = zip_row['home_vol_5y']
        
        # Check if value is NaN or missing
        if pd.isna(vol_value):
            logger.debug(f"home_vol_5y is NaN for ZIP {zip_code}")
            return fallback_sigma
        
        # Return as float
        return float(vol_value)
        
    except Exception as e:
        logger.error(f"Error getting volatility for ZIP {zip_code}: {e}")
        return fallback_sigma


def predict_zip_growth(
    zip_code: str,
    fallback_home: float,
    fallback_rent: float
) -> Tuple[float, float]:
    """
    Predict home appreciation and rent growth rates for a given ZIP code.
    
    Args:
        zip_code: ZIP code string (will be normalized)
        fallback_home: Fallback home appreciation rate if prediction fails
        fallback_rent: Fallback rent growth rate if prediction fails
    
    Returns:
        Tuple[float, float]: (home_appreciation_rate, rent_growth_rate)
            Returns fallback values if ZIP not found or any error occurs.
    """
    # Ensure models are loaded
    if not _models_loaded:
        if not load_models():
            logger.warning("Models not loaded, returning fallback values")
            return (fallback_home, fallback_rent)
    
    try:
        # Normalize ZIP code - try both string and int
        zip_code_str = str(zip_code).strip()
        try:
            zip_code_int = int(zip_code_str)
        except ValueError:
            zip_code_int = None
        
        # Look up ZIP in features DataFrame (index is zip as int)
        zip_lookup = zip_code_int if zip_code_int is not None else zip_code_str
        
        if zip_lookup not in _features_df.index:
            logger.debug(f"ZIP code {zip_code} not found in training data")
            return (fallback_home, fallback_rent)
        
        # Extract feature vector for this ZIP
        zip_row = _features_df.loc[zip_lookup]
        feature_df = zip_row[_feature_columns].to_frame().T
        
        # Handle any remaining NaN values (shouldn't happen after fillna, but just in case)
        feature_df = feature_df.fillna(0.0)
        
        # Predict using both models (pass DataFrame to preserve feature names)
        home_growth = float(_home_model.predict(feature_df)[0])
        rent_growth = float(_rent_model.predict(feature_df)[0])
        
        return (home_growth, rent_growth)
        
    except Exception as e:
        logger.error(f"Error predicting growth for ZIP {zip_code}: {e}")
        return (fallback_home, fallback_rent)


# Lazy load models on first import (optional - can be called explicitly)
# Commented out to avoid loading at import time - call load_models() explicitly
# if __name__ != "__main__":
#     load_models()

