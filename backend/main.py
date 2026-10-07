"""AI Trading Platform API. Run: uvicorn main:app --reload"""
import os
from dotenv import load_dotenv
load_dotenv()  # loads .env file from the current directory
import numpy as np, pandas as pd, yfinance as yf
from fastapi import FastAPI, HTTPException, Depends
import auth, time
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AI Trading Platform")
auth.init(); 
app.include_router(auth.router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
_cache = {}
TTL = 300

def load(sym, period="2y"):
    key = (sym, period)
    if key in _cache and time.time() - _cache[key][0] < TTL: return _cache[key][1]
    df = yf.download(sym, period=period, auto_adjust=True, progress=False)
    if df.empty: raise HTTPException(404, f"No data for {sym}")
    if isinstance(df.columns, pd.MultiIndex): df.columns = df.columns.get_level_values(0)
    _cache[key] = (time.time(), df.dropna())
    return _cache[key][1]

def rsi(c, n=14):
    d = c.diff(); up = d.clip(lower=0).rolling(n).mean(); dn = -d.clip(upper=0).rolling(n).mean()
    return 100 - 100 / (1 + up / dn)

def line(idx, vals):
    return [{"time": t.strftime("%Y-%m-%d"), "value": round(float(v), 2)} for t, v in zip(idx, vals) if pd.notna(v)]

@app.get("/api/ohlcv", dependencies=[Depends(auth.current_user)])
def ohlcv(symbol: str, period: str = "2y"):
    df = load(symbol, period); c = df["Close"]
    bb_m, bb_s = c.rolling(20).mean(), c.rolling(20).std()
    return {
        "candles": [{"time": t.strftime("%Y-%m-%d"), "open": round(float(r.Open), 2), "high": round(float(r.High), 2),
                     "low": round(float(r.Low), 2), "close": round(float(r.Close), 2)} for t, r in df.iterrows()],
        "sma20": line(df.index, bb_m), "sma50": line(df.index, c.rolling(50).mean()),
        "bb_upper": line(df.index, bb_m + 2 * bb_s), "bb_lower": line(df.index, bb_m - 2 * bb_s),
        "rsi": line(df.index, rsi(c)),
        "last": float(c.iloc[-1]), "change_pct": round(float(c.pct_change().iloc[-1] * 100), 2),
    }

@app.get("/api/patterns", dependencies=[Depends(auth.current_user)])
def patterns(symbol: str):
    df = load(symbol); c, h, l = df["Close"], df["High"], df["Low"]; last = float(c.iloc[-1])
    w = df.tail(120); lo_min = w["Low"].rolling(11, center=True).min(); hi_max = w["High"].rolling(11, center=True).max()
    sup = [float(v) for i, v in w["Low"].items() if v == lo_min[i]]
    res = [float(v) for i, v in w["High"].items() if v == hi_max[i]]
    sma50, sma200 = c.rolling(50).mean(), c.rolling(200).mean()
    trend = "uptrend" if last > sma50.iloc[-1] > sma200.iloc[-1] else "downtrend" if last < sma50.iloc[-1] < sma200.iloc[-1] else "sideways"
    found = []
    for k in range(-5, 0):
        o, cl, po, pc = df.Open.iloc[k], c.iloc[k], df.Open.iloc[k - 1], c.iloc[k - 1]
        rng = h.iloc[k] - l.iloc[k]; d = df.index[k].strftime("%Y-%m-%d")
        if rng > 0 and abs(cl - o) / rng < 0.1: found.append({"date": d, "pattern": "Doji (indecision)"})
        if pc < po and cl > o and cl >= po and o <= pc: found.append({"date": d, "pattern": "Bullish engulfing"})
        if pc > po and cl < o and cl <= po and o >= pc: found.append({"date": d, "pattern": "Bearish engulfing"})
    return {"trend": trend, "rsi": round(float(rsi(c).iloc[-1]), 1),
            "support": sorted([s for s in sup if s < last])[-3:], "resistance": sorted([r for r in res if r > last])[:3],
            "candles": found}

_pipe = None
@app.get("/api/forecast", dependencies=[Depends(auth.current_user)])
def forecast(symbol: str, horizon: int = 10):
    c = load(symbol)["Close"]; last = float(c.iloc[-1]); dates = pd.bdate_range(c.index[-1] + pd.Timedelta(days=1), periods=horizon)
    try:
        global _pipe
        import torch
        from chronos import BaseChronosPipeline
        _pipe = _pipe or BaseChronosPipeline.from_pretrained("amazon/chronos-bolt-small", device_map="cpu", torch_dtype=torch.float32)
        q, _ = _pipe.predict_quantiles(torch.tensor(c.values[-256:], dtype=torch.float32), prediction_length=horizon, quantile_levels=[0.1, 0.5, 0.9])
        p10, p50, p90 = [q[0, :, i].numpy() for i in range(3)]; model = "Chronos-Bolt (pretrained, zero-shot)"
    except Exception:
        r = np.log(c).diff().dropna().tail(250); mu, sd = r.mean(), r.std(); n = np.arange(1, horizon + 1)
        p50 = last * np.exp(mu * n); p10 = last * np.exp(mu * n - 1.28 * sd * np.sqrt(n)); p90 = last * np.exp(mu * n + 1.28 * sd * np.sqrt(n))
        model = "Statistical drift/volatility fallback (install torch + chronos-forecasting for Chronos)"
    return {"model": model, "exp_return_pct": round(float(p50[-1] / last - 1) * 100, 2),
            "p10": line(dates, p10), "p50": line(dates, p50), "p90": line(dates, p90)}

POS = {"beat", "growth", "surge", "profit", "record", "upgrade", "gain", "strong", "rally", "wins", "rise"}
NEG = {"miss", "fall", "loss", "downgrade", "fraud", "probe", "weak", "slump", "drop", "cut", "decline", "lawsuit"}
_fb = None
@app.get("/api/sentiment", dependencies=[Depends(auth.current_user)])
def sentiment(symbol: str):
    heads = []
    for n in (yf.Ticker(symbol).news or [])[:10]:
        t = (n.get("content") or n).get("title")
        if t: heads.append(t)
    out = []
    try:
        global _fb
        from transformers import pipeline
        _fb = _fb or pipeline("text-classification", model="ProsusAI/finbert", top_k=None)
        for h, o in zip(heads, _fb(heads)):
            d = {x["label"]: x["score"] for x in o}; out.append({"headline": h, "score": round(d["positive"] - d["negative"], 2)})
        model = "FinBERT"
    except Exception:
        for h in heads:
            w = set(h.lower().split()); out.append({"headline": h, "score": float(len(w & POS) - len(w & NEG))})
        model = "Keyword fallback (install transformers + torch for FinBERT)"
    avg = round(sum(x["score"] for x in out) / len(out), 2) if out else 0
    return {"model": model, "average": avg, "items": out}

class BT(BaseModel):
    symbol: str; fast: int = 20; slow: int = 50; cost_bps: float = 20

@app.post("/api/backtest", dependencies=[Depends(auth.current_user)])
def backtest(b: BT):
    c = load(b.symbol, "5y")["Close"]
    pos = (c.rolling(b.fast).mean() > c.rolling(b.slow).mean()).astype(float).shift(1).fillna(0)
    ret = c.pct_change().fillna(0) * pos - pos.diff().abs().fillna(0) * b.cost_bps / 1e4
    eq, bh = (1 + ret).cumprod(), c / c.iloc[0]
    yrs = len(c) / 252; dd = (eq / eq.cummax() - 1).min()
    return {"cagr_pct": round((eq.iloc[-1] ** (1 / yrs) - 1) * 100, 2), "sharpe": round(float(ret.mean() / ret.std() * np.sqrt(252)), 2) if ret.std() else 0,
            "max_drawdown_pct": round(float(dd) * 100, 2), "trades": int(pos.diff().abs().sum()),
            "buy_hold_cagr_pct": round((bh.iloc[-1] ** (1 / yrs) - 1) * 100, 2),
            "strategy": line(eq.index, eq), "buy_hold": line(bh.index, bh)}

class Ask(BaseModel):
    symbol: str; question: str = "Give a bull and bear case."

@app.post("/api/analyze", dependencies=[Depends(auth.current_user)])
def analyze(a: Ask):
    ctx = {"patterns": patterns(a.symbol), "forecast": {k: v for k, v in forecast(a.symbol).items() if k in ("model", "exp_return_pct")},
           "sentiment": {"average": sentiment(a.symbol)["average"]}}
    system_prompt = "You are a cautious equity research assistant. Use only the provided data, state uncertainty, never promise returns."
    user_msg = f"Symbol {a.symbol}. Data: {ctx}\nQuestion: {a.question}"

    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            # Try models in priority order (best available for this account)
            groq_models = [
                "llama-3.3-70b-versatile",
                "llama3-70b-8192",
                "llama3-8b-8192",
                "qwen/qwen3.8-27b",
                "openai/gpt-oss-120b",
                "openai/gpt-oss-20b",
            ]
            resp = None
            used_model = None
            for m in groq_models:
                try:
                    resp = client.chat.completions.create(
                        model=m, max_tokens=700,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_msg},
                        ],
                    )
                    used_model = m
                    break
                except Exception:
                    continue
            if resp and resp.choices[0].message.content.strip():
                return {"answer": resp.choices[0].message.content, "source": f"Groq ({used_model})"}
        except Exception:
            pass  # fall through to next provider

    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_key:
        import anthropic
        r = anthropic.Anthropic(api_key=anthropic_key).messages.create(
            model="claude-sonnet-4-6", max_tokens=700,
            system=system_prompt,
            messages=[{"role": "user", "content": user_msg}])
        return {"answer": r.content[0].text, "source": "Claude (claude-sonnet-4-6)"}

    p, f = ctx["patterns"], ctx["forecast"]
    return {"source": "Rule-based (set GROQ_API_KEY or ANTHROPIC_API_KEY for LLM analysis)",
            "answer": f"{a.symbol}: {p['trend']}, RSI {p['rsi']}. Forecast {f['exp_return_pct']}% over the horizon. Sentiment {ctx['sentiment']['average']}. "
                      f"Support {p['support']}, resistance {p['resistance']}. This is not investment advice."}

@app.get("/api/search", dependencies=[Depends(auth.current_user)])
def search_symbols(q: str):
    if not q or len(q) < 1:
        return []
    try:
        results = yf.Search(q, max_results=10, enable_fuzzy_query=True)
        quotes = results.quotes or []
        out = []
        for item in quotes[:10]:
            symbol = item.get("symbol", "")
            name = item.get("longname") or item.get("shortname") or symbol
            exchange = item.get("exchDisp") or item.get("exchange") or ""
            qtype = item.get("quoteType", "")
            if symbol:
                out.append({"symbol": symbol, "name": name, "exchange": exchange, "type": qtype})
        return out
    except Exception as ex:
        raise HTTPException(500, f"Search failed: {ex}")

@app.get("/api/quotes", dependencies=[Depends(auth.current_user)])
def quotes(symbols: str):
    out = {}
    for s in symbols.split(",")[:20]:
        try:
            c = load(s.strip(), "1mo")["Close"]
            out[s] = {"last": round(float(c.iloc[-1]), 2), "change_pct": round(float(c.pct_change().iloc[-1] * 100), 2)}
        except Exception: pass
    return out

@app.get("/api/news", dependencies=[Depends(auth.current_user)])
def news(symbols: str):
    out = []
    seen = set()
    for s in symbols.split(",")[:15]:
        s = s.strip()
        try:
            items = yf.Ticker(s).news or []
            for n in items[:8]:
                t = (n.get("content") or n).get("title")
                link = (n.get("content") or n).get("canonicalUrl", {})
                url = link.get("url", "") if isinstance(link, dict) else ""
                pub = (n.get("content") or n).get("pubDate", "") or (n.get("content") or n).get("providerPublishTime", "")
                src = ((n.get("content") or n).get("provider") or {}).get("displayName", "") if isinstance((n.get("content") or n).get("provider"), dict) else ""
                if not t or t in seen: continue
                seen.add(t)
                w = set(t.lower().split())
                score = float(len(w & POS) - len(w & NEG))
                out.append({"symbol": s, "title": t, "url": url, "published": str(pub), "source": src, "score": score})
        except Exception: pass
    out.sort(key=lambda x: x.get("published", ""), reverse=True)
    return out[:60]

@app.get("/api/screener", dependencies=[Depends(auth.current_user)])
def screener(symbols: str):
    out = []
    for s in symbols.split(",")[:30]:
        s = s.strip()
        try:
            p = patterns(s)
            try:
                c_data = load(s, "1mo")["Close"]
                last = round(float(c_data.iloc[-1]), 2)
                chg = round(float(c_data.pct_change().iloc[-1] * 100), 2)
                ret_1m = round(float((c_data.iloc[-1] / c_data.iloc[0] - 1) * 100), 2)
            except Exception:
                last, chg, ret_1m = 0, 0, 0
            try:
                fc = forecast(s)
                fc_pct = fc.get("exp_return_pct", 0)
            except Exception:
                fc_pct = 0
            out.append({"symbol": s, "trend": p["trend"], "rsi": p["rsi"],
                        "last": last, "change_pct": chg, "return_1m": ret_1m, "forecast_pct": fc_pct,
                        "support": p["support"][-1] if p["support"] else 0,
                        "resistance": p["resistance"][0] if p["resistance"] else 0})
        except Exception: pass
    return out
