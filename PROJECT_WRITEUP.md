# RentVsBuy.ai - Comprehensive Project Documentation

## Executive Summary

RentVsBuy.ai is a full-stack web application that helps users make informed decisions about whether to buy a home or continue renting. The application combines **machine learning predictions**, **financial modeling**, **conversational AI**, and **interactive data visualization** to provide personalized, location-specific housing analysis. Built with React/TypeScript frontend and Python/FastAPI backend, the system processes 26,000+ ZIP codes, uses trained ML models for market predictions, and generates comprehensive financial projections through an intuitive chat interface.

---

## Technical Architecture

### Frontend Stack
- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.7
- **State Management**: React Hooks (useState, useRef, useEffect)
- **Charting Library**: Recharts 3.3.0
- **PDF Generation**: jsPDF 3.0.3 + html2canvas 1.4.1
- **UI/UX Libraries**: react-joyride 2.9.2 (onboarding tours)
- **Styling**: CSS3 with custom animations, gradients, and responsive design
- **API Communication**: Fetch API with custom timeout handling

### Backend Stack
- **Framework**: FastAPI (Python 3.11+)
- **ML Libraries**: scikit-learn, joblib, pandas, numpy
- **Data Processing**: NumPy, Pandas for financial calculations
- **API Integration**: OpenAI GPT-4o-mini for conversational AI
- **CORS**: Configured for cross-origin requests

### Data & ML Infrastructure
- **Training Data**: CSV files with 26,000+ ZIP codes
- **ML Models**: GradientBoostingRegressor (home appreciation & rent growth)
- **Feature Embeddings**: NumPy arrays for ZIP code similarity
- **Model Storage**: Joblib serialized models (.joblib files)
- **Data Preprocessing**: Feature standardization, missing value imputation

---

## User Flows

### Flow 1: ZIP Code Entry (Primary Flow)
1. **User enters ZIP code** (e.g., "92127" or "I'm in 90210")
2. **System detects ZIP** via regex pattern matching
3. **Backend fetches location data**:
   - Median home price for ZIP code
   - Average monthly rent
   - State-specific property tax rate
   - City and state information
4. **Location card appears** with two options:
   - "Use this data" → Populates scenario with local market values
   - "Use my own values" → Allows custom input override
5. **User provides remaining inputs** (down payment %, timeline)
6. **ML predictions applied**:
   - Home appreciation rate (ML-predicted for ZIP)
   - Rent growth rate (ML-predicted for ZIP)
   - ZIP-specific volatility for Monte Carlo
7. **Analysis runs** with location-specific rates
8. **Charts generate** showing personalized projections

### Flow 2: Custom Input Flow
1. **User provides home price and rent** directly (no ZIP)
2. **System uses default/timeline-based rates**:
   - Short-term (≤3 years): Conservative rates (0.5% home, 2% rent)
   - Medium-term (4-7 years): Moderate rates (1.5% home, 3% rent)
   - Long-term (8+ years): Optimistic rates (2.5% home, 3.5% rent)
3. **User provides down payment % and timeline**
4. **Analysis runs** with timeline-adjusted assumptions
5. **Charts generate** with standard assumptions

### Flow 3: Mixed Flow (ZIP + Custom Override)
1. **User enters ZIP code** → Location data fetched
2. **User provides custom home price** (overrides ZIP median)
3. **System uses**:
   - Custom home price (user-provided)
   - ZIP-based rent (from location data)
   - ZIP-based property tax rate
   - ML-predicted appreciation/rent growth for ZIP
4. **Analysis combines** custom inputs with location-specific ML predictions

### Flow 4: Scenario Testing Flow
1. **User completes initial analysis**
2. **User requests new scenario** ("what if I do 30% down?" or "try $600k")
3. **System detects changed values** via state comparison
4. **New analysis runs** with updated inputs
5. **New charts generate** while old charts remain visible
6. **User can compare** multiple scenarios side-by-side

### Flow 5: Chart Request Flow
1. **User asks for specific chart** ("show me net worth" or "break even")
2. **AI extracts chart intent** from natural language
3. **System checks if analysis data exists**:
   - If yes: Renders chart immediately (fast path)
   - If no: Triggers full analysis first, then renders chart
4. **Chart appears** with explanation text

### Flow 6: Edit Mode Flow
1. **User clicks "Edit scenario"** in reference box
2. **Input fields become editable** (home price, rent, down payment, timeline)
3. **User modifies values**
4. **User clicks "Save Changes"**
5. **System recalculates** all charts with new values
6. **Charts update** in real-time

### Flow 7: PDF Export Flow
1. **User clicks "Save Chat"**
2. **System captures**:
   - All conversation messages
   - All visible charts (via html2canvas)
   - Scenario inputs and assumptions
3. **PDF generated** with:
   - Professional header (date, scenario summary)
   - Full conversation transcript
   - Embedded chart images
   - Input parameters section
4. **PDF downloads** automatically

---

## Machine Learning Components

### ML Model Architecture

#### 1. **GradientBoostingRegressor Models**
- **Two separate models**:
  - `zip_home_growth_model.joblib`: Predicts annual home appreciation rate
  - `zip_rent_growth_model.joblib`: Predicts annual rent growth rate
- **Training Features** (from `zip_growth_training.csv`):
  - Historical growth rates (1-year, 3-year, 5-year averages)
  - Volatility metrics (5-year home/rent volatility)
  - Price-to-rent ratio
  - State encoding (categorical → integer)
- **Target Variables**:
  - `y_home_growth_next`: Next period home appreciation rate
  - `y_rent_growth_next`: Next period rent growth rate

#### 2. **ZIP Code Similarity Engine**
- **Purpose**: Fallback prediction for ZIP codes not in training data
- **Method**: Feature embedding + Euclidean distance
- **Process**:
  1. Preprocess training data into numeric feature matrix
  2. Standardize features (mean=0, std=1)
  3. For unknown ZIP: Find k=10 most similar ZIPs using Euclidean distance
  4. Average ML predictions from similar ZIPs
  5. Return averaged rates as prediction
- **Files**:
  - `zip_feature_matrix.npy`: Precomputed feature embeddings
  - `zip_feature_meta.json`: ZIP code metadata mapping
  - `scripts/ml_build_zip_embeddings.py`: Preprocessing script

#### 3. **ML Prediction Pipeline**

**Function: `predict_zip_growth_with_fallback()`**
```python
Input: ZIP code, fallback rates, k (neighbors)
Process:
  1. Check if ZIP exists in training data
  2. If yes: Run direct ML prediction
  3. If no/NaN: Find k similar ZIPs
  4. Get ML predictions from similar ZIPs
  5. Average valid predictions
  6. Return averaged rates or fallback
Output: (home_appreciation_rate, rent_growth_rate)
```

**Function: `get_zip_home_volatility()`**
- Extracts 5-year home return volatility (sigma) for Monte Carlo simulation
- Returns ZIP-specific volatility or fallback value

### ML Integration Points

1. **Backend API Endpoint** (`/api/finance/analyze`):
   - Receives ZIP code in request
   - Calls `predict_zip_growth_with_fallback()`
   - Overrides default rates with ML predictions
   - Returns ML-enhanced analysis

2. **Frontend Display**:
   - Shows "ML-predicted" label when rates come from ML
   - Displays "Beverly Hills market" vs "Austin market" based on source
   - Scenario summary explicitly mentions ML predictions

---

## Financial Calculations

### Core Financial Formulas

#### 1. **Mortgage Amortization**
```python
Monthly Payment = P × [r(1+r)^n] / [(1+r)^n - 1]
Where:
  P = Principal (loan amount)
  r = Monthly interest rate (annual_rate / 12 / 100)
  n = Total number of payments (loan_term_years × 12)
```

**Monthly Breakdown**:
- Interest Paid = Remaining Balance × Monthly Rate
- Principal Paid = Monthly Payment - Interest Paid
- Remaining Balance = Previous Balance - Principal Paid

#### 2. **Net Worth Calculation**

**Buying Scenario**:
```
Net Worth = Home Value + Cash Account - Remaining Mortgage Balance
Where:
  Home Value = Initial Price × (1 + appreciation_rate)^years
  Cash Account = Down Payment × (1 + investment_return)^years
  Remaining Balance = From amortization schedule
```

**Renting Scenario**:
```
Net Worth = Investment Account Balance
Where:
  Investment Account = Down Payment × (1 + investment_return)^years
  Plus: Monthly savings (rent vs. buying costs) invested monthly
```

#### 3. **Monthly Costs**

**Buying Costs**:
- Mortgage Payment (from amortization)
- Property Tax = (Home Price × Tax Rate) / 12
- Home Insurance = Annual Insurance / 12
- Maintenance = (Home Price × Maintenance Rate) / 12
- HOA = Monthly HOA fee
- **Total Monthly = Sum of all above**

**Renting Costs**:
- Monthly Rent = Base Rent × (1 + rent_growth_rate)^year
- Renter Insurance = Annual Insurance / 12
- **Total Monthly = Rent + Insurance**

#### 4. **Total Cost Analysis**

**Buying Total Cost**:
```
Total Spent = Down Payment + Sum(Monthly Costs over timeline) + Selling Costs
Final Value = Home Value at timeline end
Net Cost = Total Spent - Final Value
```

**Renting Total Cost**:
```
Total Spent = Sum(Monthly Rent over timeline)
Final Value = Investment Account Balance
Net Cost = Total Spent - Final Value
```

**Selling Costs** (applied at timeline end):
- Realtor Fees: 6% of home value
- Closing Costs: 2% of home value
- **Total: 8% of final home value**

#### 5. **Equity Buildup**
```
Equity = Home Value - Remaining Mortgage Balance
Equity Growth = Principal Payments + Home Appreciation
```

#### 6. **Break-Even Analysis**
- Calculates net worth difference (Buying - Renting) for each month
- Break-even point = Month where difference crosses from negative to positive
- Visual timeline shows when buying becomes financially advantageous

#### 7. **Cash Flow Analysis**
```
Monthly Cash Flow = Renting Costs - Buying Costs
Positive = Renting costs more (buying saves money)
Negative = Buying costs more (renting saves money)
Cumulative = Running sum of monthly differences
```

#### 8. **Monte Carlo Simulation**
- **Purpose**: Model uncertainty in home price appreciation
- **Method**: Geometric Brownian Motion (GBM)
- **Formula**:
```
dS = μS dt + σS dW
Where:
  S = Home price
  μ = Drift (ML-predicted appreciation rate)
  σ = Volatility (ZIP-specific or fallback)
  dW = Wiener process (random walk)
```
- **Implementation**:
  - Generates 1,000+ simulated price paths
  - Calculates percentiles (p10, p50, p90)
  - Shows range of possible outcomes

#### 9. **Timeline-Based Rate Adjustments**
- **Short-term (≤3 years)**: Conservative assumptions
  - Home appreciation: 0.5% (low due to transaction costs)
  - Rent growth: 2.0%
  - Investment return: 4.0%
- **Medium-term (4-7 years)**: Moderate assumptions
  - Home appreciation: 1.5%
  - Rent growth: 3.0%
  - Investment return: 6.0%
- **Long-term (8+ years)**: Optimistic assumptions
  - Home appreciation: 2.5%
  - Rent growth: 3.5%
  - Investment return: 7.0%

---

## Key Functions & Features

### Frontend Functions

#### `ChatContainer.tsx` - Main Component
- **`handleSendMessage()`**: Processes user input, extracts data via AI, triggers analysis
- **`extractUserDataWithAI()`**: Uses OpenAI to parse natural language into structured data
- **`runAnalysis()`**: Calls backend API, handles loading states, updates charts
- **`renderChart()`**: Dynamically renders chart components based on user request
- **`handleRestart()`**: Resets all state to initial values
- **`handleSaveChat()`**: Generates PDF with conversation and charts
- **`calculateAndShowChart()`**: Performs local calculations for instant chart display

#### Chart Components (14 total)
1. **NetWorthChart**: Line chart comparing buying vs. renting net worth over time
2. **MonthlyCostChart**: Bar chart showing monthly cost breakdown
3. **TotalCostChart**: Comparison of total costs with final values
4. **EquityBuildupChart**: Area chart showing equity growth
5. **RentGrowthChart**: Line chart comparing rent growth vs. fixed mortgage
6. **BreakEvenChart**: Timeline showing break-even point
7. **BreakEvenHeatmap**: 2D heatmap (down payment % × timeline)
8. **CashFlowChart**: Monthly cash flow differences
9. **CumulativeCostChart**: Running total of cost differences
10. **LiquidityTimeline**: Available cash over time
11. **TaxSavingsChart**: Tax deduction benefits
12. **MonteCarloChart**: Simulated home price ranges
13. **SensitivityChart**: Impact of rate changes
14. **ScenarioOverlayChart**: Multiple scenarios compared

### Backend Functions

#### `calculator.py` - Financial Engine
- **`calculate_unified_analysis()`**: Main function generating complete analysis
- **`calculate_net_worth_comparison()`**: Core net worth calculation over timeline
- **`generate_amortization_schedule()`**: Mortgage payment breakdown
- **`calculate_monthly_payment()`**: Standard mortgage formula
- **`calculate_buying_costs()`**: Monthly cost breakdown for buying
- **`calculate_renting_costs()`**: Monthly cost with rent growth
- **`calculate_monte_carlo()`**: Stochastic home price simulation
- **`calculate_sensitivity()`**: Rate sensitivity analysis
- **`calculate_heatmap()`**: Break-even heatmap generation

#### `growth_model.py` - ML Predictions
- **`load_models()`**: Lazy-loads ML models into memory
- **`predict_zip_growth()`**: Direct ML prediction for known ZIPs
- **`predict_zip_growth_with_fallback()`**: Enhanced prediction with similarity fallback
- **`get_zip_home_volatility()`**: Extracts volatility for Monte Carlo

#### `zip_similarity.py` - Similarity Engine
- **`load_zip_embedding_data()`**: Loads feature matrix and metadata
- **`find_similar_zips()`**: K-nearest neighbors using Euclidean distance
- **`get_zip_index()`**: ZIP code lookup in feature matrix

#### `main.py` - API Endpoints
- **`POST /api/finance/analyze`**: Unified analysis endpoint
- **`POST /api/ai/chat`**: OpenAI chat completion
- **`GET /health`**: Health check

---

## Technical Skills Demonstrated

### Frontend Development
- **React/TypeScript**: Component architecture, hooks, type safety
- **State Management**: Complex state orchestration (20+ state variables)
- **API Integration**: Async/await, error handling, timeout management
- **Data Visualization**: Recharts library, custom chart configurations
- **PDF Generation**: Client-side PDF creation with embedded images
- **Responsive Design**: CSS Grid, Flexbox, media queries
- **Animations**: CSS keyframes, transitions, fade effects
- **User Experience**: Loading states, progress indicators, error handling
- **Accessibility**: Keyboard navigation, tour system

### Backend Development
- **FastAPI**: RESTful API design, dependency injection
- **Python**: Object-oriented design, type hints, dataclasses
- **Data Processing**: Pandas DataFrames, NumPy arrays
- **Error Handling**: Try-catch blocks, fallback mechanisms
- **CORS Configuration**: Cross-origin resource sharing
- **Logging**: Structured logging for debugging

### Machine Learning
- **Model Training**: scikit-learn GradientBoostingRegressor
- **Feature Engineering**: Data preprocessing, standardization
- **Model Persistence**: Joblib serialization
- **Similarity Metrics**: Euclidean distance, feature embeddings
- **Fallback Strategies**: K-nearest neighbors for unknown data
- **Data Validation**: Missing value handling, NaN checks

### Financial Modeling
- **Mortgage Calculations**: Amortization schedules, interest calculations
- **Time Value of Money**: Compound interest, present/future value
- **Stochastic Modeling**: Monte Carlo simulation, geometric Brownian motion
- **Sensitivity Analysis**: Rate impact calculations
- **Break-Even Analysis**: Net worth difference calculations

### Data Management
- **CSV Processing**: 26,000+ ZIP code records
- **Feature Extraction**: Multi-dimensional feature vectors
- **Data Caching**: In-memory caching for performance
- **Data Validation**: Type checking, range validation

### DevOps & Tooling
- **Version Control**: Git/GitHub
- **Package Management**: npm, pip, virtual environments
- **Build Tools**: Vite, TypeScript compiler
- **Development Server**: Hot module replacement, auto-reload

---

## Advanced Features

### 1. **Intelligent Data Extraction**
- Natural language processing via OpenAI GPT-4
- Extracts: home price, rent, down payment %, timeline from free-form text
- Handles variations: "$500k", "500k", "500000", "20%", "20 percent"
- Context-aware parsing (understands "10% and 10 years" as two separate values)

### 2. **Progressive Data Collection**
- AI asks 2-3 questions at once for efficiency
- Validates inputs before proceeding
- Handles incomplete data gracefully
- Provides helpful error messages

### 3. **Dynamic Chart System**
- **Basic Charts**: Always visible (Monthly Cost, Net Worth, Equity, Total Cost)
- **Advanced Charts**: Collapsible section (Monte Carlo, Break-Even, Heatmaps, etc.)
- Charts grouped by complexity for better UX
- Chart buttons appear dynamically based on data availability

### 4. **Scenario Comparison**
- Multiple scenarios can be tested in one session
- Previous charts remain visible for comparison
- Each chart stores snapshot data with input values
- Charts don't change when new scenarios are calculated

### 5. **Location Intelligence**
- 26,000+ ZIP codes supported
- Automatic market data lookup
- ML-enhanced predictions for local markets
- Property tax rates by state
- User can override any location-specific value

### 6. **Monte Carlo Simulation**
- Optional advanced analysis (disabled by default for performance)
- 1,000+ simulated price paths
- ZIP-specific volatility integration
- Visual representation of uncertainty (p10, p50, p90 percentiles)
- Dedicated progress bar during simulation

### 7. **Interactive Onboarding**
- react-joyride tour system
- Auto-starts for new users
- Highlights key features with spotlight effect
- Keyboard shortcuts (right arrow to advance)
- Persistent state (won't show again after completion)

### 8. **Professional PDF Export**
- Single PDF with complete analysis
- High-quality chart images
- Full conversation transcript
- Input parameters documentation
- Professional formatting suitable for sharing

### 9. **Real-Time Editing**
- Editable reference box
- Live value updates
- Instant chart recalculation
- Cancel/save functionality

### 10. **Responsive Design**
- Two-column layout (scenario card + chat)
- Mobile-friendly adaptations
- No horizontal scrollbars
- Centered, expandable chat container

---

## Data Flow Architecture

### Request Flow (ZIP Code Example)
```
1. User: "I'm in 92127"
   ↓
2. Frontend: detectZipCode() → extracts "92127"
   ↓
3. Frontend: getLocationData("92127") → API call
   ↓
4. Backend: Location service → returns market data
   ↓
5. Frontend: Shows location card with options
   ↓
6. User: "20% down, 10 years"
   ↓
7. Frontend: extractUserDataWithAI() → parses inputs
   ↓
8. Frontend: runAnalysis() → POST /api/finance/analyze
   ↓
9. Backend: load_models() → loads ML models
   ↓
10. Backend: predict_zip_growth_with_fallback("92127")
    ↓
11. Backend: calculate_unified_analysis() → financial calculations
    ↓
12. Backend: Returns AnalysisResult with timeline points
    ↓
13. Frontend: Updates state, renders charts
    ↓
14. Frontend: Shows scenario summary message
```

### State Management Flow
```
User Input → State Update → Validation → API Call → 
Backend Processing → Response → State Update → 
UI Re-render → Chart Generation → User Feedback
```

---

## Performance Optimizations

1. **Lazy Model Loading**: ML models loaded once, cached in memory
2. **Feature Matrix Caching**: ZIP embeddings loaded once, reused
3. **Conditional Monte Carlo**: Only runs when explicitly requested
4. **Fast Chart Path**: Skips AI API if chart request detected directly
5. **ZIP Code Optimization**: Skips AI extraction for pure ZIP codes
6. **Timeout Management**: 180s for analysis, 60s for AI calls
7. **Progress Indicators**: Visual feedback during long operations
8. **Debounced Updates**: Prevents excessive re-renders

---

## Error Handling & Edge Cases

1. **Missing ZIP Codes**: Falls back to similar ZIPs or default rates
2. **Invalid Inputs**: AI validates and requests clarification
3. **API Timeouts**: Graceful degradation with fallback messages
4. **ML Model Failures**: Falls back to default/timeline-based rates
5. **Missing Chart Data**: Shows placeholder with helpful message
6. **Network Errors**: Retry logic and user-friendly error messages
7. **Browser Compatibility**: Polyfills for older browsers
8. **Large PDFs**: Progress tracking during generation

---

## Security & Best Practices

1. **API Key Protection**: Environment variables, git-ignored
2. **CORS Configuration**: Whitelisted origins only
3. **Input Validation**: Type checking, range validation
4. **Error Logging**: Structured logging without exposing sensitive data
5. **Timeout Limits**: Prevents resource exhaustion
6. **Data Sanitization**: XSS prevention in user inputs

---

## Testing & Quality Assurance

- **Type Safety**: Full TypeScript coverage
- **Linting**: ESLint for code quality
- **Error Boundaries**: Graceful error handling
- **Console Logging**: Debug information for development
- **User Feedback**: Clear error messages and loading states

---

## Deployment Considerations

- **Frontend**: Static build (Vite), deployable to any static host
- **Backend**: FastAPI with uvicorn, requires Python 3.11+
- **ML Models**: Pre-trained models included in repository
- **Data Files**: CSV and NumPy files in `src/data/`
- **Environment Variables**: Required for OpenAI API key
- **CORS**: Must be configured for production domain

---

## Future Enhancements (Roadmap)

1. **Real-time Market Data**: Live API integration for current prices
2. **User Accounts**: Save scenarios, compare over time
3. **Advanced ML**: Deep learning models for better predictions
4. **More Charts**: Additional visualization types
5. **Mobile App**: React Native version
6. **International Support**: Non-US markets

---

## Conclusion

RentVsBuy.ai represents a comprehensive full-stack application combining **machine learning**, **financial modeling**, **conversational AI**, and **data visualization**. The system processes complex financial calculations, applies location-specific ML predictions, and presents results through an intuitive chat interface. With support for 26,000+ ZIP codes, multiple analysis types, and professional export capabilities, the application provides users with data-driven insights to make informed housing decisions.

**Key Technical Achievements**:
- ML model integration with fallback strategies
- Complex financial calculations with timeline support
- Natural language processing for data extraction
- Real-time chart generation and scenario comparison
- Professional PDF export with embedded visualizations
- Responsive, accessible UI with onboarding system

The codebase demonstrates proficiency in React/TypeScript, Python/FastAPI, machine learning, financial mathematics, and modern web development practices.

