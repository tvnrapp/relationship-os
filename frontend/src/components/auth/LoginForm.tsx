// src/components/auth/LoginForm.tsx
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
  const {
    loginWithRedirect,
    isAuthenticated,
    user,
    logout,
    isLoading: auth0Loading,
  } = useAuth0();

  useEffect(() => {
    console.log("Auth0 status:", {
      isAuthenticated,
      user,
      auth0Loading,
    });

    if (isAuthenticated && user?.email && email !== user.email) {
      onEmailChange(user.email);
    }
  }, [isAuthenticated, user, auth0Loading, email, onEmailChange]);

  const handleSsoClick = async () => {
    try {
      await loginWithRedirect();
    } catch (err) {
      console.error("Auth0 login failed", err);
    }
  };

  const handleLogoutSso = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
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
      <h1
        style={{
          fontSize: "1.4rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
        }}
      >
        Log in
      </h1>
      <p
        style={{
          fontSize: "0.85rem",
          color: "#9ca3af",
          marginBottom: "1.25rem",
        }}
      >
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
          style={{
            ...primaryButtonStyle,
            width: "100%",
            marginBottom: "0.5rem",
          }}
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
        <div
          style={{
            flex: 1,
            height: 1,
            background: "rgba(148,163,184,0.3)",
          }}
        />
        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>or</span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: "rgba(148,163,184,0.3)",
          }}
        />
      </div>

      {!isAuthenticated ? (
        <button
          type="button"
          onClick={handleSsoClick}
          disabled={auth0Loading}
          style={{
            ...secondaryButtonStyle,
            width: "100%",
            padding: "0.55rem 0.75rem",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
          }}
        >
          {auth0Loading ? "Redirecting..." : "Continue with Single Sign-On"}
        </button>
      ) : (
        <div
          style={{
            marginTop: "0.5rem",
            fontSize: "0.8rem",
            color: "#9ca3af",
          }}
        >
          <div style={{ marginBottom: "0.25rem" }}>
            Signed in via SSO as{" "}
            <span style={{ color: "#e5e7eb" }}>{user?.email}</span>
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