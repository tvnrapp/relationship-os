import React, { useEffect } from "react";
import type { FormEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import type { Role } from "../../types";
import { inputStyle, primaryButtonStyle, secondaryButtonStyle } from "../../styles";

interface LoginFormProps {
  role: Role;
  email: string;
  password: string;
  error: string | null;
  loading: boolean;
  onRoleChange: (role: Role) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303C33.656 32.659 29.291 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.845 1.154 7.961 3.039l5.657-5.657C34.955 6.053 29.73 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 16.108 19.01 12 24 12c3.059 0 5.845 1.154 7.961 3.039l5.657-5.657C34.955 6.053 29.73 4 24 4c-7.682 0-14.35 4.327-17.694 10.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.181 0 10.336-1.984 14.071-5.719l-6.502-5.506C29.529 34.965 26.891 36 24 36c-5.27 0-9.623-3.316-11.29-7.949l-6.532 5.032C9.486 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303a11.99 11.99 0 0 1-3.734 5.775l.003-.002 6.502 5.506C37.8 39.1 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M16.365 1.43c0 1.14-.413 2.202-1.13 3.06-.755.9-1.984 1.6-3.116 1.51-.145-1.09.43-2.22 1.108-3.03.755-.9 2.06-1.57 3.138-1.54ZM20.5 17.4c-.54 1.25-.8 1.8-1.5 2.9-1 1.52-2.4 3.42-4.13 3.44-1.54.02-1.94-.99-4-.98-2.06.01-2.5 1-4.03.98-1.73-.02-3.05-1.74-4.05-3.26C.38 18.2-.77 13.4 1.07 10.2c1.3-2.25 3.35-3.56 5.28-3.56 1.97 0 3.21 1.06 4.85 1.06 1.6 0 2.58-1.07 4.83-1.07 1.72 0 3.54.93 4.83 2.54-4.23 2.32-3.54 8.34.64 10.23Z"
    />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#F25022" d="M2 2h9v9H2z" />
    <path fill="#7FBA00" d="M13 2h9v9h-9z" />
    <path fill="#00A4EF" d="M2 13h9v9H2z" />
    <path fill="#FFB900" d="M13 13h9v9h-9z" />
  </svg>
);

const LoginForm: React.FC<LoginFormProps> = ({
  role,
  email,
  password,
  error,
  loading,
  onRoleChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginFormProps) => {
  const { loginWithRedirect, isAuthenticated, user, logout, isLoading: auth0Loading } =
    useAuth0();

  useEffect(() => {
    if (isAuthenticated && user?.email && email !== user.email) {
      onEmailChange(user.email);
    }
  }, [isAuthenticated, user, email, onEmailChange]);

  const handleSso = async (connection: string) => {
    try {
      await loginWithRedirect({
        authorizationParams: { connection },
      });
    } catch (err) {
      console.error("Auth0 login failed", err);
    }
  };

  const handleLogoutSso = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const socialButtonStyle: React.CSSProperties = {
    ...secondaryButtonStyle,
    width: "100%",
    padding: "0.55rem 0.75rem",
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  };

  return (
    <div
      style={{
        width: 420,
        padding: "2rem 2.25rem",
        borderRadius: "1.25rem",
        background:
          "radial-gradient(circle at top, rgba(30,64,175,0.45), rgba(15,23,42,0.98))",
        boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
        border: "1px solid rgba(148,163,184,0.25)",
        color: "#e5e7eb",
      }}
    >
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Log in
      </h1>
      <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: "1.25rem" }}>
        Use your seller or customer credentials to access Relationship OS.
      </p>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              marginBottom: "0.3rem",
              fontWeight: 600,
            }}
          >
            Login as
          </label>
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value as Role)}
            style={inputStyle}
          >
            <option value="SELLER">Seller</option>
            <option value="CUSTOMER">Customer</option>
          </select>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              marginBottom: "0.3rem",
              fontWeight: 600,
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            style={inputStyle}
            autoComplete="email"
          />
        </div>

        <div style={{ marginBottom: "0.9rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              marginBottom: "0.3rem",
              fontWeight: 600,
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            style={inputStyle}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div
            style={{
              marginBottom: "0.75rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.6rem",
              background: "#7f1d1d",
              color: "#fecaca",
              fontSize: "0.8rem",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ ...primaryButtonStyle, width: "100%", marginBottom: "0.5rem" }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          margin: "0.75rem 0",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "rgba(148,163,184,0.3)" }} />
        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "rgba(148,163,184,0.3)" }} />
      </div>

      {!isAuthenticated ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => handleSso("google-oauth2")}
            disabled={auth0Loading}
            style={socialButtonStyle}
          >
            <GoogleIcon />
            {auth0Loading ? "Redirecting..." : "Continue with Google"}
          </button>

          <button
            type="button"
            onClick={() => handleSso("apple")}
            disabled={auth0Loading}
            style={socialButtonStyle}
          >
            <span style={{ display: "inline-flex", color: "#e5e7eb" }}>
              <AppleIcon />
            </span>
            {auth0Loading ? "Redirecting..." : "Continue with Apple"}
          </button>

          <button
            type="button"
            onClick={() => handleSso("microsoft")}
            disabled={auth0Loading}
            style={socialButtonStyle}
          >
            <MicrosoftIcon />
            {auth0Loading ? "Redirecting..." : "Continue with Microsoft"}
          </button>
        </div>
      ) : (
        <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#9ca3af" }}>
          <div style={{ marginBottom: "0.25rem" }}>
            Signed in via SSO as <span style={{ color: "#e5e7eb" }}>{user?.email}</span>
          </div>
          <button
            type="button"
            onClick={handleLogoutSso}
            style={{
              ...secondaryButtonStyle,
              width: "100%",
              padding: "0.4rem 0.6rem",
              fontSize: "0.78rem",
            }}
          >
            Log out of SSO
          </button>
        </div>
      )}
    </div>
  );
};

export default LoginForm;