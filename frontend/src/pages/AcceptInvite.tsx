// frontend/src/pages/AcceptInvite.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

import { acceptInvite, setAuthToken, validateInvite, type Role } from "../api";

type InviteInfo = {
  email: string;
  role: Role;
  companyName: string | null;
  expiresAt: string;
};

function getQueryParam(key: string) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

export default function AcceptInvite() {
  const inviteToken = useMemo(() => getQueryParam("token") || "", []);
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>("");

  const { logout, isAuthenticated } = useAuth0();

  // ✅ prevent your app's Auth0 auto-sync from running while we accept an invite
  useEffect(() => {
    sessionStorage.setItem("skip_sso_sync", "1");
    return () => {
      // once we leave this page, allow SSO sync again
      sessionStorage.removeItem("skip_sso_sync");
    };
  }, []);

  // ✅ validate invite on load
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setError("");

        if (!inviteToken) {
          setError("Missing invite token in the URL.");
          return;
        }

        const data = await validateInvite(inviteToken);
        if (!mounted) return;

        const inv = data.invite as InviteInfo;
        setInvite(inv);

        const suggested = (inv.email || "").split("@")[0];
        setName(suggested || "");
      } catch (e: any) {
        if (!mounted) return;
        setError(
          e?.response?.data?.error || e?.message || "Invite validation failed."
        );
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [inviteToken]);

  const handleAccept = async () => {
    try {
      setLoading(true);
      setError("");

      if (!inviteToken) {
        setError("Missing invite token.");
        return;
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Please enter your name.");
        return;
      }

      // ✅ If currently Auth0-authenticated, logout first and come back here
      if (isAuthenticated) {
        await logout({
          logoutParams: {
            returnTo: `${window.location.origin}/accept-invite?token=${encodeURIComponent(
              inviteToken
            )}`,
          },
        });
        return;
      }

      const accepted = await acceptInvite({
        token: inviteToken,
        name: trimmedName,
      });

      // ✅ store like your app expects
      localStorage.setItem("token", accepted.token);
      localStorage.setItem("user", JSON.stringify(accepted.user));

      // ✅ attach token to axios so future API calls work immediately
      setAuthToken(accepted.token);

      // ✅ done — re-enable SSO sync and go home
      sessionStorage.removeItem("skip_sso_sync");

      // IMPORTANT: full reload so useAppController restores session from localStorage
      window.location.replace("/");
    } catch (e: any) {
      setError(
        e?.response?.data?.error || e?.message || "Invite accept failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, #020617 0, #000000 50%, #020617 100%)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#e5e7eb",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "rgba(2,6,23,0.85)",
          border: "1px solid #1f2937",
          borderRadius: 14,
          padding: "1.25rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>
          Accept Invite
        </div>
        <div style={{ color: "#9ca3af", marginTop: 6, fontSize: "0.9rem" }}>
          Join Relationship OS using your invite link.
        </div>

        <div style={{ marginTop: 14 }}>
          {loading && <div style={{ color: "#9ca3af" }}>Loading invite…</div>}

          {!loading && error && (
            <div
              style={{
                marginTop: 10,
                background: "#7f1d1d",
                color: "#fecaca",
                padding: "0.6rem 0.75rem",
                borderRadius: 10,
                fontSize: "0.9rem",
              }}
            >
              {error}
            </div>
          )}

          {!loading && invite && (
            <>
              <div
                style={{
                  marginTop: 12,
                  padding: "0.75rem",
                  borderRadius: 12,
                  background: "#0b1220",
                  border: "1px solid #1f2937",
                }}
              >
                <div style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
                  Invited email
                </div>
                <div style={{ fontWeight: 700 }}>{invite.email}</div>

                <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                      Role
                    </div>
                    <div style={{ fontWeight: 700 }}>{invite.role}</div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                      Company
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {invite.companyName || "—"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: "0.85rem",
                    color: "#9ca3af",
                  }}
                >
                  Expires: {new Date(invite.expiresAt).toLocaleString()}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                  Your name (editable)
                </div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "0.65rem 0.75rem",
                    borderRadius: 12,
                    border: "1px solid #334155",
                    background: "#020617",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
              </div>

              <button
                onClick={handleAccept}
                disabled={loading}
                style={{
                  marginTop: 14,
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: 12,
                  border: "1px solid #334155",
                  background: "#111827",
                  color: "#e5e7eb",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 800,
                }}
              >
                {loading ? "Accepting..." : "Accept Invite"}
              </button>

              <button
                onClick={() => window.location.replace("/")}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "0.65rem",
                  borderRadius: 12,
                  border: "1px solid #334155",
                  background: "#020617",
                  color: "#9ca3af",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Back to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}