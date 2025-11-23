"""
Script to train ML models for ZIP code home and rent growth prediction.

Trains GradientBoostingRegressor models and compares against baseline models.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib

# File paths
DATA_DIR = Path(__file__).parent.parent / 'src' / 'data'
TRAINING_DATA_PATH = DATA_DIR / 'zip_growth_training.csv'
MODEL_DIR = Path(__file__).parent.parent / 'backend' / 'app' / 'ml' / 'models'
HOME_MODEL_PATH = MODEL_DIR / 'zip_home_growth_model.joblib'
RENT_MODEL_PATH = MODEL_DIR / 'zip_rent_growth_model.joblib'

print('🚀 Starting ML model training...\n')

# Load training data
print('📂 Loading training data...')
df = pd.read_csv(TRAINING_DATA_PATH)
print(f'   Loaded {len(df)} rows\n')

# Prepare features and targets
feature_cols = [col for col in df.columns if col not in 
                ['zip', 'state', 'city', 'y_home_growth_next', 'y_rent_growth_next']]

X = df[feature_cols].copy()
y_home = df['y_home_growth_next'].copy()
y_rent = df['y_rent_growth_next'].copy()

# Handle missing values (fill with median for numeric columns)
print('🔧 Handling missing values...')
for col in X.columns:
    if X[col].isna().any():
        median_val = X[col].median()
        X[col].fillna(median_val, inplace=True)
        print(f'   Filled {X[col].isna().sum()} missing values in {col} with median: {median_val:.4f}')

# Remove rows where targets are missing
valid_mask = y_home.notna() & y_rent.notna()
X = X[valid_mask].copy()
y_home = y_home[valid_mask].copy()
y_rent = y_rent[valid_mask].copy()

print(f'   Using {len(X)} rows with valid targets\n')

# Split into train and test sets (80/20)
print('📊 Splitting data into train/test sets (80/20)...')
X_train, X_test, y_home_train, y_home_test, y_rent_train, y_rent_test = train_test_split(
    X, y_home, y_rent, test_size=0.2, random_state=42
)
print(f'   Train set: {len(X_train)} rows')
print(f'   Test set: {len(X_test)} rows\n')

# ============================================================================
# HOME GROWTH MODEL
# ============================================================================
print('=' * 70)
print('🏠 HOME GROWTH MODEL')
print('=' * 70)

# Baseline: always predict home_growth_5y_avg
print('\n📊 Baseline Model (always predicts home_growth_5y_avg):')
baseline_home_pred = X_test['home_growth_5y_avg'].values
baseline_home_mae = mean_absolute_error(y_home_test, baseline_home_pred)
baseline_home_rmse = np.sqrt(mean_squared_error(y_home_test, baseline_home_pred))

print(f'   MAE:  {baseline_home_mae:.6f}')
print(f'   RMSE: {baseline_home_rmse:.6f}')

# ML Model: GradientBoostingRegressor
print('\n🤖 Training GradientBoostingRegressor...')
home_model = GradientBoostingRegressor(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=5,
    random_state=42,
    verbose=0
)

home_model.fit(X_train, y_home_train)

# Predictions
home_pred = home_model.predict(X_test)
home_mae = mean_absolute_error(y_home_test, home_pred)
home_rmse = np.sqrt(mean_squared_error(y_home_test, home_pred))

print(f'   MAE:  {home_mae:.6f}')
print(f'   RMSE: {home_rmse:.6f}')

# Improvement
mae_improvement = ((baseline_home_mae - home_mae) / baseline_home_mae) * 100
rmse_improvement = ((baseline_home_rmse - home_rmse) / baseline_home_rmse) * 100

print(f'\n📈 Improvement over baseline:')
print(f'   MAE:  {mae_improvement:+.2f}%')
print(f'   RMSE: {rmse_improvement:+.2f}%')

# Save model
print(f'\n💾 Saving model to {HOME_MODEL_PATH}...')
joblib.dump(home_model, HOME_MODEL_PATH)
print('   ✅ Model saved!')

# ============================================================================
# RENT GROWTH MODEL
# ============================================================================
print('\n' + '=' * 70)
print('🏘️  RENT GROWTH MODEL')
print('=' * 70)

# Baseline: always predict rent_growth_5y_avg
print('\n📊 Baseline Model (always predicts rent_growth_5y_avg):')
baseline_rent_pred = X_test['rent_growth_5y_avg'].values
baseline_rent_mae = mean_absolute_error(y_rent_test, baseline_rent_pred)
baseline_rent_rmse = np.sqrt(mean_squared_error(y_rent_test, baseline_rent_pred))

print(f'   MAE:  {baseline_rent_mae:.6f}')
print(f'   RMSE: {baseline_rent_rmse:.6f}')

# ML Model: GradientBoostingRegressor
print('\n🤖 Training GradientBoostingRegressor...')
rent_model = GradientBoostingRegressor(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=5,
    random_state=42,
    verbose=0
)

rent_model.fit(X_train, y_rent_train)

# Predictions
rent_pred = rent_model.predict(X_test)
rent_mae = mean_absolute_error(y_rent_test, rent_pred)
rent_rmse = np.sqrt(mean_squared_error(y_rent_test, rent_pred))

print(f'   MAE:  {rent_mae:.6f}')
print(f'   RMSE: {rent_rmse:.6f}')

# Improvement
mae_improvement = ((baseline_rent_mae - rent_mae) / baseline_rent_mae) * 100
rmse_improvement = ((baseline_rent_rmse - rent_rmse) / baseline_rent_rmse) * 100

print(f'\n📈 Improvement over baseline:')
print(f'   MAE:  {mae_improvement:+.2f}%')
print(f'   RMSE: {rmse_improvement:+.2f}%')

# Save model
print(f'\n💾 Saving model to {RENT_MODEL_PATH}...')
joblib.dump(rent_model, RENT_MODEL_PATH)
print('   ✅ Model saved!')

# ============================================================================
# SUMMARY
# ============================================================================
print('\n' + '=' * 70)
print('📊 SUMMARY')
print('=' * 70)
print(f'\n🏠 Home Growth Model:')
print(f'   Baseline MAE:  {baseline_home_mae:.6f}  |  ML Model MAE:  {home_mae:.6f}')
print(f'   Baseline RMSE: {baseline_home_rmse:.6f}  |  ML Model RMSE: {home_rmse:.6f}')

print(f'\n🏘️  Rent Growth Model:')
print(f'   Baseline MAE:  {baseline_rent_mae:.6f}  |  ML Model MAE:  {rent_mae:.6f}')
print(f'   Baseline RMSE: {baseline_rent_rmse:.6f}  |  ML Model RMSE: {rent_rmse:.6f}')

print(f'\n✅ Training complete! Models saved to:')
print(f'   {HOME_MODEL_PATH}')
print(f'   {RENT_MODEL_PATH}')

