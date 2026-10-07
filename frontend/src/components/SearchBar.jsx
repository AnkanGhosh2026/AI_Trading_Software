import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

export default function SearchBar({ onSelect }) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const debounce = useRef(null);
  const wrapRef = useRef(null);

  const typeIcons = { EQUITY: "📈", ETF: "🗂️", MUTUALFUND: "💼", CRYPTOCURRENCY: "₿", INDEX: "📊", FUTURE: "⏩", CURRENCY: "💱" };

  useEffect(() => {
    clearTimeout(debounce.current);
    if (!input.trim()) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      try {
        const data = await api(`/api/search?q=${encodeURIComponent(input.trim())}`);
        setResults(data || []); setOpen(true); setCursor(-1);
      } catch { setResults([]); }
    }, 280);
  }, [input]);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const pick = (sym) => { onSelect(sym); setInput(""); setResults([]); setOpen(false); setCursor(-1); };

  const onKey = (e) => {
    if (!open || !results.length) { if (e.key === "Enter" && input.trim()) pick(input.trim().toUpperCase()); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (cursor >= 0) pick(results[cursor].symbol); else if (input.trim()) pick(input.trim().toUpperCase()); }
    else if (e.key === "Escape") { setOpen(false); setCursor(-1); }
  };

  return (
    <div ref={wrapRef} className="search-wrap">
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input className="search-input" placeholder="Search symbol or company… e.g. Infosys, AAPL"
          value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
          onFocus={() => { if (results.length) setOpen(true); }} autoComplete="off" spellCheck={false} />
        {input && <button className="search-clear" onClick={() => { setInput(""); setResults([]); setOpen(false); }} aria-label="Clear">×</button>}
      </div>
      {open && results.length > 0 && (
        <ul className="search-dropdown">
          {results.map((r, i) => (
            <li key={r.symbol} className={"search-item" + (i === cursor ? " active" : "")} onMouseDown={() => pick(r.symbol)} onMouseEnter={() => setCursor(i)}>
              <span className="search-item-icon">{typeIcons[r.type] || "📋"}</span>
              <span className="search-item-body">
                <span className="search-item-sym">{r.symbol}</span>
                <span className="search-item-name">{r.name}</span>
              </span>
              {r.exchange && <span className="search-item-exch">{r.exchange}</span>}
            </li>
          ))}
        </ul>
      )}
      {open && results.length === 0 && input.trim().length > 0 && (
        <div className="search-empty">No results — press Enter to load <b>{input.trim().toUpperCase()}</b> directly</div>
      )}
    </div>
  );
}
