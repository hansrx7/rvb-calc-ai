"""
ZIP code similarity engine using feature embeddings.

This module provides functions to find similar ZIP codes based on their
numeric feature embeddings (growth rates, volatility, price-to-rent ratio, etc.).
"""

import json
import numpy as np
from pathlib import Path
from typing import List, Tuple, Optional

# Paths
BASE_DIR = Path(__file__).parent.parent.parent.parent  # Go up to repo root
DATA_DIR = BASE_DIR / 'src' / 'data'
FEATURE_MATRIX_PATH = DATA_DIR / 'zip_feature_matrix.npy'
ZIP_META_PATH = DATA_DIR / 'zip_feature_meta.json'

# Module-level cache variables
_ZIP_FEATURES: Optional[np.ndarray] = None
_ZIP_CODES: Optional[List[str]] = None
_ZIP_FEATURES_MEAN: Optional[np.ndarray] = None
_ZIP_FEATURES_STD: Optional[np.ndarray] = None
_EPSILON = 1e-8  # Small value to avoid division by zero


def load_zip_embedding_data() -> Tuple[np.ndarray, List[str]]:
    """
    Load ZIP code feature embeddings and metadata.
    
    Returns:
        Tuple of (feature_matrix, zip_codes_list):
        - feature_matrix: numpy array of shape (n_zips, n_features)
        - zip_codes_list: list of ZIP code strings in the same row order as feature_matrix
    
    The function caches the data in module-level variables on first call.
    Also computes and caches mean and std for standardization.
    """
    global _ZIP_FEATURES, _ZIP_CODES, _ZIP_FEATURES_MEAN, _ZIP_FEATURES_STD
    
    # Return cached data if already loaded
    if _ZIP_FEATURES is not None and _ZIP_CODES is not None:
        return _ZIP_FEATURES, _ZIP_CODES
    
    # Load feature matrix
    if not FEATURE_MATRIX_PATH.exists():
        raise FileNotFoundError(
            f"Feature matrix not found at {FEATURE_MATRIX_PATH}. "
            "Run scripts/ml_build_zip_embeddings.py first."
        )
    
    _ZIP_FEATURES = np.load(FEATURE_MATRIX_PATH)
    
    # Load ZIP code metadata
    if not ZIP_META_PATH.exists():
        raise FileNotFoundError(
            f"ZIP metadata not found at {ZIP_META_PATH}. "
            "Run scripts/ml_build_zip_embeddings.py first."
        )
    
    with open(ZIP_META_PATH, 'r') as f:
        metadata = json.load(f)
    
    _ZIP_CODES = [entry['zip'] for entry in metadata]
    
    # Validate that dimensions match
    if len(_ZIP_CODES) != _ZIP_FEATURES.shape[0]:
        raise ValueError(
            f"Mismatch: {len(_ZIP_CODES)} ZIP codes but {_ZIP_FEATURES.shape[0]} rows in feature matrix"
        )
    
    # Compute mean and std for standardization
    _ZIP_FEATURES_MEAN = np.mean(_ZIP_FEATURES, axis=0)
    _ZIP_FEATURES_STD = np.std(_ZIP_FEATURES, axis=0)
    # Add epsilon to avoid division by zero
    _ZIP_FEATURES_STD = np.where(_ZIP_FEATURES_STD < _EPSILON, _EPSILON, _ZIP_FEATURES_STD)
    
    return _ZIP_FEATURES, _ZIP_CODES


def get_zip_index(zip_code: str) -> int:
    """
    Get the row index of a ZIP code in the feature matrix.
    
    Args:
        zip_code: ZIP code string (will be normalized)
    
    Returns:
        int: Row index if found, -1 if not found
    """
    # Normalize ZIP code
    zip_code_str = str(zip_code).strip()
    
    # Ensure data is loaded
    _, zip_codes = load_zip_embedding_data()
    
    # Find index
    try:
        index = zip_codes.index(zip_code_str)
        return index
    except ValueError:
        return -1


def find_similar_zips(zip_code: str, k: int = 10) -> List[Tuple[str, float]]:
    """
    Find the k most similar ZIP codes to the given ZIP code.
    
    Similarity is computed using Euclidean distance in standardized feature space.
    
    Args:
        zip_code: ZIP code string (will be normalized)
        k: Number of similar ZIPs to return (default: 10)
    
    Returns:
        List of tuples (neighbor_zip, distance) sorted by increasing distance.
        Returns empty list if the input ZIP is not found.
    """
    # Normalize ZIP code
    zip_code_str = str(zip_code).strip()
    
    # Load data
    X, zip_codes = load_zip_embedding_data()
    
    # Get index of input ZIP
    zip_index = get_zip_index(zip_code_str)
    if zip_index == -1:
        return []
    
    # Standardize the feature matrix
    X_std = (X - _ZIP_FEATURES_MEAN) / _ZIP_FEATURES_STD
    
    # Get the feature vector for the input ZIP
    query_vector = X_std[zip_index]
    
    # Compute Euclidean distances to all other ZIPs
    # Exclude the ZIP itself from candidates
    distances = []
    for i, neighbor_zip in enumerate(zip_codes):
        if i == zip_index:
            continue  # Skip the ZIP itself
        
        neighbor_vector = X_std[i]
        # Euclidean distance
        distance = np.linalg.norm(query_vector - neighbor_vector)
        distances.append((neighbor_zip, float(distance)))
    
    # Sort by distance and return top k
    distances.sort(key=lambda x: x[1])
    return distances[:k]


# Debug mode when run as a script
if __name__ == "__main__":
    print("=" * 60)
    print("ZIP Similarity Engine - Debug Mode")
    print("=" * 60)
    
    try:
        # Load embeddings
        print("\n📂 Loading ZIP embeddings...")
        X, zip_codes = load_zip_embedding_data()
        print(f"   Loaded {len(zip_codes)} ZIP codes")
        print(f"   Feature matrix shape: {X.shape}")
        
        # Pick the first ZIP code
        test_zip = zip_codes[0]
        print(f"\n🔍 Testing with ZIP code: {test_zip}")
        
        # Find top 5 similar ZIPs
        print(f"\n🔎 Finding top 5 most similar ZIPs...")
        similar_zips = find_similar_zips(test_zip, k=5)
        
        if similar_zips:
            print(f"\n✅ Top 5 similar ZIPs to {test_zip}:")
            for i, (neighbor_zip, distance) in enumerate(similar_zips, 1):
                print(f"   {i}. {neighbor_zip} (distance: {distance:.6f})")
        else:
            print(f"\n❌ No similar ZIPs found (ZIP {test_zip} not in dataset?)")
        
        print("\n" + "=" * 60)
        print("✅ Debug mode complete")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()



