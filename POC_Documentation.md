# Signal Desk: Proof of Concept (PoC) Documentation

## 1. Executive Summary
**Signal Desk** is a next-generation AI-powered trading platform designed to bridge the gap between institutional-grade algorithmic tools and retail trading accessibility. This Proof of Concept (PoC) demonstrates a functional, full-stack application that leverages machine learning (ML) models and large language models (LLMs) to provide real-time market analysis, sentiment tracking, and price forecasting.

The platform is built on a high-performance stack:
*   **Frontend:** React 18 + Vite, featuring a sleek, dark-themed glassmorphism UI for a professional trading experience.
*   **Backend:** FastAPI (Python) for ultra-low latency data streaming and model inference.
*   **Data & AI:** Integration with `yfinance` for market data, FinBERT for sentiment analysis, and Chronos-Bolt for time-series forecasting.

---

## 2. Core Features & Capabilities

### 2.1. Advanced Trading Terminal
*   **Interactive Candlestick Charts:** Built-in charting with real-time plotting of Open, High, Low, Close (OHLC) data.
*   **Technical Indicators:** Instantly overlay Simple Moving Averages (SMA 20, SMA 50) and Bollinger Bands.
*   **Automated Level Detection:** Automatic plotting of key support and resistance levels.
*   **Pattern Recognition:** Real-time detection of candlestick patterns across recent sessions.

### 2.2. AI Predictive Modeling & Forecasting
*   **Chronos-Bolt Integration:** Utilizes pretrained foundation models for time-series forecasting to predict future price action.
*   **Statistical Fallback:** If deep learning models are unavailable, the system gracefully degrades to robust statistical drift and volatility models.
*   **Visual Forecast Bands:** Forecasts are plotted directly onto the main chart as an interactive overlay showing 10th-90th percentile probability ranges.

### 2.3. Real-Time News & Sentiment Analysis
*   **FinBERT Processing:** Automatically ingests breaking financial news and processes it through FinBERT to calculate a sentiment score (Bullish, Bearish, or Neutral).
*   **Keyword Scoring Fallback:** A robust rule-based NLP fallback ensures sentiment is always calculated even if heavy transformer models are offline.

### 2.4. Backtesting Lab & Strategy Screener
*   **Instant Backtesting:** Test moving average crossover strategies with one click.
*   **Detailed Metrics:** Returns institutional metrics including Sharpe Ratio, Maximum Drawdown, and comparison against a standard Buy & Hold strategy.
*   **Market Screener:** Scan the entire market or custom watchlists for specific setups (e.g., RSI oversold, MACD crossovers, high volume breakouts).

### 2.5. Role-Based Access & Workspace Management
*   **Admin vs. User Tiers:** Admins can manage the platform and users, while users get isolated, personalized workspaces.
*   **Cloud Syncing:** Watchlists and chart preferences (default periods, active indicators) are synced to the user's account.

---

## 3. Key Use Cases

### Use Case A: The Algorithmic Swing Trader
**Scenario:** A trader wants to identify medium-term trends without writing complex Python scripts.
**Execution:** 
1. The user opens the **Screener** to filter for stocks in their watchlist currently showing a "downtrend" but approaching a major "support" level.
2. They click into the **Terminal** for a specific asset (e.g., NVDA).
3. They activate the **AI Forecast** overlay to see the model's 30-day projection.
4. They run a quick **Backtest** on the SMA 20/50 crossover to see historical performance before entering the trade.

### Use Case B: The News-Driven Day Trader
**Scenario:** The market opens and breaking news is dropping rapidly during earnings season.
**Execution:**
1. The user keeps the **News Feed** tab open.
2. As headlines drop, the backend FinBERT model scores the sentiment in milliseconds.
3. The user sees a high-confidence "Bullish" score on an Apple (AAPL) headline and immediately switches to the **Dashboard** to monitor the asset's intraday momentum.

### Use Case C: The Portfolio Manager
**Scenario:** An analyst needs a high-level view of daily market movers and general AI sentiment.
**Execution:**
1. The user logs in and views the **Dashboard**.
2. The UI instantly displays Top Gainers and Top Losers from their curated watchlist.
3. The "Watchlist Overview" table aggregates current price, daily change %, trend, and an aggregated AI Signal (Bullish/Bearish/Neutral) for every asset at a glance.

---

## 4. User Journey: How to Use Signal Desk

### Step 1: Authentication & Onboarding
*   **Landing Page:** Users arrive at a professional, interactive landing page showcasing platform capabilities.
*   **Login:** Users enter their credentials (e.g., `user` / `12345678`). Administrators can log in using `admin` / `admin12345` to access user-management panels.

### Step 2: The Dashboard Overview
*   Upon login, the user lands on the **Dashboard**.
*   They view the KPI cards at the top (tracking major indices).
*   They scroll down to review the **Watchlist Overview**, noting which stocks have an overarching "Bullish" AI Signal.

### Step 3: Deep Dive in the Terminal
*   The user clicks on a ticker (e.g., `RELIANCE.NS`) from the dashboard, transporting them to the **Terminal**.
*   **Charting:** They use the top toggles to switch the timeframe from `3mo` to `1y`.
*   **Indicators:** They toggle on `SMA 20` and `Bollinger Bands`.
*   **AI Analysis:** They click the `AI Analyzer` tab below the chart to generate an LLM-driven summary of current price action and support/resistance levels.

### Step 4: Setup Alerts & Manage Portfolio
*   If the user likes a setup but isn't ready to buy, they navigate to the **Alerts** tab and set a price-target trigger.
*   They can review their hypothetical performance in the **Portfolio** tab.

### Step 5: Customizing the Experience
*   The user navigates to **Settings**.
*   They change their default chart period to `6mo` and set `AI Forecast` to be enabled by default on all new charts. 
*   These preferences are saved seamlessly to their profile.

---

## 5. Technical Requirements & Deployment

To run this PoC locally:

1.  **Start the Backend:**
    ```bash
    cd backend
    python -m venv .venv
    source .venv/bin/activate  # Or .\.venv\Scripts\activate on Windows
    pip install -r requirements.txt
    uvicorn main:app --reload
    ```
    *Ensure `.env` contains `JWT_SECRET` and relevant API keys (e.g., `ANTHROPIC_API_KEY`).*

2.  **Start the Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    *The frontend will proxy `/api` requests to `localhost:8000` automatically.*

3.  **Advanced ML Features (Optional):**
    For full Chronos and FinBERT functionality, install the deep learning dependencies in the backend environment:
    ```bash
    pip install torch chronos-forecasting transformers
    ```
