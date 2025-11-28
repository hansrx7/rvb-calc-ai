"""
Quick test script to verify ML growth model integration.
"""

import requests
import json

# Test endpoint
url = "http://localhost:8000/api/finance/analyze"

# Test with a ZIP code that exists in training data
test_request = {
    "inputs": {
        "homePrice": 500000,
        "downPaymentPercent": 20,
        "interestRate": 7.0,
        "loanTermYears": 30,
        "timeHorizonYears": 10,
        "monthlyRent": 3000,
        "propertyTaxRate": 1.0,
        "homeInsuranceAnnual": 2000,
        "hoaMonthly": 0,
        "maintenanceRate": 1.0,
        "renterInsuranceAnnual": 300,
        "homeAppreciationRate": 3.0,  # This should be overridden by ML
        "rentGrowthRate": 3.5,  # This should be overridden by ML
        "investmentReturnRate": 7.0
    },
    "zipCode": "32771"  # ZIP from training data
}

print("🧪 Testing ML integration...")
print(f"📤 Sending request with ZIP code: {test_request['zipCode']}")
print(f"   Original home rate: {test_request['inputs']['homeAppreciationRate']}%")
print(f"   Original rent rate: {test_request['inputs']['rentGrowthRate']}%")
print()

try:
    response = requests.post(url, json=test_request, timeout=10)
    
    if response.status_code == 200:
        print("✅ Request successful!")
        print()
        print("📊 Response summary:")
        data = response.json()
        analysis = data.get('analysis', {})
        timeline = analysis.get('timeline', [])
        if timeline:
            print(f"   Timeline points: {len(timeline)}")
            print(f"   Break-even month: {analysis.get('breakEven', {}).get('monthIndex', 'N/A')}")
        print()
        print("👀 Check your backend terminal for [ML DEBUG] output!")
        print("   You should see something like:")
        print("   [ML DEBUG] ZIP=32771 fallback_home=3.000%, fallback_rent=3.500% -> ml_home=X.XXX%, ml_rent=X.XXX%")
    else:
        print(f"❌ Request failed with status {response.status_code}")
        print(f"   Response: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("❌ Could not connect to backend. Is it running on http://localhost:8000?")
except Exception as e:
    print(f"❌ Error: {e}")

