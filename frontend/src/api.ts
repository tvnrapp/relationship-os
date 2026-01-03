// frontend/src/api.ts
import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:4000";

export const api = axios.create({ baseURL });

// -------------------- AUTH --------------------

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// -------------------- TYPES --------------------

export type Role = "CUSTOMER" | "SELLER" | "ADMIN";

export type Invite = {
  id: number;
  email: string;
  role: Role;
  companyName: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

export type CreateInviteResponse = {
  invite: Invite;
  token: string;     // raw invite token (shown once)
  acceptUrl: string; // full accept link
};

export type ValidateInviteResponse = {
  invite: {
    email: string;
    role: Role;
    companyName: string | null;
    expiresAt: string;
  };
};

export type AcceptInviteResponse = {
  token: string; // app JWT
  user: {
    id: number;
    email: string;
    name: string;
    role: Role;
    companyName: string | null;
  };
};

export type PendingInvitesResponse = {
  invites: Invite[];
};

// -------------------- INVITES API --------------------

export async function createInvite(payload: {
  email: string;
  role: Role;
  companyName?: string;
}): Promise<CreateInviteResponse> {
  const res = await api.post<CreateInviteResponse>("/invites", payload);
  return res.data;
}

export async function validateInvite(
  token: string
): Promise<ValidateInviteResponse> {
  const res = await api.get<ValidateInviteResponse>("/invites/validate", {
    params: { token },
  });
  return res.data;
}

export async function acceptInvite(payload: {
  token: string;
  name?: string;
  auth0Sub?: string;
}): Promise<AcceptInviteResponse> {
  const res = await api.post<AcceptInviteResponse>("/invites/accept", payload);
  return res.data;
}

export async function listPendingInvites(): Promise<PendingInvitesResponse> {
  const res = await api.get<PendingInvitesResponse>("/invites/pending");
  return res.data;
}