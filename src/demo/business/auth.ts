export type DemoRole = "admin" | "reviewer" | "sales";

export interface UserProfile {
  userId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  contactNumber: string;
  email: string;
  role: Array<{ roleId: number; roleName: string; roleCode: string }>;
}

export interface AuthResponse<T> {
  success: boolean;
  message: string;
  error: unknown;
  data: T;
}

export interface LoginData {
  accessToken: string;
  tokenType: string;
}

const ACCESS_TOKEN_KEY = "merchflow-access-token";

export const saveAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const readAccessToken = (): string | null =>
  localStorage.getItem(ACCESS_TOKEN_KEY);

export const clearAccessToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const roleFromProfile = (profile: UserProfile): DemoRole | null => {
  const roleCode = profile.role?.[0]?.roleCode?.toUpperCase().replace(/^ROLE_/, "");

  switch (roleCode) {
    case "ADMIN":
      return "admin";
    case "REVIEWER":
      return "reviewer";
    case "SALES":
      return "sales";
    default:
      return null;
  }
};

export const roleLabels: Record<DemoRole, string> = {
  admin: "Administrator",
  reviewer: "Reviewer",
  sales: "Sales",
};
