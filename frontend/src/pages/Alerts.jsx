import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

const STORE_KEY = "price_alerts";

export default function Alerts({ wl }) {
  const [alerts, setAlerts] = useState(() => JSON.parse(localStorage.getItem(STORE_KEY) || "[]"));
  const [form, setForm] = useState({ symbol: "", condition: "above", price: "" });
  const [quotes, setQuotes] = useState({});
  const [triggered, setTriggered] = useState([]);
  const [notification, setNotification] = useState(null);
  const notifTimer = useRef(null);

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(alerts)); }, [alerts]);

  // Poll quotes every 60s and check conditions
  useEffect(() => {
    const check = () => {
      const syms = [...new Set([...alerts.map((a) => a.symbol), ...wl])].join(",");
      if (!syms) return;
      api(`/api/quotes?symbols=${syms}`).then((q) => {
        setQuotes(q);
        setAlerts((prev) => {
          const updated = prev.map((a) => {
            if (a.triggered) return a;
            const ltp = q[a.symbol]?.last;
            if (ltp == null) return a;
            const hit = a.condition === "above" ? ltp >= a.price : ltp <= a.price;
            if (hit) {
              const msg = `🔔 ${a.symbol} hit ${a.condition} ₹${a.price} — now at ${ltp}`;
              setNotification(msg);
              clearTimeout(notifTimer.current);
              notifTimer.current = setTimeout(() => setNotification(null), 6000);
              return { ...a, triggered: true, triggeredAt: ltp };
            }
            return a;
          });
          return updated;
        });
      }).catch(() => {});
    };
    check();
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
  }, [alerts.map((a) => a.symbol).join(","), wl.join(",")]);

  const addAlert = (e) => {
    e.preventDefault();
    if (!form.symbol || !form.price || isNaN(form.price) || +form.price <= 0) return;
    setAlerts((prev) => [...prev, { ...form, symbol: form.symbol.toUpperCase(), price: +form.price, id: Date.now(), triggered: false }]);
    setForm({ symbol: "", condition: "above", price: "" });
  };

  const removeAlert = (id) => setAlerts((prev) => prev.filter((a) => a.id !== id));
  const clearTriggered = () => setAlerts((prev) => prev.filter((a) => !a.triggered));

  const active = alerts.filter((a) => !a.triggered);
  const done = alerts.filter((a) => a.triggered);

  return (
    <div className="page-content">
      {notification && (
        <div className="alert-notif" onClick={() => setNotification(null)}>
          {notification} <span style={{ opacity: 0.6, fontSize: 12 }}>click to dismiss</span>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Price Alerts</h1>
      </div>

      {/* Add Alert Form */}
      <div className="card form-card">
        <h3>Create Alert</h3>
        <form className="add-form" onSubmit={addAlert}>
          <input list="alert-syms" placeholder="Symbol (e.g. TCS.NS)" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
          <datalist id="alert-syms">{wl.map((s) => <option key={s} value={s} />)}</datalist>
          <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
            <option value="above">Price goes above</option>
            <option value="below">Price goes below</option>
          </select>
          <input type="number" placeholder="Target price" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <button className="btn" type="submit">Set Alert</button>
        </form>
      </div>

      {/* Active Alerts */}
      <section className="dash-section">
        <h2 className="section-title">Active Alerts ({active.length})</h2>
        {active.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔕</div>
            <div className="mute">No active alerts. Set one above.</div>
          </div>
        ) : (
          <div className="overview-table-wrap">
            <table className="overview-table">
              <thead><tr><th>Symbol</th><th>Condition</th><th>Target</th><th>Current Price</th><th>Distance</th><th></th></tr></thead>
              <tbody>
                {active.map((a) => {
                  const ltp = quotes[a.symbol]?.last;
                  const dist = ltp ? ((a.price - ltp) / ltp * 100).toFixed(2) : null;
                  return (
                    <tr key={a.id}>
                      <td><b>{a.symbol}</b></td>
                      <td><span className={`trend-pill ${a.condition === "above" ? "uptrend" : "downtrend"}`}>{a.condition}</span></td>
                      <td className="num">₹{a.price}</td>
                      <td className="num">{ltp ? `₹${ltp}` : <span className="mute">—</span>}</td>
                      <td className={`num ${dist > 0 ? "" : "mute"}`}>{dist ? `${dist > 0 ? "+" : ""}${dist}%` : "—"}</td>
                      <td><button className="ghost danger xs" onClick={() => removeAlert(a.id)}>Remove</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Triggered Alerts */}
      {done.length > 0 && (
        <section className="dash-section">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 className="section-title">✅ Triggered ({done.length})</h2>
            <button className="ghost xs" onClick={clearTriggered}>Clear all</button>
          </div>
          <div className="overview-table-wrap">
            <table className="overview-table">
              <thead><tr><th>Symbol</th><th>Condition</th><th>Target</th><th>Triggered At</th></tr></thead>
              <tbody>
                {done.map((a) => (
                  <tr key={a.id} style={{ opacity: 0.65 }}>
                    <td><b>{a.symbol}</b></td>
                    <td>{a.condition}</td>
                    <td className="num">₹{a.price}</td>
                    <td className="num up">{a.triggeredAt ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
