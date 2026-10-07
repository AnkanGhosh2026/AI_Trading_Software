export let token = localStorage.getItem("token");

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}

const BASE_URL = import.meta.env.VITE_API_URL || "";

export async function api(url, body, method) {
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
  
  const r = await fetch(fullUrl, {
    method: method || (body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && token) { setToken(null); location.reload(); }
  if (!r.ok) throw new Error(d.detail || r.statusText);
  return d;
}
