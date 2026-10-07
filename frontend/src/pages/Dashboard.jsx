import { useEffect, useState } from "react";
import { api } from "../api.js";

const INDICES = ["^NSEI", "^NSEBANK", "^GSPC", "^DJI", "BTC-USD", "GC=F"];
const INDEX_LABELS = { "^NSEI": "NIFTY 50", "^NSEBANK": "BANK NIFTY", "^GSPC": "S&P 500", "^DJI": "DOW JONES", "BTC-USD": "Bitcoin", "GC=F": "Gold" };

function StatCard({ label, value, change, sub }) {
  const up = parseFloat(change) >= 0;
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-change ${up ? "up" : "down"}`}>{up ? "▲" : "▼"} {Math.abs(change)}%</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function SignalBadge({ trend, rsi }) {
  let s = 0;
  if (trend === "uptrend") s++; else if (trend === "downtrend") s--;
  if (rsi < 30) s++; else if (rsi > 70) s--;
  const label = s >= 1 ? "Bullish" : s <= -1 ? "Bearish" : "Neutral";
  return <span className={`signal-badge ${label.toLowerCase()}`}>{label}</span>;
}

export default function Dashboard({ wl, onNavigate }) {
  const [quotes, setQuotes] = useState({});
  const [indices, setIndices] = useState({});
  const [patterns, setPatterns] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const all = [...new Set([...INDICES, ...wl])].join(",");
    api(`/api/quotes?symbols=${all}`).then((d) => {
      const idx = {}, q = {};
      INDICES.forEach((s) => { if (d[s]) idx[s] = d[s]; });
      wl.forEach((s) => { if (d[s]) q[s] = d[s]; });
      setIndices(idx); setQuotes(q); setLoading(false);
    }).catch(() => setLoading(false));
  }, [wl.join(",")]);

  useEffect(() => {
    wl.slice(0, 8).forEach((s) => {
      api(`/api/patterns?symbol=${s}`).then((p) => setPatterns((prev) => ({ ...prev, [s]: p }))).catch(() => {});
    });
  }, [wl.join(",")]);

  const sorted = wl.filter((s) => quotes[s]).sort((a, b) => (quotes[b]?.change_pct || 0) - (quotes[a]?.change_pct || 0));
  const gainers = sorted.slice(0, 3);
  const losers = [...sorted].reverse().slice(0, 3);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Market Dashboard</h1>
        <span className="page-subtitle">Live overview · auto-updates every 60s</span>
      </div>

      {/* Market Indices Strip */}
      <section className="dash-section">
        <h2 className="section-title">Global Indices & Assets</h2>
        <div className="indices-grid">
          {INDICES.map((s) => {
            const q = indices[s];
            return q ? (
              <StatCard key={s} label={INDEX_LABELS[s] || s} value={q.last.toLocaleString()} change={q.change_pct} />
            ) : (
              <div key={s} className="stat-card loading-card"><div className="stat-label">{INDEX_LABELS[s] || s}</div><div className="stat-value mute">—</div></div>
            );
          })}
        </div>
      </section>

      {/* Gainers & Losers */}
      <div className="dash-two-col">
        <section className="dash-section">
          <h2 className="section-title">🚀 Top Gainers</h2>
          <div className="mover-list">
            {gainers.length === 0 && <div className="mute" style={{ padding: "12px 0" }}>Add stocks to watchlist to see movers.</div>}
            {gainers.map((s) => (
              <div key={s} className="mover-row" onClick={() => onNavigate("terminal", s)}>
                <div>
                  <div className="mover-sym">{s}</div>
                  <div className="mover-price">{quotes[s]?.last}</div>
                </div>
                <span className="up mover-chg">+{quotes[s]?.change_pct}%</span>
              </div>
            ))}
          </div>
        </section>
        <section className="dash-section">
          <h2 className="section-title">📉 Top Losers</h2>
          <div className="mover-list">
            {losers.length === 0 && <div className="mute" style={{ padding: "12px 0" }}>Add stocks to watchlist to see movers.</div>}
            {losers.map((s) => (
              <div key={s} className="mover-row" onClick={() => onNavigate("terminal", s)}>
                <div>
                  <div className="mover-sym">{s}</div>
                  <div className="mover-price">{quotes[s]?.last}</div>
                </div>
                <span className="down mover-chg">{quotes[s]?.change_pct}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Watchlist Table with AI Signals */}
      <section className="dash-section">
        <h2 className="section-title">Watchlist Overview</h2>
        {loading ? <div className="mute">Loading market data…</div> : (
          <div className="overview-table-wrap">
            <table className="overview-table">
              <thead><tr><th>Symbol</th><th>Price</th><th>Change</th><th>Trend</th><th>RSI</th><th>AI Signal</th><th></th></tr></thead>
              <tbody>
                {wl.map((s) => {
                  const q = quotes[s]; const p = patterns[s];
                  return (
                    <tr key={s} className="overview-row" onClick={() => onNavigate("terminal", s)}>
                      <td><b>{s}</b></td>
                      <td className="num">{q ? q.last : <span className="mute">—</span>}</td>
                      <td className={q ? (q.change_pct >= 0 ? "up num" : "down num") : "mute"}>
                        {q ? `${q.change_pct > 0 ? "+" : ""}${q.change_pct}%` : "—"}
                      </td>
                      <td>{p ? <span className={`trend-pill ${p.trend}`}>{p.trend}</span> : <span className="mute">…</span>}</td>
                      <td className="num">{p ? <span className={p.rsi > 70 ? "down" : p.rsi < 30 ? "up" : ""}>{p.rsi}</span> : <span className="mute">…</span>}</td>
                      <td>{p ? <SignalBadge trend={p.trend} rsi={p.rsi} /> : <span className="mute">…</span>}</td>
                      <td><button className="ghost xs" onClick={(e) => { e.stopPropagation(); onNavigate("terminal", s); }}>Open →</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
