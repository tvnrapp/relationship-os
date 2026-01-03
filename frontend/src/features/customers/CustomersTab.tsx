// frontend/src/features/customers/CustomersTab.tsx
import { useEffect, useMemo, useState } from "react";
import {
  createInvite,
  listPendingInvites,
  type Role,
  type Invite,
} from "../../api";
import { thStyle, tdStyle } from "../../styles";

interface CustomersTabProps {
  isSeller: boolean;
  sellerCustomers: any[] | null;
}

type Banner =
  | { kind: "success" | "error" | "info"; message: string }
  | null;

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() < Date.now();
}

export default function CustomersTab({
  isSeller,
  sellerCustomers,
}: CustomersTabProps) {
  // ----- INVITES UI -----
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("CUSTOMER");
  const [inviteCompany, setInviteCompany] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteBanner, setInviteBanner] = useState<Banner>(null);

  const [createdAcceptUrl, setCreatedAcceptUrl] = useState<string>("");
  const [createdToken, setCreatedToken] = useState<string>("");

  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const pendingSorted = useMemo(() => {
    return [...pendingInvites].sort((a, b) => {
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return bt - at;
    });
  }, [pendingInvites]);

  async function refreshPending() {
    try {
      setPendingLoading(true);
      const res = await listPendingInvites();
      setPendingInvites(res.invites || []);
    } catch (e: any) {
      setInviteBanner({
        kind: "error",
        message:
          e?.response?.data?.error ||
          e?.message ||
          "Failed to load pending invites.",
      });
    } finally {
      setPendingLoading(false);
    }
  }

  useEffect(() => {
    if (!isSeller) return;
    refreshPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeller]);

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteBanner(null);
    setCreatedAcceptUrl("");
    setCreatedToken("");

    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setInviteBanner({ kind: "error", message: "Enter an email address." });
      return;
    }
    if (!email.includes("@")) {
      setInviteBanner({ kind: "error", message: "Enter a valid email." });
      return;
    }

    try {
      setInviteLoading(true);

      const res = await createInvite({
        email,
        role: inviteRole,
        ...(inviteCompany.trim()
          ? { companyName: inviteCompany.trim() }
          : {}),
      });

      setCreatedAcceptUrl(res.acceptUrl);
      setCreatedToken(res.token);

      setInviteBanner({
        kind: "success",
        message: "Invite created. Copy the Accept Link and send it.",
      });

      setInviteEmail("");
      setInviteCompany("");

      await refreshPending();
    } catch (e: any) {
      setInviteBanner({
        kind: "error",
        message:
          e?.response?.data?.error || e?.message || "Failed to create invite.",
      });
    } finally {
      setInviteLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setInviteBanner({ kind: "success", message: "Copied to clipboard ✅" });
    } catch {
      // fallback: prompt select
      window.prompt("Copy this:", text);
    }
  }

  if (!isSeller) {
    return <p>This section is only for sellers.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
        Customers & Invites
      </h2>

      {/* INVITE CREATOR */}
      <div
        style={{
          border: "1px solid #1f2937",
          background: "rgba(2,6,23,0.6)",
          borderRadius: 14,
          padding: "1rem",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Invite a user</div>
        <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
          Create an invite link for a new customer (or other role).
        </div>

        {inviteBanner && (
          <div
            style={{
              marginTop: 10,
              padding: "0.6rem 0.75rem",
              borderRadius: 12,
              fontSize: "0.9rem",
              border: "1px solid #334155",
              background:
                inviteBanner.kind === "success"
                  ? "rgba(16,185,129,0.15)"
                  : inviteBanner.kind === "error"
                  ? "rgba(239,68,68,0.15)"
                  : "rgba(59,130,246,0.12)",
              color:
                inviteBanner.kind === "success"
                  ? "#bbf7d0"
                  : inviteBanner.kind === "error"
                  ? "#fecaca"
                  : "#bfdbfe",
            }}
          >
            {inviteBanner.message}
          </div>
        )}

        <form
          onSubmit={handleCreateInvite}
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "1fr 180px 1fr 140px",
            gap: 10,
            alignItems: "end",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Email</div>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@email.com"
              style={{
                width: "100%",
                marginTop: 6,
                padding: "0.6rem 0.75rem",
                borderRadius: 12,
                border: "1px solid #334155",
                background: "#020617",
                color: "#e5e7eb",
                outline: "none",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Role</div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "0.6rem 0.75rem",
                borderRadius: 12,
                border: "1px solid #334155",
                background: "#020617",
                color: "#e5e7eb",
                outline: "none",
              }}
            >
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="SELLER">SELLER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
              Company (optional)
            </div>
            <input
              value={inviteCompany}
              onChange={(e) => setInviteCompany(e.target.value)}
              placeholder="Company name"
              style={{
                width: "100%",
                marginTop: 6,
                padding: "0.6rem 0.75rem",
                borderRadius: 12,
                border: "1px solid #334155",
                background: "#020617",
                color: "#e5e7eb",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={inviteLoading}
            style={{
              width: "100%",
              padding: "0.65rem 0.75rem",
              borderRadius: 12,
              border: "1px solid #334155",
              background: "#111827",
              color: "#e5e7eb",
              cursor: inviteLoading ? "not-allowed" : "pointer",
              fontWeight: 800,
            }}
          >
            {inviteLoading ? "Creating..." : "Create Invite"}
          </button>
        </form>

        {(createdAcceptUrl || createdToken) && (
          <div
            style={{
              marginTop: 12,
              padding: "0.75rem",
              borderRadius: 12,
              border: "1px solid #1f2937",
              background: "#0b1220",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
              Accept link (send this)
            </div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <input
                readOnly
                value={createdAcceptUrl}
                style={{
                  flex: 1,
                  padding: "0.6rem 0.75rem",
                  borderRadius: 12,
                  border: "1px solid #334155",
                  background: "#020617",
                  color: "#e5e7eb",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
              <button
                type="button"
                onClick={() => copyToClipboard(createdAcceptUrl)}
                style={{
                  padding: "0.6rem 0.75rem",
                  borderRadius: 12,
                  border: "1px solid #334155",
                  background: "#111827",
                  color: "#e5e7eb",
                  cursor: "pointer",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                Copy
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: "0.8rem", color: "#9ca3af" }}>
              Raw token (debug / API use)
            </div>
            <div style={{ marginTop: 6, display: "flex", gap: 10 }}>
              <input
                readOnly
                value={createdToken}
                style={{
                  flex: 1,
                  padding: "0.6rem 0.75rem",
                  borderRadius: 12,
                  border: "1px solid #334155",
                  background: "#020617",
                  color: "#e5e7eb",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
              <button
                type="button"
                onClick={() => copyToClipboard(createdToken)}
                style={{
                  padding: "0.6rem 0.75rem",
                  borderRadius: 12,
                  border: "1px solid #334155",
                  background: "#111827",
                  color: "#e5e7eb",
                  cursor: "pointer",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PENDING INVITES */}
      <div
        style={{
          border: "1px solid #1f2937",
          background: "rgba(2,6,23,0.6)",
          borderRadius: 14,
          padding: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 800 }}>Pending Invites</div>
            <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
              Shows unaccepted (and expired) invites.
            </div>
          </div>

          <button
            onClick={refreshPending}
            disabled={pendingLoading}
            style={{
              padding: "0.55rem 0.75rem",
              borderRadius: 12,
              border: "1px solid #334155",
              background: "#111827",
              color: "#e5e7eb",
              cursor: pendingLoading ? "not-allowed" : "pointer",
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {pendingLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Expires</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingSorted.length === 0 ? (
                <tr>
                  <td style={tdStyle} colSpan={5}>
                    No pending invites.
                  </td>
                </tr>
              ) : (
                pendingSorted.map((inv) => {
                  const expired = isExpired(inv.expiresAt);
                  const status = expired ? "EXPIRED" : "PENDING";
                  return (
                    <tr key={inv.id}>
                      <td style={tdStyle}>{inv.email}</td>
                      <td style={tdStyle}>{inv.role}</td>
                      <td style={tdStyle}>{inv.companyName || "-"}</td>
                      <td style={tdStyle}>
                        {new Date(inv.expiresAt).toLocaleString()}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.5rem",
                            borderRadius: 999,
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            border: "1px solid #334155",
                            background: expired
                              ? "rgba(239,68,68,0.15)"
                              : "rgba(59,130,246,0.15)",
                            color: expired ? "#fecaca" : "#bfdbfe",
                          }}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMERS LIST */}
      <div
        style={{
          border: "1px solid #1f2937",
          background: "rgba(2,6,23,0.6)",
          borderRadius: 14,
          padding: "1rem",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 10 }}>My Customers</div>

        {!sellerCustomers || sellerCustomers.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No customers found yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Company</th>
                  <th style={thStyle}>Created</th>
                </tr>
              </thead>
              <tbody>
                {sellerCustomers.map((c) => (
                  <tr key={c.id}>
                    <td style={tdStyle}>{c.id}</td>
                    <td style={tdStyle}>{c.name || "-"}</td>
                    <td style={tdStyle}>{c.email}</td>
                    <td style={tdStyle}>{c.companyName || "-"}</td>
                    <td style={tdStyle}>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}