import { useEffect, useState } from "react";
import { api, token, setToken } from "./api.js";
import SearchBar from "./components/SearchBar.jsx";

// Pages
import Dashboard from "./pages/Dashboard.jsx";
import Terminal from "./pages/Terminal.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import NewsFeed from "./pages/NewsFeed.jsx";
import Alerts from "./pages/Alerts.jsx";
import Screener from "./pages/Screener.jsx";
import Settings from "./pages/Settings.jsx";
import Admin from "./pages/Admin.jsx";
import LandingPage from "./pages/LandingPage.jsx";

const DEF_WL = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "^NSEI", "AAPL", "BTC-USD"];

function Auth({ onAuth, onBack }) {
  const [mode, setMode] = useState("login"), [f, setF] = useState({ username: "", password: "" }), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const d = await api(`/api/auth/${mode}`, f);
      setToken(d.token);
      onAuth(d.user);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="auth">
      <button className="ghost auth-back" onClick={onBack}>&larr; Back</button>
      <form className="card auth-card-margin" onSubmit={submit}>
      <h1>Signal Desk</h1><div className="mute">{mode === "login" ? "Sign in to your trading workspace." : "Create your account. Passwords need 8+ characters."}</div>
      <input placeholder="Username" autoFocus value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
      <input type="password" placeholder="Password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      {err && <div className="err">{err}</div>}
      <button className="btn" disabled={busy}>{mode === "login" ? "Sign in" : "Create account"}</button>
      <button type="button" className="ghost" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>
        {mode === "login" ? "New here? Create an account" : "Have an account? Sign in"}</button>
    </form></div>
  );
}

function MainShell({ user }) {
  const [wl, setWl] = useState(() => JSON.parse(localStorage.getItem(`wl:${user.username}`) || "null") || DEF_WL);
  const [prefs, setPrefs] = useState(() => JSON.parse(localStorage.getItem(`prefs:${user.username}`) || "null") || { defaultPeriod: "1y", indicators: { sma20: true, sma50: true, bb: false, forecast: true } });
  const [view, setView] = useState("dashboard");
  const [activeSym, setActiveSym] = useState(wl[0] || "AAPL");

  useEffect(() => { localStorage.setItem(`wl:${user.username}`, JSON.stringify(wl)); }, [wl, user.username]);
  useEffect(() => { localStorage.setItem(`prefs:${user.username}`, JSON.stringify(prefs)); }, [prefs, user.username]);

  const nav = (v, sym) => {
    if (sym) setActiveSym(sym);
    setView(v);
  };

  const logout = () => { setToken(null); location.reload(); };

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> },
    { id: "terminal", label: "Terminal", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> },
    { id: "portfolio", label: "Portfolio", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> },
    { id: "news", label: "News Feed", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
    { id: "screener", label: "Screener", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg> },
    { id: "alerts", label: "Alerts", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> },
    { id: "settings", label: "Settings", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> },
  ];

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">Signal Desk</div>
        <div className="nav">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={view === item.id ? "on" : ""} onClick={() => nav(item.id)}>
              <span className="nav-icon">{item.icon}</span> <span className="nav-label">{item.label}</span>
            </button>
          ))}
          {user.role === "admin" && (
            <button className={view === "admin" ? "on" : ""} onClick={() => nav("admin")}>
              <span className="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></span> <span className="nav-label">Admin</span>
            </button>
          )}
        </div>
      </aside>
      
      <div className="body">
        <header className="bar">
          <SearchBar onSelect={(s) => nav("terminal", s)} />
          <div className="user">
            <span className="avatar">{user.username[0].toUpperCase()}</span>
            <span>{user.username}</span>
            {user.role === "admin" && <span className="badge">admin</span>}
          </div>
        </header>

        <main className="main-content">
          {view === "dashboard" && <Dashboard wl={wl} onNavigate={nav} />}
          {view === "terminal" && <Terminal sym={activeSym} setSym={setActiveSym} wl={wl} setWl={setWl} prefs={prefs} />}
          {view === "portfolio" && <Portfolio onNavigate={nav} />}
          {view === "news" && <NewsFeed wl={wl} />}
          {view === "screener" && <Screener wl={wl} onNavigate={nav} />}
          {view === "alerts" && <Alerts wl={wl} />}
          {view === "settings" && <Settings user={user} wl={wl} setWl={setWl} prefs={prefs} setPrefs={setPrefs} onLogout={logout} />}
          {view === "admin" && <Admin me={user} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null), [ready, setReady] = useState(!token);
  const [showAuth, setShowAuth] = useState(false);
  useEffect(() => { if (token) api("/api/auth/me").then(setUser).catch(() => {}).finally(() => setReady(true)); }, []);
  if (!ready) return null;
  
  if (user) return <MainShell user={user} />;
  if (showAuth) return <Auth onAuth={setUser} onBack={() => setShowAuth(false)} />;
  return <LandingPage onLoginClick={() => setShowAuth(true)} />;
}
