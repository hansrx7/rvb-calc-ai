"""
Build numeric feature embeddings for ZIP codes.

This script loads the training dataset and creates a feature matrix where each row
represents a ZIP code and each column represents a feature. The features include
home/rent growth rates, volatility, price-to-rent ratio, and state encoding.
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path

# File paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'src' / 'data'
TRAINING_DATA_PATH = DATA_DIR / 'zip_growth_training.csv'
OUTPUT_MATRIX_PATH = DATA_DIR / 'zip_feature_matrix.npy'
OUTPUT_META_PATH = DATA_DIR / 'zip_feature_meta.json'
OUTPUT_STATE_ENCODING_PATH = DATA_DIR / 'state_encoding.json'

# Feature columns in the order they should appear in the embedding
FEATURE_COLUMNS = [
    'home_growth_1y',
    'home_growth_3y_avg',
    'home_growth_5y_avg',
    'home_vol_5y',
    'rent_growth_1y',
    'rent_growth_3y_avg',
    'rent_growth_5y_avg',
    'rent_vol_5y',
    'price_to_rent_ratio',
]


def main():
    print("=" * 60)
    print("Building ZIP Code Feature Embeddings")
    print("=" * 60)
    
    # 1. Load training data
    print(f"\n📂 Loading training data from: {TRAINING_DATA_PATH}")
    if not TRAINING_DATA_PATH.exists():
        raise FileNotFoundError(f"Training data not found at {TRAINING_DATA_PATH}")
    
    df = pd.read_csv(TRAINING_DATA_PATH)
    print(f"   Loaded {len(df)} rows, {len(df.columns)} columns")
    
    # 2. Check that required columns exist
    required_cols = FEATURE_COLUMNS + ['zip', 'state']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")
    
    print(f"\n✅ All required columns found")
    
    # 3. Extract ZIP codes and states (for metadata)
    zip_codes = df['zip'].astype(str).tolist()
    states = df['state'].astype(str).tolist()
    
    # 4. Create state encoding mapping
    print(f"\n🗺️  Creating state encoding...")
    unique_states = sorted(df['state'].astype(str).unique())
    state_to_code = {state: idx for idx, state in enumerate(unique_states)}
    print(f"   Found {len(unique_states)} unique states")
    
    # 5. Extract numeric features
    print(f"\n📊 Extracting features...")
    feature_matrix = []
    
    for col in FEATURE_COLUMNS:
        if col not in df.columns:
            raise ValueError(f"Feature column '{col}' not found in dataset")
        
        values = df[col].values
        
        # Impute missing values with median
        if pd.isna(values).any():
            median_val = np.nanmedian(values)
            values = np.where(pd.isna(values), median_val, values)
            print(f"   Imputed {pd.isna(df[col]).sum()} missing values in '{col}' with median={median_val:.6f}")
        
        feature_matrix.append(values)
    
    # Convert to numpy array (each row is a feature, we need to transpose)
    feature_matrix = np.array(feature_matrix).T  # Shape: (n_zips, n_features)
    
    # 6. Add state encoding as the last feature
    print(f"\n🔢 Encoding states...")
    state_codes = np.array([state_to_code[state] for state in states])
    feature_matrix = np.column_stack([feature_matrix, state_codes])
    
    print(f"   Feature matrix shape: {feature_matrix.shape}")
    print(f"   (rows=ZIPs, columns=features + state)")
    
    # 7. Create metadata array
    print(f"\n📝 Creating metadata...")
    metadata = [{"zip": str(zip_code)} for zip_code in zip_codes]
    
    # 8. Save outputs
    print(f"\n💾 Saving outputs...")
    
    # Save feature matrix
    np.save(OUTPUT_MATRIX_PATH, feature_matrix)
    print(f"   ✅ Feature matrix saved to: {OUTPUT_MATRIX_PATH}")
    print(f"      Shape: {feature_matrix.shape}, dtype: {feature_matrix.dtype}")
    
    # Save metadata
    with open(OUTPUT_META_PATH, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"   ✅ Metadata saved to: {OUTPUT_META_PATH}")
    print(f"      {len(metadata)} ZIP entries")
    
    # Save state encoding
    with open(OUTPUT_STATE_ENCODING_PATH, 'w') as f:
        json.dump(state_to_code, f, indent=2)
    print(f"   ✅ State encoding saved to: {OUTPUT_STATE_ENCODING_PATH}")
    print(f"      {len(state_to_code)} states")
    
    # 9. Print summary
    print(f"\n" + "=" * 60)
    print("✅ SUCCESS!")
    print("=" * 60)
    print(f"📊 Summary:")
    print(f"   - ZIPs processed: {len(zip_codes)}")
    print(f"   - Feature matrix shape: {feature_matrix.shape}")
    print(f"   - Features: {len(FEATURE_COLUMNS)} numeric + 1 state encoding = {feature_matrix.shape[1]} total")
    print(f"   - States encoded: {len(state_to_code)}")
    print(f"\n📁 Output files:")
    print(f"   - {OUTPUT_MATRIX_PATH}")
    print(f"   - {OUTPUT_META_PATH}")
    print(f"   - {OUTPUT_STATE_ENCODING_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()


