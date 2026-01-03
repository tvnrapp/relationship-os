// frontend/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

// Load Auth0 environment variables
const domain = import.meta.env.VITE_AUTH0_DOMAIN as string | undefined;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string | undefined;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined;

// Debug warnings for missing env vars
if (!domain) console.warn("⚠️ Missing VITE_AUTH0_DOMAIN in .env");
if (!clientId) console.warn("⚠️ Missing VITE_AUTH0_CLIENT_ID in .env");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {domain && clientId ? (
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        cacheLocation="localstorage"
        authorizationParams={{
          redirect_uri: window.location.origin,
          ...(audience ? { audience } : {}),
          scope: "openid profile email",
        }}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Auth0Provider>
    ) : (
      <div
        style={{
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#f9fafb",
        }}
      >
        <div style={{ maxWidth: 480, padding: "1.5rem" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Auth0 is not configured
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            Make sure <code>VITE_AUTH0_DOMAIN</code> and{" "}
            <code>VITE_AUTH0_CLIENT_ID</code> are set in <code>.env</code> at
            the root of <code>frontend</code>, then restart Vite.
          </p>
        </div>
      </div>
    )}
  </React.StrictMode>
);