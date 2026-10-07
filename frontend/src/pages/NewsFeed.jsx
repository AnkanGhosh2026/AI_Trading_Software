import { useEffect, useState } from "react";
import { api } from "../api.js";

function timeAgo(pub) {
  if (!pub) return "";
  const d = isNaN(pub) ? new Date(pub) : new Date(Number(pub) * 1000);
  if (isNaN(d)) return "";
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ScoreBadge({ score }) {
  const cls = score > 0 ? "up" : score < 0 ? "down" : "mute";
  const label = score > 0 ? "Positive" : score < 0 ? "Negative" : "Neutral";
  return <span className={`news-badge ${cls}`}>{label}</span>;
}

export default function NewsFeed({ wl }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [lastFetch, setLastFetch] = useState(null);

  const fetch = () => {
    setLoading(true);
    const syms = wl.slice(0, 10).join(",");
    api(`/api/news?symbols=${syms}`).then((d) => { setNews(d); setLastFetch(new Date()); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { if (wl.length) fetch(); }, [wl.join(",")]);

  const symbols = ["ALL", ...new Set(news.map((n) => n.symbol))];
  const filtered = filter === "ALL" ? news : news.filter((n) => n.symbol === filter);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">News Feed</h1>
          {lastFetch && <span className="page-subtitle">Last updated: {lastFetch.toLocaleTimeString()}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div className="filter-tabs">
            {symbols.map((s) => <button key={s} className={"ghost" + (filter === s ? " on" : "")} onClick={() => setFilter(s)}>{s}</button>)}
          </div>
          <button className="btn" onClick={fetch} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button>
        </div>
      </div>

      {loading && <div className="mute" style={{ padding: 20 }}>Fetching headlines…</div>}

      {!loading && filtered.length === 0 && (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📰</div>
          <div className="mute">No news found for your watchlist. Try adding more symbols.</div>
        </div>
      )}

      <div className="news-list">
        {filtered.map((item, i) => (
          <a key={i} href={item.url || "#"} target="_blank" rel="noopener noreferrer" className="news-card">
            <div className="news-card-top">
              <span className="news-sym-tag">{item.symbol}</span>
              <ScoreBadge score={item.score} />
              <span className="mute news-time">{timeAgo(item.published)}</span>
              {item.source && <span className="mute news-src">· {item.source}</span>}
            </div>
            <div className="news-title">{item.title}</div>
            {item.url && <div className="news-link-hint">Read full article →</div>}
          </a>
        ))}
      </div>
    </div>
  );
}
