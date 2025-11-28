"""
Script to build ZIP code growth training dataset for ML models.

Reads Zillow ZHVI and ZORI CSV files, converts monthly data to annual,
computes returns, and creates features/targets for growth prediction.
"""

import pandas as pd
import numpy as np
from pathlib import Path

# File paths
DATA_DIR = Path(__file__).parent.parent / 'src' / 'data'
ZHVI_PATH = DATA_DIR / 'Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv'
ZORI_PATH = DATA_DIR / 'Zip_zori_uc_sfrcondomfr_sm_month.csv'
OUTPUT_PATH = DATA_DIR / 'zip_growth_training.csv'

print('🚀 Starting ZIP growth training dataset build...\n')

# Read CSV files
print('📂 Reading ZHVI (home prices) file...')
zhvi_df = pd.read_csv(ZHVI_PATH)
print(f'   Loaded {len(zhvi_df)} rows')

print('📂 Reading ZORI (rents) file...')
zori_df = pd.read_csv(ZORI_PATH)
print(f'   Loaded {len(zori_df)} rows\n')

# Find date columns (YYYY-MM-DD format)
def get_date_columns(df):
    """Extract date columns from dataframe."""
    date_cols = [col for col in df.columns if pd.to_datetime(col, errors='coerce', format='%Y-%m-%d') is not pd.NaT]
    return sorted(date_cols)

zhvi_dates = get_date_columns(zhvi_df)
zori_dates = get_date_columns(zori_df)

print(f'   Found {len(zhvi_dates)} date columns in ZHVI')
print(f'   Found {len(zori_dates)} date columns in ZORI')

# Convert monthly values to annual (use January of each year)
def monthly_to_annual(df, date_cols, value_name):
    """Convert monthly data to annual by using January values."""
    annual_data = {}
    
    # Group dates by year and find January
    years = {}
    for date_col in date_cols:
        try:
            date = pd.to_datetime(date_col, format='%Y-%m-%d')
            year = date.year
            month = date.month
            
            if year not in years or month == 1:  # Prefer January, or first available
                if year not in years or (years[year][1] != 1 and month == 1):
                    years[year] = (date_col, month)
        except:
            continue
    
    # Extract January values for each year
    for zip_code in df['RegionName'].unique():
        zip_data = df[df['RegionName'] == zip_code].iloc[0]
        annual_data[zip_code] = {}
        
        for year in sorted(years.keys()):
            date_col = years[year][0]
            value = zip_data[date_col]
            if pd.notna(value) and value > 0:
                annual_data[zip_code][year] = value
    
    return annual_data

print('\n📊 Converting monthly data to annual (using January values)...')
zhvi_annual = monthly_to_annual(zhvi_df, zhvi_dates, 'home_value')
zori_annual = monthly_to_annual(zori_df, zori_dates, 'rent_value')

# Compute annual returns
def compute_annual_returns(annual_data):
    """Compute annual returns from year-over-year changes."""
    returns = {}
    
    for zip_code, year_values in annual_data.items():
        returns[zip_code] = {}
        sorted_years = sorted(year_values.keys())
        
        for i in range(1, len(sorted_years)):
            year = sorted_years[i]
            prev_year = sorted_years[i - 1]
            
            current_val = year_values[year]
            prev_val = year_values[prev_year]
            
            if pd.notna(current_val) and pd.notna(prev_val) and prev_val > 0:
                ret = (current_val - prev_val) / prev_val
                returns[zip_code][year] = ret
    
    return returns

print('📈 Computing annual returns...')
zhvi_returns = compute_annual_returns(zhvi_annual)
zori_returns = compute_annual_returns(zori_annual)

# Find common ZIPs and years
all_zips = set(zhvi_returns.keys()) & set(zori_returns.keys())
print(f'\n   Found {len(all_zips)} ZIPs with both home and rent data')

# Build training dataset
print('\n🔨 Building training dataset...')
training_rows = []

for zip_code in all_zips:
    home_ret = zhvi_returns[zip_code]
    rent_ret = zori_returns[zip_code]
    
    # Find common years where both returns exist
    common_years = sorted(set(home_ret.keys()) & set(rent_ret.keys()))
    
    if len(common_years) < 6:
        continue  # Need at least 6 years
    
    # Use latest 6 years
    latest_6_years = common_years[-6:]
    
    # Features: oldest 5 years
    feature_years = latest_6_years[:5]
    # Target: last year (6th year)
    target_year = latest_6_years[5]
    
    # Extract feature returns
    home_returns_5y = [home_ret[y] for y in feature_years if y in home_ret]
    rent_returns_5y = [rent_ret[y] for y in feature_years if y in rent_ret]
    
    # Check if we have all 5 years
    if len(home_returns_5y) != 5 or len(rent_returns_5y) != 5:
        continue
    
    # Check target exists
    if target_year not in home_ret or target_year not in rent_ret:
        continue
    
    # Compute features
    home_returns_5y = np.array(home_returns_5y)
    rent_returns_5y = np.array(rent_returns_5y)
    
    # Home features
    home_growth_1y = home_returns_5y[-1]  # Last year in feature set
    home_growth_3y_avg = np.mean(home_returns_5y[-3:])  # Last 3 years
    home_growth_5y_avg = np.mean(home_returns_5y)  # All 5 years
    home_vol_5y = np.std(home_returns_5y)  # Standard deviation
    
    # Rent features
    rent_growth_1y = rent_returns_5y[-1]
    rent_growth_3y_avg = np.mean(rent_returns_5y[-3:])
    rent_growth_5y_avg = np.mean(rent_returns_5y)
    rent_vol_5y = np.std(rent_returns_5y)
    
    # Targets
    y_home_growth_next = home_ret[target_year]
    y_rent_growth_next = rent_ret[target_year]
    
    # Check for NaN
    if (pd.isna(y_home_growth_next) or pd.isna(y_rent_growth_next) or
        pd.isna(home_growth_1y) or pd.isna(rent_growth_1y)):
        continue
    
    # Get ZIP metadata
    zip_row = zhvi_df[zhvi_df['RegionName'] == zip_code].iloc[0]
    state = zip_row.get('StateName', '')
    city = zip_row.get('City', '')
    
    # Compute price-to-rent ratio (optional)
    try:
        latest_home_year = max(zhvi_annual[zip_code].keys())
        latest_rent_year = max(zori_annual[zip_code].keys())
        
        if latest_home_year == latest_rent_year:
            home_val = zhvi_annual[zip_code][latest_home_year]
            rent_val = zori_annual[zip_code][latest_rent_year]
            if pd.notna(home_val) and pd.notna(rent_val) and rent_val > 0:
                price_to_rent_ratio = home_val / (12 * rent_val)
            else:
                price_to_rent_ratio = np.nan
        else:
            price_to_rent_ratio = np.nan
    except:
        price_to_rent_ratio = np.nan
    
    training_rows.append({
        'zip': zip_code,
        'state': state,
        'city': city,
        'home_growth_1y': home_growth_1y,
        'home_growth_3y_avg': home_growth_3y_avg,
        'home_growth_5y_avg': home_growth_5y_avg,
        'home_vol_5y': home_vol_5y,
        'rent_growth_1y': rent_growth_1y,
        'rent_growth_3y_avg': rent_growth_3y_avg,
        'rent_growth_5y_avg': rent_growth_5y_avg,
        'rent_vol_5y': rent_vol_5y,
        'price_to_rent_ratio': price_to_rent_ratio,
        'y_home_growth_next': y_home_growth_next,
        'y_rent_growth_next': y_rent_growth_next,
    })

# Create dataframe and save
training_df = pd.DataFrame(training_rows)

print(f'\n✅ Created training dataset with {len(training_df)} rows')
print(f'\n📊 Dataset summary:')
print(f'   Columns: {list(training_df.columns)}')
print(f'   Rows: {len(training_df)}')
print(f'   Missing values: {training_df.isna().sum().sum()}')

# Save to CSV
print(f'\n💾 Saving to {OUTPUT_PATH}...')
training_df.to_csv(OUTPUT_PATH, index=False)

print(f'\n✅ SUCCESS! Dataset saved to {OUTPUT_PATH}')
print(f'   Total rows: {len(training_df)}')

