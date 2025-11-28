"""
Monte Carlo simulation module for home price forecasting.

This module provides functions to simulate future home prices using
geometric Brownian motion and summarize the results with percentile bands.
"""

from typing import List
import numpy as np


def simulate_home_price_paths(
    initial_price: float,
    annual_mu: float,
    annual_sigma: float,
    years: int,
    n_paths: int = 500,
) -> List[List[float]]:
    """
    Simulate multiple price paths using geometric Brownian motion.
    
    Args:
        initial_price: Starting home price (e.g., 500000)
        annual_mu: Annual expected return (drift) in decimal form (e.g., 0.04 for 4%)
        annual_sigma: Annual volatility (standard deviation) in decimal form (e.g., 0.15 for 15%)
        years: Number of years to simulate
        n_paths: Number of independent price paths to generate (default: 500)
    
    Returns:
        A list of price paths. Each inner list has length (years + 1), 
        starting at initial_price. The first element is always initial_price.
        
    Example:
        paths = simulate_home_price_paths(
            initial_price=500000,
            annual_mu=0.04,
            annual_sigma=0.15,
            years=10,
            n_paths=500
        )
        # paths[0] is the first path: [500000, 520000, ..., final_price]
    """
    if initial_price <= 0:
        raise ValueError("initial_price must be positive")
    if years < 0:
        raise ValueError("years must be non-negative")
    if n_paths < 1:
        raise ValueError("n_paths must be at least 1")
    
    # Time step is 1 year
    dt = 1.0
    
    # Pre-allocate array for efficiency: shape (n_paths, years + 1)
    paths = np.zeros((n_paths, years + 1))
    
    # All paths start at initial_price
    paths[:, 0] = initial_price
    
    # Generate random shocks for all paths and all years at once
    # Z ~ N(0, 1) for each path and each time step
    random_shocks = np.random.normal(0, 1, size=(n_paths, years))
    
    # Geometric Brownian motion: price_{t+1} = price_t * exp((mu - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z)
    # For dt = 1: price_{t+1} = price_t * exp((mu - 0.5*sigma^2) + sigma*Z)
    drift_term = (annual_mu - 0.5 * annual_sigma ** 2) * dt
    diffusion_term = annual_sigma * np.sqrt(dt)
    
    # Simulate each year
    for t in range(years):
        # Compute the exponential factor for all paths at once
        exponential_factor = np.exp(drift_term + diffusion_term * random_shocks[:, t])
        
        # Update prices: price_{t+1} = price_t * exponential_factor
        paths[:, t + 1] = paths[:, t] * exponential_factor
    
    # Ensure all prices are positive (they should be, but safety check)
    paths = np.maximum(paths, 1e-6)  # Minimum price of $0.000001 to avoid numerical issues
    
    # Convert to list of lists for return type
    return paths.tolist()


def summarize_paths(paths: List[List[float]]) -> dict:
    """
    Compute percentile bands for each year across all price paths.
    
    Args:
        paths: A list of price paths. Each inner list represents one path
               and has length (years + 1), where paths[i][0] is the initial price
               and paths[i][j] is the price at year j.
    
    Returns:
        A dictionary with the following keys:
        - "years": List of year indices [0, 1, 2, ..., years]
        - "p10": List of 10th percentile prices for each year
        - "p50": List of 50th percentile (median) prices for each year
        - "p90": List of 90th percentile prices for each year
        
    Example:
        paths = [[500000, 520000, ...], [500000, 510000, ...], ...]
        summary = summarize_paths(paths)
        # summary = {
        #     "years": [0, 1, 2, ...],
        #     "p10": [500000, 490000, ...],
        #     "p50": [500000, 520000, ...],
        #     "p90": [500000, 550000, ...]
        # }
    """
    if not paths:
        return {
            "years": [],
            "p10": [],
            "p50": [],
            "p90": []
        }
    
    # Convert to numpy array for efficient computation
    # Shape: (n_paths, n_years)
    paths_array = np.array(paths)
    
    n_years = paths_array.shape[1]
    
    # Compute percentiles along axis=0 (across paths, for each year)
    p10 = np.percentile(paths_array, 10, axis=0).tolist()
    p50 = np.percentile(paths_array, 50, axis=0).tolist()
    p90 = np.percentile(paths_array, 90, axis=0).tolist()
    
    # Year indices
    years = list(range(n_years))
    
    return {
        "years": years,
        "p10": p10,
        "p50": p50,
        "p90": p90
    }

