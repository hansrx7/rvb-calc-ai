// src/lib/location/zipCodeService.ts

import zipCodeData from '../../data/zipCodeData.json';

export interface LocationData {
  state: string;
  city: string;
  homeValue: number;
  homeValueGrowthRate: number | null;
  propertyTaxRate?: number;
  rentValue?: number;
  rentValueGrowthRate: number | null;
}

export interface FormattedLocationData {
  city: string;
  state: string;
  medianHomePrice: number;
  averageRent: number | null;
  propertyTaxRate: number;
  homeAppreciationRate: number | null;
  rentGrowthRate: number | null;
}

// Property tax rates by state (approximate averages)
const PROPERTY_TAX_RATES: Record<string, number> = {
  'AL': 0.4, 'AK': 1.0, 'AZ': 0.6, 'AR': 0.6, 'CA': 0.7, 'CO': 0.5,
  'CT': 1.7, 'DE': 0.5, 'FL': 0.9, 'GA': 0.9, 'HI': 0.3, 'ID': 0.7,
  'IL': 1.7, 'IN': 0.8, 'IA': 1.3, 'KS': 1.3, 'KY': 0.8, 'LA': 0.5,
  'ME': 1.1, 'MD': 1.0, 'MA': 1.1, 'MI': 1.4, 'MN': 1.1, 'MS': 0.6,
  'MO': 0.9, 'MT': 0.8, 'NE': 1.6, 'NV': 0.6, 'NH': 1.9, 'NJ': 2.0,
  'NM': 0.6, 'NY': 1.2, 'NC': 0.8, 'ND': 0.9, 'OH': 1.4, 'OK': 0.8,
  'OR': 0.9, 'PA': 1.4, 'RI': 1.4, 'SC': 0.5, 'SD': 1.2, 'TN': 0.7,
  'TX': 1.6, 'UT': 0.6, 'VT': 1.8, 'VA': 0.8, 'WA': 0.9, 'WV': 0.5,
  'WI': 1.7, 'WY': 0.6, 'DC': 0.5
};

export const getLocationData = (zipCode: string): LocationData | null => {
  return (zipCodeData as Record<string, LocationData>)[zipCode] || null;
};

export const formatLocationData = (data: LocationData): FormattedLocationData => {
  // Get property tax rate from data or fallback to state average
  const stateTaxRatePercent = PROPERTY_TAX_RATES[data.state];
  const fallbackTaxRate = ((stateTaxRatePercent !== undefined ? stateTaxRatePercent : 1.0)) / 100;
  const propertyTaxRate = data.propertyTaxRate !== undefined ? data.propertyTaxRate : fallbackTaxRate;
  
  return {
    city: data.city,
    state: data.state,
    medianHomePrice: data.homeValue,
    averageRent: data.rentValue ?? null,
    propertyTaxRate: propertyTaxRate,
    homeAppreciationRate: data.homeValueGrowthRate,
    rentGrowthRate: data.rentValueGrowthRate
  };
};

export const detectZipCode = (message: string): string | null => {
  // Match 5-digit ZIP codes
  const zipMatch = message.match(/\b\d{5}\b/);
  return zipMatch ? zipMatch[0] : null;
};

// Common city name patterns (major cities that users might mention)
const CITY_PATTERNS = [
  /(?:i\s+(?:want|wanna|want to|plan to|am|will)\s+(?:live|move|buy|rent)\s+in|in|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /\b(?:LA|NYC|SF|SD|Miami|Chicago|Boston|Seattle|Portland|Denver|Austin|Dallas|Houston|Phoenix|Atlanta|Detroit|Philadelphia|San\s+Francisco|Los\s+Angeles|New\s+York|San\s+Diego|Las\s+Vegas)\b/gi
];

export const detectCityMention = (message: string): { city?: string; state?: string } | null => {
  const lowerMessage = message.toLowerCase();
  
  // Check for common city abbreviations
  const cityAbbreviations: Record<string, string> = {
    'la': 'Los Angeles',
    'nyc': 'New York',
    'sf': 'San Francisco',
    'sd': 'San Diego',
    'miami': 'Miami',
    'chicago': 'Chicago',
    'boston': 'Boston',
    'seattle': 'Seattle',
    'portland': 'Portland',
    'denver': 'Denver',
    'austin': 'Austin',
    'dallas': 'Dallas',
    'houston': 'Houston',
    'phoenix': 'Phoenix',
    'atlanta': 'Atlanta',
    'detroit': 'Detroit',
    'philadelphia': 'Philadelphia',
    'las vegas': 'Las Vegas'
  };
  
  // Check for abbreviations first
  for (const [abbr, city] of Object.entries(cityAbbreviations)) {
    if (lowerMessage.includes(abbr) && (lowerMessage.includes('live') || lowerMessage.includes('move') || lowerMessage.includes('buy') || lowerMessage.includes('rent') || lowerMessage.includes('in'))) {
      return { city };
    }
  }
  
  // Check for full city names
  const cityNames = Object.values(cityAbbreviations);
  for (const city of cityNames) {
    if (lowerMessage.includes(city.toLowerCase()) && (lowerMessage.includes('live') || lowerMessage.includes('move') || lowerMessage.includes('buy') || lowerMessage.includes('rent') || lowerMessage.includes('in'))) {
      return { city };
    }
  }
  
  // Try to extract city from patterns like "I wanna live in [City]" or "in [City]"
  for (const pattern of CITY_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const potentialCity = match[1].trim();
      // Only return if it looks like a city name (capitalized, not a number)
      if (potentialCity && /^[A-Z]/.test(potentialCity) && !/\d/.test(potentialCity)) {
        return { city: potentialCity };
      }
    }
  }
  
  return null;
};
