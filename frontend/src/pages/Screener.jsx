import { useState } from "react";
import { api } from "../api.js";

const UNIVERSE = [
  "RELIANCE.NS","TCS.NS","HDFCBANK.NS","INFY.NS","ICICIBANK.NS","HINDUNILVR.NS",
  "ITC.NS","SBIN.NS","BHARTIARTL.NS","KOTAKBANK.NS","LT.NS","AXISBANK.NS",
  "ASIANPAINT.NS","MARUTI.NS","BAJFINANCE.NS","WIPRO.NS","TITAN.NS","ULTRACEMCO.NS",
  "NESTLEIND.NS","TECHM.NS","AAPL","MSFT","GOOGL","AMZN","META","TSLA","NVDA",
  "BTC-USD","ETH-USD","^NSEI","^GSPC"
];

const TREND_COLOR = { uptrend: "up", downtrend: "down", sideways: "mute" };

export default function Screener({ wl, onNavigate }) {
  const [universe, setUniverse] = useState("nifty");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [filters, setFilters] = useState({ trend: "all", rsiMin: "", rsiMax: "", fcDir: "all" });
  const [sortCol, setSortCol] = useState("symbol");
  const [sortAsc, setSortAsc] = useState(true);
  const [customSyms, setCustomSyms] = useState("");

  const run = async () => {
    setLoading(true); setRan(true);
    const syms = universe === "watchlist" ? wl
      : universe === "custom" ? customSyms.split(",").map((s) => s.trim()).filter(Boolean)
      : UNIVERSE;
    try {
      const data = await api(`/api/screener?symbols=${syms.join(",")}`);
      setResults(data);
    } catch { setResults([]); }
    setLoading(false);
  };

  const doSort = (col) => { if (sortCol === col) setSortAsc(!sortAsc); else { setSortCol(col); setSortAsc(true); } };
  const Th = ({ col, label }) => <th className="sortable" onClick={() => doSort(col)}>{label}{sortCol === col ? (sortAsc ? " ↑" : " ↓") : ""}</th>;

  const filtered = results.filter((r) => {
    if (filters.trend !== "all" && r.trend !== filters.trend) return false;
    if (filters.rsiMin !== "" && r.rsi < +filters.rsiMin) return false;
    if (filters.rsiMax !== "" && r.rsi > +filters.rsiMax) return false;
    if (filters.fcDir === "bullish" && r.forecast_pct <= 0) return false;
    if (filters.fcDir === "bearish" && r.forecast_pct >= 0) return false;
    return true;
  }).sort((a, b) => {
    const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Stock Screener</h1>
      </div>

      {/* Config */}
      <div className="card form-card" style={{ marginBottom: 16 }}>
        <h3>Screener Setup</h3>
        <div className="add-form" style={{ flexWrap: "wrap", gap: 10 }}>
          <select value={universe} onChange={(e) => setUniverse(e.target.value)}>
            <option value="nifty">Nifty 50 + Global</option>
            <option value="watchlist">My Watchlist</option>
            <option value="custom">Custom Symbols</option>
          </select>
          {universe === "custom" && (
            <input placeholder="INFY.NS, TCS.NS, AAPL…" value={customSyms} onChange={(e) => setCustomSyms(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
          )}
          <button className="btn" onClick={run} disabled={loading}>{loading ? "Scanning…" : "▶ Run Screener"}</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 10 }}>Filters</h3>
        <div className="tools" style={{ flexWrap: "wrap", gap: 10 }}>
          <label>Trend
            <select value={filters.trend} onChange={(e) => setFilters({ ...filters, trend: e.target.value })} style={{ marginLeft: 6 }}>
              <option value="all">All</option>
              <option value="uptrend">Uptrend</option>
              <option value="downtrend">Downtrend</option>
              <option value="sideways">Sideways</option>
            </select>
          </label>
          <label>RSI Min <input type="number" style={{ width: 70, marginLeft: 6 }} value={filters.rsiMin} onChange={(e) => setFilters({ ...filters, rsiMin: e.target.value })} placeholder="0" /></label>
          <label>RSI Max <input type="number" style={{ width: 70, marginLeft: 6 }} value={filters.rsiMax} onChange={(e) => setFilters({ ...filters, rsiMax: e.target.value })} placeholder="100" /></label>
          <label>Forecast
            <select value={filters.fcDir} onChange={(e) => setFilters({ ...filters, fcDir: e.target.value })} style={{ marginLeft: 6 }}>
              <option value="all">All</option>
              <option value="bullish">Bullish (+)</option>
              <option value="bearish">Bearish (−)</option>
            </select>
          </label>
          <button className="ghost xs" onClick={() => setFilters({ trend: "all", rsiMin: "", rsiMax: "", fcDir: "all" })}>Reset</button>
        </div>
      </div>

      {loading && <div className="mute" style={{ padding: 16 }}>Scanning {universe === "watchlist" ? "watchlist" : universe === "custom" ? "custom symbols" : "30+ symbols"} — this may take 15–30 seconds…</div>}

      {!loading && ran && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Results — {filtered.length} stocks</h3>
            <span className="mute" style={{ fontSize: 12 }}>Click any row to open in Terminal</span>
          </div>
          {filtered.length === 0 ? (
            <div className="mute" style={{ padding: 20, textAlign: "center" }}>No stocks match the current filters.</div>
          ) : (
            <div className="overview-table-wrap">
              <table className="overview-table">
                <thead>
                  <tr>
                    <Th col="symbol" label="Symbol" />
                    <Th col="last" label="Price" />
                    <Th col="change_pct" label="Day %" />
                    <Th col="return_1m" label="1M %" />
                    <Th col="trend" label="Trend" />
                    <Th col="rsi" label="RSI" />
                    <Th col="forecast_pct" label="10d Forecast" />
                    <Th col="support" label="Support" />
                    <Th col="resistance" label="Resistance" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.symbol} className="overview-row" onClick={() => onNavigate("terminal", r.symbol)}>
                      <td><b>{r.symbol}</b></td>
                      <td className="num">{r.last}</td>
                      <td className={`num ${r.change_pct >= 0 ? "up" : "down"}`}>{r.change_pct > 0 ? "+" : ""}{r.change_pct}%</td>
                      <td className={`num ${r.return_1m >= 0 ? "up" : "down"}`}>{r.return_1m > 0 ? "+" : ""}{r.return_1m}%</td>
                      <td><span className={`trend-pill ${r.trend}`}>{r.trend}</span></td>
                      <td className={`num ${r.rsi > 70 ? "down" : r.rsi < 30 ? "up" : ""}`}>{r.rsi}</td>
                      <td className={`num ${r.forecast_pct >= 0 ? "up" : "down"}`}>{r.forecast_pct > 0 ? "+" : ""}{r.forecast_pct}%</td>
                      <td className="num up">{r.support ? r.support.toFixed(2) : "—"}</td>
                      <td className="num down">{r.resistance ? r.resistance.toFixed(2) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
