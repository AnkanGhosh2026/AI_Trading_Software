import { useEffect, useState } from "react";
import Chart from "../components/Chart.jsx";
import { api } from "../api.js";

const Kpi = ({ k, v, cls }) => (
  <div className="card kpi"><small>{k}</small><b className={"num " + (cls || "")}>{v}</b></div>
);

function verdict(pat, fc, sent) {
  let s = 0;
  if (pat) { s += pat.trend === "uptrend" ? 1 : pat.trend === "downtrend" ? -1 : 0; s += pat.rsi < 30 ? 1 : pat.rsi > 70 ? -1 : 0; }
  if (fc) s += fc.exp_return_pct > 0.5 ? 1 : fc.exp_return_pct < -0.5 ? -1 : 0;
  if (sent) s += sent.average > 0.1 ? 1 : sent.average < -0.1 ? -1 : 0;
  return s >= 2 ? ["Bullish", "up"] : s <= -2 ? ["Bearish", "down"] : ["Neutral", "mute"];
}

export default function Terminal({ sym, setSym, wl, setWl, prefs }) {
  const [period, setPeriod] = useState(prefs?.defaultPeriod || "1y");
  const [data, setData] = useState(null), [err, setErr] = useState("");
  const [pat, setPat] = useState(null), [fc, setFc] = useState(null), [sent, setSent] = useState(null);
  const [ind, setInd] = useState(prefs?.indicators || { sma20: true, sma50: true, bb: false, forecast: true });
  const [tab, setTab] = useState("Sentiment");
  const [bt, setBt] = useState(null), [p, setP] = useState({ fast: 20, slow: 50, cost_bps: 20 });
  const [q, setQ] = useState("Give a bull and bear case."), [ans, setAns] = useState(null), [busy, setBusy] = useState(false);

  const PERIODS = ["3mo", "6mo", "1y", "2y", "5y"];

  useEffect(() => {
    setPat(null); setFc(null); setSent(null); setBt(null); setAns(null);
    api(`/api/patterns?symbol=${sym}`).then(setPat).catch(() => {});
    api(`/api/forecast?symbol=${sym}`).then(setFc).catch(() => {});
    api(`/api/sentiment?symbol=${sym}`).then(setSent).catch(() => setSent({ items: [], model: "unavailable", average: 0 }));
  }, [sym]);

  useEffect(() => {
    setErr(""); setData(null);
    api(`/api/ohlcv?symbol=${sym}&period=${period}`).then(setData).catch((e) => setErr(`Could not load ${sym}: ${e.message}. Use Yahoo Finance symbols, e.g. TCS.NS`));
  }, [sym, period]);

  const lines = data ? [
    ind.sma20 && { data: data.sma20, color: "#f2b84b" },
    ind.sma50 && { data: data.sma50, color: "#60a5fa" },
    ind.bb && { data: data.bb_upper, color: "#64748b" },
    ind.bb && { data: data.bb_lower, color: "#64748b" },
    ind.forecast && fc && { data: fc.p50, color: "#c084fc", width: 2 },
    ind.forecast && fc && { data: fc.p10, color: "#c084fc", dashed: true },
    ind.forecast && fc && { data: fc.p90, color: "#c084fc", dashed: true },
  ].filter(Boolean) : [];

  const [vd, vcls] = verdict(pat, fc, sent);
  const starred = wl.includes(sym);
  const run = async () => { setBusy(true); try { setBt(await api("/api/backtest", { symbol: sym, ...p })); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  const ask = async () => { setBusy(true); try { setAns(await api("/api/analyze", { symbol: sym, question: q })); } catch (e) { setAns({ answer: e.message, source: "error" }); } finally { setBusy(false); } };

  return (
    <div className="page-content" style={{ padding: "20px 24px" }}>
      <div className="head">
        <h1>{sym}</h1>
        {data && <><span className="price num">{data.last.toFixed(2)}</span><span className={"num " + (data.change_pct >= 0 ? "up" : "down")}>{data.change_pct > 0 ? "+" : ""}{data.change_pct}%</span></>}
        <button className={"ghost " + (starred ? "on" : "")} onClick={() => setWl(starred ? wl.filter((i) => i !== sym) : [...wl, sym])}>
          {starred ? "★ In watchlist" : "☆ Add to watchlist"}
        </button>
        <span className="sp" />
        {PERIODS.map((x) => <button key={x} className={"ghost " + (period === x ? "on" : "")} onClick={() => setPeriod(x)}>{x}</button>)}
      </div>

      {err && <div className="card err" style={{ marginBottom: 16 }}>{err}</div>}

      <div className="kpis">
        <Kpi k="Trend" v={pat ? pat.trend : "…"} />
        <Kpi k="RSI (14)" v={pat ? pat.rsi : "…"} cls={pat && (pat.rsi > 70 ? "down" : pat.rsi < 30 ? "up" : "")} />
        <Kpi k="10-day forecast" v={fc ? `${fc.exp_return_pct}%` : "…"} cls={fc && (fc.exp_return_pct >= 0 ? "up" : "down")} />
        <Kpi k="News sentiment" v={sent ? sent.average : "…"} cls={sent && (sent.average >= 0 ? "up" : "down")} />
        <Kpi k="Support" v={pat ? (pat.support.slice(-1)[0] || 0).toFixed(2) : "…"} />
        <Kpi k="Resistance" v={pat ? (pat.resistance[0] || 0).toFixed(2) : "…"} />
      </div>

      <div className="cols">
        <section className="card">
          <div className="tools">
            {[["sma20", "SMA 20"], ["sma50", "SMA 50"], ["bb", "Bollinger"], ["forecast", "AI forecast"]].map(([k, l]) => (
              <button key={k} className={"ghost " + (ind[k] ? "on" : "")} onClick={() => setInd({ ...ind, [k]: !ind[k] })}>{l}</button>
            ))}
          </div>
          {data ? <Chart candles={data.candles} lines={lines} /> : !err && <div className="mute">Loading chart…</div>}
          {fc && <div className="note">Forecast model: {fc.model}. Dashed lines show 10th–90th percentile range.</div>}
        </section>

        <div className="col">
          <div className="card verdict"><h3>AI signal</h3><b className={vcls}>{vd}</b><div className="note">Combines trend, RSI, forecast and sentiment. A simple heuristic, not a recommendation.</div></div>
          <div className="card"><h3>Key levels</h3>
            {pat ? <>
              {pat.resistance.slice().reverse().map((x) => <div className="lvl" key={x}><span className="mute">Resistance</span><b className="num down">{x.toFixed(2)}</b></div>)}
              {pat.support.slice().reverse().map((x) => <div className="lvl" key={x}><span className="mute">Support</span><b className="num up">{x.toFixed(2)}</b></div>)}
            </> : <span className="mute">Loading</span>}
          </div>
          <div className="card"><h3>Candlestick patterns (last 5 sessions)</h3>
            <ul>{pat && pat.candles.length ? pat.candles.map((c, i) => <li key={i}>{c.date}: {c.pattern}</li>) : <li className="mute">None detected</li>}</ul>
          </div>
        </div>
      </div>

      <section className="card">
        <div className="tabs">
          {["Sentiment", "Backtest", "AI analyzer"].map((t) => (
            <button key={t} className={"ghost " + (tab === t ? "on" : "")} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {tab === "Sentiment" && (sent ? <>
          <p>Average score <b className={sent.average >= 0 ? "up" : "down"}>{sent.average}</b> <span className="mute">({sent.model})</span></p>
          <ul>{sent.items.length ? sent.items.map((i, k) => <li key={k}><b className={i.score >= 0 ? "up" : "down"}>{i.score}</b> {i.headline}</li>) : <li className="mute">No headlines found for this symbol.</li>}</ul>
        </> : <span className="mute">Scoring headlines…</span>)}

        {tab === "Backtest" && <>
          <div className="tools" style={{ alignItems: "center" }}>
            {[["fast", "Fast SMA"], ["slow", "Slow SMA"], ["cost_bps", "Cost (bps)"]].map(([k, l]) => (
              <label key={k}>{l} <input type="number" style={{ width: 80 }} value={p[k]} onChange={(e) => setP({ ...p, [k]: +e.target.value })} /></label>
            ))}
            <button className="btn" onClick={run} disabled={busy}>{busy ? "Running" : "Run backtest"}</button>
          </div>
          {bt && <><div className="kpis">
            <Kpi k="Strategy CAGR" v={bt.cagr_pct + "%"} /><Kpi k="Buy & hold CAGR" v={bt.buy_hold_cagr_pct + "%"} />
            <Kpi k="Sharpe" v={bt.sharpe} /><Kpi k="Max drawdown" v={bt.max_drawdown_pct + "%"} cls="down" /><Kpi k="Trades" v={bt.trades} />
          </div>
          <Chart height={300} lines={[{ data: bt.strategy, color: "#34d399", width: 2 }, { data: bt.buy_hold, color: "#8393a8" }]} /></>}
        </>}

        {tab === "AI analyzer" && <>
          <div className="tools">
            <input style={{ flex: 1, minWidth: 240 }} value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn" onClick={ask} disabled={busy}>{busy ? "Thinking…" : "Analyze"}</button>
          </div>
          {ans && <><p style={{ whiteSpace: "pre-wrap", maxWidth: 760 }}>{ans.answer}</p><small className="mute">Source: {ans.source}</small></>}
        </>}
      </section>

      <p className="note">For research and education only. Not investment advice. Forecasts are uncertain, and past backtests do not predict future results.</p>
    </div>
  );
}
