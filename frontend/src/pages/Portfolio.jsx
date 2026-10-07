import { useState, useEffect } from "react";
import { api } from "../api.js";

const EMPTY = { symbol: "", qty: "", avgCost: "", buyDate: new Date().toISOString().slice(0, 10) };

function PieChart({ slices }) {
  let cumulative = 0;
  const total = slices.reduce((a, b) => a + b.value, 0);
  if (total === 0) return null;
  const colors = ["#f2b84b", "#34d399", "#60a5fa", "#c084fc", "#f87171", "#38bdf8", "#fb923c", "#a78bfa"];
  const paths = slices.map((s, i) => {
    const pct = s.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = 60 + 55 * Math.cos(startAngle), y1 = 60 + 55 * Math.sin(startAngle);
    const x2 = 60 + 55 * Math.cos(endAngle), y2 = 60 + 55 * Math.sin(endAngle);
    const large = pct > 0.5 ? 1 : 0;
    return <path key={i} d={`M60,60 L${x1},${y1} A55,55 0 ${large},1 ${x2},${y2} Z`} fill={colors[i % colors.length]} opacity="0.85" />;
  });
  return (
    <div className="pie-wrap">
      <svg width="120" height="120" viewBox="0 0 120 120">{paths}<circle cx="60" cy="60" r="28" fill="#121820" /></svg>
      <div className="pie-legend">
        {slices.map((s, i) => (
          <div key={i} className="pie-legend-item">
            <span className="pie-dot" style={{ background: colors[i % colors.length] }} />
            <span>{s.label}</span>
            <span className="mute">{((s.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Portfolio({ onNavigate }) {
  const STORE_KEY = "portfolio_positions";
  const [positions, setPositions] = useState(() => JSON.parse(localStorage.getItem(STORE_KEY) || "[]"));
  const [quotes, setQuotes] = useState({});
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState("");
  const [sortCol, setSortCol] = useState("symbol");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(positions)); }, [positions]);

  useEffect(() => {
    if (!positions.length) return;
    const syms = [...new Set(positions.map((p) => p.symbol))].join(",");
    api(`/api/quotes?symbols=${syms}`).then(setQuotes).catch(() => {});
  }, [positions.map((p) => p.symbol).join(",")]);

  const add = (e) => {
    e.preventDefault(); setErr("");
    if (!form.symbol || !form.qty || !form.avgCost) return setErr("All fields required.");
    if (isNaN(form.qty) || isNaN(form.avgCost) || +form.qty <= 0 || +form.avgCost <= 0) return setErr("Qty and price must be positive numbers.");
    setPositions((prev) => [...prev, { ...form, symbol: form.symbol.toUpperCase(), qty: +form.qty, avgCost: +form.avgCost, id: Date.now() }]);
    setForm(EMPTY); setShowForm(false);
  };

  const remove = (id) => setPositions((p) => p.filter((x) => x.id !== id));

  const enriched = positions.map((p) => {
    const q = quotes[p.symbol];
    const ltp = q ? q.last : null;
    const value = ltp ? ltp * p.qty : p.avgCost * p.qty;
    const pnl = ltp ? (ltp - p.avgCost) * p.qty : 0;
    const pnlPct = ltp ? ((ltp / p.avgCost - 1) * 100) : 0;
    return { ...p, ltp, value, pnl, pnlPct };
  });

  const totalValue = enriched.reduce((a, b) => a + b.value, 0);
  const totalPnl = enriched.reduce((a, b) => a + b.pnl, 0);
  const totalInvested = enriched.reduce((a, b) => a + b.avgCost * b.qty, 0);
  const totalPnlPct = totalInvested ? (totalPnl / totalInvested) * 100 : 0;

  const doSort = (col) => { if (sortCol === col) setSortAsc(!sortAsc); else { setSortCol(col); setSortAsc(true); } };
  const sorted = [...enriched].sort((a, b) => {
    const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });
  const Th = ({ col, label }) => <th className="sortable" onClick={() => doSort(col)}>{label}{sortCol === col ? (sortAsc ? " ↑" : " ↓") : ""}</th>;

  const pieSlices = enriched.filter((p) => p.value > 0).map((p) => ({ label: p.symbol, value: p.value }));

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Portfolio</h1>
        <button className="btn" onClick={() => setShowForm(!showForm)}>+ Add Position</button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>Add Position</h3>
          <form className="add-form" onSubmit={add}>
            <input placeholder="Symbol (e.g. INFY.NS)" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
            <input placeholder="Quantity" type="number" min="0" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
            <input placeholder="Avg Cost (per share)" type="number" min="0" step="0.01" value={form.avgCost} onChange={(e) => setForm({ ...form, avgCost: e.target.value })} />
            <input type="date" value={form.buyDate} onChange={(e) => setForm({ ...form, buyDate: e.target.value })} />
            <button className="btn" type="submit">Add</button>
            <button type="button" className="ghost" onClick={() => { setShowForm(false); setErr(""); }}>Cancel</button>
          </form>
          {err && <div className="err">{err}</div>}
        </div>
      )}

      {/* Summary KPIs */}
      <div className="kpis" style={{ marginBottom: 20 }}>
        <div className="card kpi"><small>Total Value</small><b className="num">₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b></div>
        <div className="card kpi"><small>Invested</small><b className="num">₹{totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b></div>
        <div className="card kpi"><small>Unrealized P&L</small><b className={`num ${totalPnl >= 0 ? "up" : "down"}`}>{totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b></div>
        <div className="card kpi"><small>Return %</small><b className={`num ${totalPnlPct >= 0 ? "up" : "down"}`}>{totalPnlPct.toFixed(2)}%</b></div>
        <div className="card kpi"><small>Positions</small><b className="num">{positions.length}</b></div>
      </div>

      <div className="dash-two-col" style={{ alignItems: "start" }}>
        {/* Allocation Pie */}
        {pieSlices.length > 0 && (
          <div className="card">
            <h3>Allocation</h3>
            <PieChart slices={pieSlices} />
          </div>
        )}

        {/* Holdings Table */}
        <div className="card" style={{ flex: 2 }}>
          <h3>Holdings</h3>
          {positions.length === 0 ? (
            <div className="mute" style={{ padding: "20px 0" }}>No positions yet. Click "Add Position" to start tracking.</div>
          ) : (
            <div className="overview-table-wrap">
              <table className="overview-table">
                <thead>
                  <tr>
                    <Th col="symbol" label="Symbol" />
                    <Th col="qty" label="Qty" />
                    <Th col="avgCost" label="Avg Cost" />
                    <Th col="ltp" label="LTP" />
                    <Th col="value" label="Value" />
                    <Th col="pnl" label="P&L" />
                    <Th col="pnlPct" label="P&L %" />
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p) => (
                    <tr key={p.id} className="overview-row" onClick={() => onNavigate("terminal", p.symbol)}>
                      <td><b>{p.symbol}</b><div className="mute" style={{ fontSize: 11 }}>{p.buyDate}</div></td>
                      <td className="num">{p.qty}</td>
                      <td className="num">{p.avgCost.toFixed(2)}</td>
                      <td className="num">{p.ltp != null ? p.ltp : <span className="mute">—</span>}</td>
                      <td className="num">{p.value.toFixed(2)}</td>
                      <td className={`num ${p.pnl >= 0 ? "up" : "down"}`}>{p.pnl >= 0 ? "+" : ""}{p.pnl.toFixed(2)}</td>
                      <td className={`num ${p.pnlPct >= 0 ? "up" : "down"}`}>{p.pnlPct.toFixed(2)}%</td>
                      <td><button className="x" style={{ opacity: 1, color: "var(--down)" }} onClick={(e) => { e.stopPropagation(); remove(p.id); }}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <p className="note" style={{ marginTop: 16 }}>Positions stored locally in your browser. For education only — not investment advice.</p>
    </div>
  );
}
