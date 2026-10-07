import { useState } from "react";

const DEF_WL = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "^NSEI", "AAPL", "BTC-USD"];
const PERIODS = ["3mo", "6mo", "1y", "2y", "5y"];

export default function Settings({ user, wl, setWl, prefs, setPrefs, onLogout }) {
  const [saved, setSaved] = useState(false);
  const [groqStatus, setGroqStatus] = useState(null);

  const save = (updates) => {
    setPrefs((p) => ({ ...p, ...updates }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetWl = () => {
    if (confirm("Reset watchlist to defaults?")) setWl(DEF_WL);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        {saved && <span className="badge" style={{ background: "#1a3a2a", color: "var(--up)" }}>✓ Saved</span>}
      </div>

      {/* Account */}
      <div className="card settings-card">
        <h3>Account</h3>
        <div className="settings-row">
          <span className="settings-label">Username</span>
          <span>{user.username}</span>
        </div>
        <div className="settings-row">
          <span className="settings-label">Role</span>
          <span className="badge">{user.role}</span>
        </div>
        <div className="settings-row">
          <span className="settings-label">Session</span>
          <button className="ghost danger" onClick={onLogout}>Sign out</button>
        </div>
      </div>

      {/* Preferences */}
      <div className="card settings-card">
        <h3>Preferences</h3>
        <div className="settings-row">
          <span className="settings-label">Default Chart Period</span>
          <div style={{ display: "flex", gap: 6 }}>
            {PERIODS.map((p) => (
              <button key={p} className={"ghost" + (prefs.defaultPeriod === p ? " on" : "")} onClick={() => save({ defaultPeriod: p })}>{p}</button>
            ))}
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-label">Default Indicators</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[["sma20", "SMA 20"], ["sma50", "SMA 50"], ["bb", "Bollinger"], ["forecast", "AI Forecast"]].map(([k, l]) => (
              <button key={k} className={"ghost" + (prefs.indicators?.[k] ? " on" : "")}
                onClick={() => save({ indicators: { ...prefs.indicators, [k]: !prefs.indicators?.[k] } })}>{l}</button>
            ))}
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-label">Watchlist</span>
          <button className="ghost danger" onClick={resetWl}>Reset to defaults</button>
        </div>
      </div>

      {/* API Status */}
      <div className="card settings-card">
        <h3>AI Provider Status</h3>
        <div className="settings-row">
          <span className="settings-label">Groq API</span>
          <span className="mute" style={{ fontSize: 13 }}>
            Configured server-side via <code>GROQ_API_KEY</code> in <code>.env</code>
          </span>
        </div>
        <div className="settings-row">
          <span className="settings-label">Anthropic API</span>
          <span className="mute" style={{ fontSize: 13 }}>
            Configured server-side via <code>ANTHROPIC_API_KEY</code> in <code>.env</code>
          </span>
        </div>
        <div className="settings-row">
          <span className="settings-label">Forecasting</span>
          <span className="mute" style={{ fontSize: 13 }}>
            Uses Chronos-Bolt if PyTorch is installed, else statistical fallback
          </span>
        </div>
        <div className="settings-row">
          <span className="settings-label">Sentiment</span>
          <span className="mute" style={{ fontSize: 13 }}>
            Uses FinBERT if Transformers installed, else keyword scoring
          </span>
        </div>
      </div>

      {/* About */}
      <div className="card settings-card">
        <h3>About Signal Desk</h3>
        <div className="settings-row"><span className="settings-label">Version</span><span>2.0</span></div>
        <div className="settings-row"><span className="settings-label">Backend</span><span>FastAPI + yfinance</span></div>
        <div className="settings-row"><span className="settings-label">Frontend</span><span>React 18 + Vite + lightweight-charts</span></div>
        <p className="note" style={{ marginTop: 14 }}>
          For research and education only. Not investment advice. Forecasts are uncertain and past backtests do not predict future results.
        </p>
      </div>
    </div>
  );
}
