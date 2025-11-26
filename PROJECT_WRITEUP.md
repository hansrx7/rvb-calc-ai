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

## User Interface & Experience (UI/UX)

### Overall Structure

The application features a **two-tab interface** with a modern, dark-themed design:

#### **Layout Architecture**
- **Background**: Animated aurora effect with 8 colorful blurbs (purple, blue, yellow, green, pink, violet) that move slowly across the screen
- **Main Container**: Centered, responsive layout with max-width constraints
- **Help Button**: Fixed position (top-right), always visible, purple/blue gradient button that triggers interactive onboarding tour
- **Two-Tab System**: 
  - **💬 Chat Tab**: Conversational interface with AI
  - **📊 All Charts Tab**: Grid view of all charts with interactive controls
- **Top Navigation Bar**: Contains tab buttons, Save Chat, Restart, and Scenario toggle buttons
- **Reference Box**: Draggable scenario card showing current inputs (can be toggled on/off)

#### **Onboarding Tour System**
- **Auto-start**: Tour automatically begins for first-time users (stored in localStorage)
- **Manual Start**: "Help" button in top-right corner allows restarting tour anytime
- **Tour Features**:
  - Interactive step-by-step guide using react-joyride
  - Highlights key UI elements with spotlight effect
  - Keyboard navigation (right arrow to advance)
  - Progress indicator showing current step
  - Skip option available
  - Smooth scrolling to each highlighted element
- **Tour Steps**: Covers Help button, ZIP input, scenario card, Save button, Restart button, scenario toggle, charts area, advanced charts toggle, and chat area

#### **Visual Design Elements**
- **Color Scheme**: Dark theme with purple/blue gradients (`rgba(139, 92, 246, ...)` and `rgba(59, 130, 246, ...)`)
- **Typography**: Clean, modern fonts with varying weights for hierarchy
- **Transitions**: Smooth animations for chart appearances, tab switches, and state changes
- **Tooltips**: Translucent dark tooltips (`rgba(5,8,15,0.85)`) with lavender borders for charts
- **Chart Colors**: Dull, translucent purple (`rgba(124,95,196,0.55-0.65)`) and blue (`rgba(80,140,210,0.5-0.6)`) for visual consistency

---

### Chat Tab Interface

#### **Chat Container Structure**
1. **Messages Area** (`messages-container`):
   - Scrollable container with auto-scroll to bottom when new messages/charts appear
   - Messages appear with staggered delays for natural conversation flow
   - Each message can contain:
     - Text content (user or assistant)
     - Recommendation cards (special message type)
     - Charts (rendered inline after message)

2. **Message Types**:
   - **User Messages**: Right-aligned, distinct styling
   - **Assistant Messages**: Left-aligned with AI avatar/indicator
   - **Recommendation Cards**: Special card component with verdict (BUY/RENT), savings, reasoning, and action buttons

3. **Loading States**:
   - **AI Thinking**: Typing dots animation
   - **Analysis Running**: Progress bar with percentage and stage description
   - **Chart Generation**: Individual progress bars per chart in All Charts tab

4. **Chat Input** (`ChatInput`):
   - Text input at bottom of chat
   - Send button
   - Auto-focus for quick typing

5. **Footer**: "RentVsBuy.ai v1.0 • Built with AI-powered insights"

6. **Chart Navigation Bar** (below chat, always visible):
   - **When Charts Not Ready**: Shows placeholder message "Charts will appear here after you complete your scenario"
   - **When Charts Ready**: Displays two sections:
     - **Core Charts Section**: Always visible grid of 4 chart buttons:
       - Monthly Cost Breakdown
       - Net Worth Comparison
       - Equity Buildup
       - Total Cost Comparison
     - **Advanced Analysis Section**: Collapsible section with toggle button
       - Header: "Advanced Analysis" with subtitle "Market risk, sensitivity, tax implications"
       - Description text: "These charts show risk, volatility, break-even points, and more detailed scenarios..."
       - Grid of 10+ advanced chart buttons (Monte Carlo, Break-Even, Heatmaps, etc.)
   - **Chart Button Structure**: Each button contains:
     - Icon (emoji) on left
     - Chart name (bold)
     - Brief description (small text)
   - **Button Behavior**: Clicking a chart button sends a message to AI requesting that specific chart

7. **Location Card** (appears when ZIP code detected):
   - Shows location information (city, state, ZIP)
   - Displays market data (median home price, average rent)
   - Two action buttons:
     - **"Use this data"**: Accepts location data and populates scenario
     - **"Use my own values"**: Allows user to override with custom inputs
   - Appears as a special message in chat flow

8. **Monte Carlo Progress Card** (special loading state):
   - Appears when Monte Carlo simulation is running
   - Shows progress percentage
   - Displays current stage ("Starting Monte Carlo simulation...", etc.)
   - Purple/blue gradient progress bar
   - Positioned prominently in chat area

9. **Modals**:
   - **Restart Confirmation Modal**: 
     - Appears when user clicks "Restart"
     - Asks "Start Over?" with confirmation message
     - Two buttons: "Cancel" and "Yes, Restart"
   - **Save Progress Modal**:
     - Appears during PDF generation
     - Circular progress indicator (0-100%)
     - "Generating PDF..." label
     - Green progress ring animation

#### **How Charts Appear in Chat**

**Chart Rendering Flow**:
1. User requests chart via natural language ("show me net worth" or "break even chart")
2. AI extracts chart intent and responds with explanation text
3. Chart component renders **directly below the assistant's message**
4. Chart uses **snapshot data stored with the message** (ensures charts don't change when new scenarios are calculated)
5. Charts appear with smooth fade-in animation

**Chart Display Features**:
- Each chart has a concise caption: "This shows..."
- Charts maintain their own data snapshots (independent of current scenario)
- Multiple charts can appear in sequence as user requests them
- Charts scroll into view automatically when rendered

#### **Recommendation Cards**

**Appearance**:
- Large, prominent card with colored header (green for RENT, blue for BUY)
- Icon (🏢 for rent, 🏠 for buy)
- **Verdict**: "RECOMMENDATION: RENT" or "RECOMMENDATION: BUY" in bold
- **Savings/Gains**: Large dollar amount with timeline context
- **Details Section**:
  - Monthly difference (buying vs renting costs)
  - Break-even year (if applicable)
  - Reasoning explanation
- **Action Buttons**:
  - "See Why" → Shows detailed breakdown
  - "Try Different Numbers" → Opens edit mode

**Behavior**:
- Appears automatically after initial analysis completes
- **New recommendation card appears** after user saves changes to scenario
- **Each recommendation persists in chat history** (stored in message, not shared state)
- Cards remain visible for comparison across multiple scenarios

#### **Scenario Reference Box**

**Location**: Top-right area (draggable, can be toggled on/off)

**Display Modes**:

1. **View Mode** (default):
   - Shows current scenario inputs:
     - Home Price
     - Monthly Rent
     - Down Payment %
     - Timeline (years)
   - **ML-Predicted Values** (when using ZIP code):
     - Home Appreciation Rate (with "ML-predicted" badge)
     - Rent Growth Rate (with "ML-predicted" badge)
     - Investment Return Rate
   - **Location Info**: City, State, ZIP code (if using location data)
   - **Data Source Indicators**: Shows whether values are from ZIP data, custom input, or defaults
   - "Edit" button to enter edit mode

2. **Edit Mode**:
   - Input fields become editable (text inputs for numbers)
   - Values can be modified directly
   - **Cancel** button (discards changes)
   - **Save Changes** button (recalculates all charts with new values)
   - After saving:
     - All charts recalculate with new inputs
     - New recommendation card appears
     - AI acknowledges changes with message

**Visual Indicators**:
- **ML Values**: Highlighted with special styling/badges (shows "ML-predicted" label)
- **Data Source**: Color-coded or labeled (ZIP vs Custom vs Default)
- **Location Display**: When using ZIP data, shows "🏙️ City, State" header with "Based on local market data" subtitle
- **Placeholder State**: Shows "Your scenario will appear here once you enter your ZIP code or provide home price and rent" when no data
- **Edit State**: Visual distinction when in edit mode (input fields become editable)
- **Close Button**: X button in header to hide reference box
- **Section Headers**: "Step 2: Your scenario" with descriptive subtitle

---

### All Charts Tab Interface

#### **Layout Structure**

1. **Assumption Controls Panel** (top of tab, collapsible):
   - **Header**: "⚙️ Adjust Assumptions" with expand/collapse toggle
   - **When Expanded**:
     - 4 interactive sliders:
       - **Interest Rate** (3% - 10%)
       - **Home Appreciation** (-2% - 8%)
       - **Rent Growth** (0% - 8%)
       - **Investment Return** (2% - 12%)
     - Each slider shows current value as percentage
     - **Real-time Updates**: All charts update instantly when sliders move
     - **Reset Button**: Returns to original assumptions
     - **Hint Text**: Explains that charts update in real-time
   - **Purpose**: Allows users to explore "what if" scenarios without re-entering data

2. **Charts Grid**:
   - **Two Sections**:
     - **Core Charts**: Always visible (Monthly Cost, Net Worth, Equity, Total Cost)
     - **Advanced Analysis**: Collapsible section (Monte Carlo, Break-Even, Heatmaps, etc.)
   - **Grid Layout**: Responsive grid (auto-fit, min 500px per chart)
   - **Chart Cards**: Each chart in its own card with:
     - Header with chart title
     - Chart content area
     - Consistent styling (dark background, purple border)

3. **Chart States**:

   **Placeholder State** (before data available):
   - Icon (📊)
   - Chart title
   - Message: "Chart will start generating once all the data is provided"

   **Loading State** (data available, chart generating):
   - Chart title
   - Progress percentage
   - Progress bar (purple/blue gradient)
   - Loading message (e.g., "Running Monte Carlo simulation...")

   **Complete State** (chart rendered):
   - Full chart visualization
   - Concise caption: "This shows..."
   - Interactive tooltips on hover

#### **Chart Display Features**

- **Consistent Dimensions**: All charts have standardized heights (320px-360px)
- **Scrollable Content**: Charts with long content (Scenario Overlay) have scrollbars
- **Tooltip Styling**: Dark, translucent tooltips with lavender accents
- **Color Consistency**: Dull, translucent purple and blue throughout
- **Responsive**: Grid adapts to screen size (1 column on mobile, 2+ on desktop)

---

### Data Flow & State Management

#### **Scenario Data Flow**

1. **Initial Input**:
   - User provides data via chat (ZIP code, home price, rent, etc.)
   - AI extracts structured data
   - Data stored in `userData` state

2. **Analysis Trigger**:
   - When all required data collected, analysis runs
   - Backend returns `AnalysisResult` with timeline and metrics
   - Frontend stores in `unifiedAnalysisResult` state

3. **ML Values Display**:
   - ML-predicted rates extracted from `unifiedAnalysisResult`
   - Displayed in reference box with "ML-predicted" badges
   - Override default/timeline-based rates

4. **Chart Generation**:
   - Charts use data from `unifiedAnalysisResult.timeline`
   - Each chart request stores snapshot in message
   - Charts remain independent of future recalculations

5. **Edit & Recalculate**:
   - User edits values in reference box
   - On save, new analysis runs
   - New `unifiedAnalysisResult` replaces old
   - All charts in All Charts tab update
   - New recommendation card appears in chat

#### **State Persistence**

- **Message History**: All messages, charts, and recommendations stored in `messages` array
- **Chart Snapshots**: Each chart message includes `snapshotData` to preserve chart state
- **Recommendation History**: Each recommendation stored in its message (not shared state)
- **Scenario State**: Current inputs in `userData`, analysis in `unifiedAnalysisResult`

---

### Interactive Features

#### **Auto-Scroll**
- Chat automatically scrolls to bottom when:
  - New messages added
  - Charts appear
  - Loading state changes
- Smooth scroll behavior for better UX

#### **Tab Switching**
- Seamless transition between Chat and All Charts tabs
- State preserved when switching
- Charts tab shows all available charts in grid format
- Assumption controls only visible in Charts tab

#### **Edit Mode**
- One-click entry to edit scenario
- Live value updates
- Cancel option to discard changes
- Save triggers full recalculation

#### **Chart Interactions**
- Hover tooltips show detailed data points
- Responsive to screen size
- Exportable via PDF (Save Chat button)
- Chart buttons trigger AI requests (sends message to chat)
- Charts appear inline after AI response

#### **Chart Button Navigation (Chat Tab)**
- **Core Charts**: 4 buttons always visible when charts ready
- **Advanced Charts**: Collapsible section with toggle (▶/▼ indicator)
- **Button Layout**: Grid layout with icons, labels, and descriptions
- **Disabled State**: Buttons appear but are non-interactive until charts ready
- **Visual Feedback**: Buttons have hover effects and active states

---

### Visual Hierarchy

1. **Primary Actions**: Tab buttons, Save, Restart (top navigation)
2. **Secondary Actions**: Scenario toggle, Edit button (reference box)
3. **Content**: Messages, charts, recommendations (main area)
4. **Input**: Chat input (bottom, always visible)
5. **Metadata**: Footer, loading indicators (subtle, non-intrusive)

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

