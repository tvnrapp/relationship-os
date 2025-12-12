// frontend/src/api.ts
import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:4000";

export const api = axios.create({
  baseURL,
});

// Attach/remove auth token for all subsequent requests
export function setAuthToken(token: string | null) {
  if (token) {
    // If your backend expects a bearer token, use this:
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}