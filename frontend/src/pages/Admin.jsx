import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Admin({ me }) {
  const [users, setUsers] = useState([]), [err, setErr] = useState("");
  const load = () => api("/api/admin/users").then(setUsers).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const del = async (u) => {
    if (!confirm(`Delete ${u.username}? This permanently removes the account and signs them out.`)) return;
    try { await api(`/api/admin/users/${u.id}`, null, "DELETE"); load(); } catch (e) { setErr(e.message); }
  };
  return (
    <div className="page-content">
      <div className="page-header"><h1 className="page-title">Admin — User Accounts</h1></div>
      <div className="card">
        <h3>User accounts ({users.length})</h3>
        {err && <div className="err">{err}</div>}
        <table><thead><tr><th>Username</th><th>Role</th><th>Created</th><th></th></tr></thead><tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}{u.id === me.id && <span className="mute"> (you)</span>}</td>
              <td>{u.role === "admin" ? <span className="badge">admin</span> : "user"}</td>
              <td className="mute">{u.created}</td>
              <td style={{ textAlign: "right" }}>{u.id !== me.id && <button className="ghost danger" onClick={() => del(u)}>Delete account</button>}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}
