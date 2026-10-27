import type { AuthResponse, LoginData, UserProfile } from "../business/auth";
import type { MerchantApplication, RiskDecision } from "../business/merchantApplication";
import { notification } from "antd/lib";
import { clearAccessToken } from "../business/auth";

const API_BASE_URL = import.meta.env.PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
const USER_API_DEFAULT_LIMIT = 10;

async function parseResponse<T>(response: Response): Promise<AuthResponse<T>> {
  let body: AuthResponse<T> & { statusCode?: number };
  try {
    body = (await response.json()) as AuthResponse<T>;
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  const tokenExpired =
    (response.status === 401 || body.statusCode === 401) &&
    body.message?.toLowerCase().includes("token validity has been expired");

  if (tokenExpired) {
    clearAccessToken();
    notification.error({
      key: "expired-session",
      message: "Session expired",
      description: "Your session has expired. Please sign in again.",
    });
  }

  if (!response.ok || !body.success) {
    const errorDetails =
      body.error && typeof body.error === "object"
        ? Object.values(body.error as Record<string, unknown>).filter(
            (value): value is string => typeof value === "string" && value.length > 0,
          )
        : [];
    const errorMessage =
      typeof body.error === "string"
        ? body.error
        : errorDetails.length > 0
          ? errorDetails.join("; ")
          : body.message;
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
  const response = await fetch(`${API_BASE_URL}/user/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const result = await parseResponse<UserProfile>(response);
  return result.data;
}

export interface ApiUser {
  userId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  contactNumber: string;
  email: string;
  role: Array<{ roleId: number; roleName: string; roleCode: string }>;
}

export interface CreateMerchantApplicationPayload {
  businessName: string;
  legalBusinessName: string;
  businessType: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerContactNumber: string;
  requestedMonthlyVolume: number | string;
  averageTransactionAmount: number | string;
  applicationStatus: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "INFO_REQUIRED" | "APPROVED" | "DECLINED" | "WITHDRAWN";
  riskStatus: "PENDING" | "LOW" | "MEDIUM" | "HIGH" | "PROHIBITED";
  assignedReviewerId?: number;
  salesUserId?: number;
}

export async function createApplicationApi(
  accessToken: string,
  payload: CreateMerchantApplicationPayload,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/applications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  await parseResponse<unknown>(response);
}

export async function updateApplicationApi(
  accessToken: string,
  applicationId: string,
  payload: CreateMerchantApplicationPayload,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/applications/${encodeURIComponent(applicationId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  await parseResponse<unknown>(response);
}

type ApiApplication = {
  applicationId: number;
  businessName: string;
  legalBusinessName: string;
  businessType: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerContactNumber: string;
  requestedMonthlyVolume: string;
  averageTransactionAmount: string;
  applicationStatus: string;
  riskStatus: string;
  riskDecision?: RiskDecision;
  createdAt: string;
  updatedAt: string;
  createdBy?: { userId: number; firstName: string; lastName: string; email: string };
  assignedReviewer?: { userId: number; firstName: string; lastName: string; email: string } | null;
};

const displayName = (user?: { firstName: string; lastName: string } | null) =>
  user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";

const applicationFromApi = (item: ApiApplication): MerchantApplication => {
  const statusMap: Record<string, MerchantApplication["status"]> = {
    DRAFT: "DRAFT", SUBMITTED: "SUBMITTED", UNDER_REVIEW: "IN_REVIEW", INFO_REQUIRED: "NEEDS_INFO",
    APPROVED: "APPROVED", DECLINED: "REJECTED", WITHDRAWN: "REJECTED",
  };
  const riskMap: Record<string, MerchantApplication["riskStatus"]> = {
    PENDING: "PENDING", LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", PROHIBITED: "PROHIBITED",
  };
  return {
    id: String(item.applicationId),
    businessName: item.businessName,
    legalBusinessName: item.legalBusinessName,
    businessType: item.businessType,
    ownerName: [item.ownerFirstName, item.ownerLastName].filter(Boolean).join(" "),
    contactNumber: item.ownerContactNumber,
    contactEmail: item.ownerEmail,
    requestedMonthlyVolume: Number(item.requestedMonthlyVolume),
    averageTransaction: Number(item.averageTransactionAmount),
    status: statusMap[item.applicationStatus] ?? "SUBMITTED",
    riskStatus: riskMap[item.riskStatus] ?? "PENDING",
    riskDecision: item.riskDecision ?? "PENDING",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    submittedAt: item.applicationStatus === "DRAFT" ? null : item.createdAt,
    createdByUserId: item.createdBy?.userId ?? 0,
    createdByName: displayName(item.createdBy),
    assignedReviewerUserId: item.assignedReviewer?.userId ?? null,
    assignedReviewerName: displayName(item.assignedReviewer) || null,
    reviewNote: "",
  };
};

export async function listApplicationsApi(accessToken: string): Promise<MerchantApplication[]> {
  const response = await fetch(`${API_BASE_URL}/applications`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const result = await parseResponse<{ applications?: ApiApplication[]; items?: ApiApplication[]; count?: number; total?: number }>(response);
  const data = result.data;
  const rows = Array.isArray(data) ? data : data?.applications ?? data?.items ?? [];
  return rows.map(applicationFromApi);
}

export async function recordRiskDecisionApi(
  accessToken: string,
  applicationId: string,
  riskDecision: RiskDecision,
): Promise<void> {
  if (riskDecision === "PENDING") {
    throw new Error("Choose APPROVE or REJECT before saving the decision.");
  }
  const response = await fetch(`${API_BASE_URL}/applications/risk-decision/${encodeURIComponent(applicationId)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: riskDecision === "APPROVE" ? "accepted" : "rejected",
    }),
  });
  await parseResponse<unknown>(response);
}

export async function listUsersByRoleApi(
  accessToken: string,
  role: "sales" | "reviewer",
  page = 1,
  limit = USER_API_DEFAULT_LIMIT,
): Promise<ApiUser[]> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  const response = await fetch(`${API_BASE_URL}/user/${role}?${query}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const result = await parseResponse<{ users: ApiUser[] }>(response);
  return result.data?.users ?? [];
}

export async function listAllUsersByRoleApi(
  accessToken: string,
  role: "sales" | "reviewer",
): Promise<ApiUser[]> {
  const users: ApiUser[] = [];
  let page = 1;
  let pageUsers: ApiUser[];

  do {
    pageUsers = await listUsersByRoleApi(accessToken, role, page, USER_API_DEFAULT_LIMIT);
    users.push(...pageUsers);
    page += 1;
  } while (pageUsers.length === USER_API_DEFAULT_LIMIT);

  return users;
}
