# AI Trading Platform (Signal Desk)
FastAPI backend + React (Vite) dashboard.

## Run
Backend:
  cd backend && python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt && uvicorn main:app --reload
Frontend (new terminal):
  cd frontend && npm install && npm run dev      # open http://localhost:5173

## Accounts
First start seeds an admin: username `admin`, password `admin12345` (override with ADMIN_USER / ADMIN_PASSWORD env vars).
Set JWT_SECRET to a long random value. Users self-register; admins see an Admin page and can delete any other account.

## Features
- Candlestick chart with SMA, Bollinger bands, AI forecast band overlay
- Chart analysis: trend, RSI, support/resistance, candlestick patterns
- Stock prediction: Chronos-Bolt (pretrained) with statistical fallback
- Sentiment: FinBERT with keyword fallback
- AI analyzer: Claude (set ANTHROPIC_API_KEY) with rule-based fallback
- Backtest lab: SMA crossover with costs, Sharpe, drawdown vs buy and hold

## Enable pretrained models
pip install torch chronos-forecasting transformers

## Notes
Data comes from yfinance (prototyping only; use a licensed feed for production).
Not included yet: broker/paper trading, screener, alerts, Docker, password reset, login rate limiting.
