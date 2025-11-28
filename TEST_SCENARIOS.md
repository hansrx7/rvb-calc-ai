# 🧪 ML Integration Test Scenarios

## 🚀 Access Your App

**Frontend:** http://localhost:5173  
**Backend:** http://localhost:8000

---

## 📋 Test Scenarios

### Scenario 1: Orlando, FL (ZIP 32801) - Declining Market
**What to enter:**
```
I'm in 32801, looking at a $500k home, paying $3k rent, 20% down, staying 10 years
```

**What you SHOULD expect:**
- **Backend terminal shows:** `[ML DEBUG] ZIP=32801 fallback_home=3.000%, fallback_rent=3.500% -> ml_home=-0.702%, ml_rent=1.757%`
- **Charts will show:**
  - Home value **declining slightly** over time (negative appreciation)
  - Rent growing **slowly** (1.76% vs 3.5% generic)
  - **Renting might be better** financially (break-even later or never)
  - Net worth comparison favors renting

**Why:** ML model learned this ZIP has declining home values and slow rent growth.

---

### Scenario 2: San Francisco Area (ZIP 94102) - High Growth Market
**What to enter:**
```
I'm in 94102, $1.2M home, $5k rent, 15% down, 10 years
```

**What you SHOULD expect:**
- **Backend terminal shows:** ML predictions (may vary, but likely positive growth)
- **Charts will show:**
  - Home value **appreciating** (likely higher than generic 3%)
  - Rent growing (location-specific rate)
  - **Buying might be better** if appreciation is strong
  - Break-even point earlier than generic rates

**Why:** High-value markets often have different growth patterns.

---

### Scenario 3: No ZIP Code (Generic Rates)
**What to enter:**
```
I want to buy a $500k home, rent is $3k, 20% down, 10 years
```
*(Don't mention a ZIP code)*

**What you SHOULD expect:**
- **Backend terminal shows:** NO `[ML DEBUG]` line (no ZIP code sent)
- **Charts will show:**
  - Generic growth rates (3% home, 3.5% rent)
  - Standard break-even timeline
  - Typical rent vs buy comparison

**Why:** Without ZIP code, system uses fallback rates.

---

### Scenario 4: Test Different ZIP Codes
**Try these ZIPs and compare:**

1. **32810** (Orlando area)
   - Enter: `I'm in 32810, $400k home, $2.5k rent, 20% down, 7 years`
   - Expected: Different ML predictions than 32801

2. **32771** (Florida)
   - Enter: `I'm in 32771, $350k home, $2k rent, 15% down, 5 years`
   - Expected: Very low home growth (~0.08%), moderate rent growth (~1.95%)

---

## 🔍 How to Verify ML is Working

### 1. Check Backend Terminal
Look for lines like:
```
[ML DEBUG] ZIP=32801 fallback_home=3.000%, fallback_rent=3.500% -> ml_home=-0.702%, ml_rent=1.757%
```

### 2. Compare Charts
- **With ZIP code:** Charts reflect location-specific predictions
- **Without ZIP code:** Charts use generic 3%/3.5% rates

### 3. Test Same Scenario, Different ZIPs
- Enter same home price/rent/down payment
- Change only the ZIP code
- Charts should show **different results** (different growth rates)

---

## 📊 What to Look For in Charts

### Net Worth Comparison
- **With ML:** Shows realistic location-specific wealth building
- **Without ML:** Shows generic growth patterns

### Break-Even Timeline
- **With ML:** Break-even point reflects local market conditions
- **Declining markets:** Break-even later or never
- **Growing markets:** Break-even earlier

### Monthly Cost Breakdown
- **With ML:** Rent growth matches local market trends
- **Without ML:** Generic 3.5% rent growth

---

## ⚠️ Troubleshooting

**If you don't see `[ML DEBUG]` lines:**
1. Check backend is running: `curl http://localhost:8000/health`
2. Make sure you're entering a ZIP code in your message
3. Check backend terminal for errors

**If charts look the same for different ZIPs:**
1. Check backend terminal for ML predictions
2. Verify ZIP code is being sent (check network tab in browser dev tools)
3. Try a ZIP code that exists in training data (like 32801, 32810, 32771)

---

## 🎯 Quick Test Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Enter a ZIP code in your first message
- [ ] See `[ML DEBUG]` line in backend terminal
- [ ] Charts show different results than generic rates
- [ ] Different ZIP codes produce different chart results

---

**Ready to test!** Open http://localhost:5173 and start chatting! 🚀

