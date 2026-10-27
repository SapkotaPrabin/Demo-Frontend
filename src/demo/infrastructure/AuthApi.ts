import type { AuthResponse, LoginData, UserProfile } from "../business/auth";

const API_BASE_URL = import.meta.env.PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

async function parseResponse<T>(response: Response): Promise<AuthResponse<T>> {
  let body: AuthResponse<T>;
  try {
    body = (await response.json()) as AuthResponse<T>;
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || !body.success) {
    const errorMessage =
      typeof body.error === "string" ? body.error : body.message;
    throw new Error(errorMessage || `Request failed (${response.status}).`);
  }

  return body;
}

export async function login(contactNumber: string, password: string): Promise<LoginData> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contactNumber, password }),
  });

  const result = await parseResponse<LoginData>(response);
  if (!result.data?.accessToken) {
    throw new Error("The login response did not include an access token.");
  }
  return result.data;
}

export async function getProfile(accessToken: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const result = await parseResponse<UserProfile>(response);
  return result.data;
}
