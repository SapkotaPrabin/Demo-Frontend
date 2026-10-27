import type { DemoRole, UserProfile } from "./auth";

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "NEEDS_INFO"
  | "APPROVED"
  | "REJECTED";
export type RiskStatus = "PENDING" | "LOW" | "MEDIUM" | "HIGH";
export type ReviewDecision = "APPROVE" | "REJECT" | "REQUEST_INFO";

export interface MerchantApplication {
  id: string;
  businessName: string;
  legalBusinessName: string;
  businessType: string;
  ownerName: string;
  contactNumber: string;
  contactEmail: string;
  requestedMonthlyVolume: number;
  averageTransaction: number;
  status: ApplicationStatus;
  riskStatus: RiskStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  createdByUserId: number;
  createdByName: string;
  assignedReviewerUserId: number | null;
  assignedReviewerName: string | null;
  reviewNote: string;
}

export interface WorkspaceUser {
  userId: number;
  name: string;
  contactNumber: string;
  email: string;
  role: DemoRole;
  status: "Active" | "Invited";
}

const STORAGE_KEY = "merchflow-merchant-applications-v1";
const SEEDED_USERS_KEY = "merchflow-seeded-users-v1";
const INVITED_USERS_KEY = "merchflow-invited-users-v1";

const displayName = (profile: UserProfile) =>
  [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ") || profile.email;

const sample = (
  profile: UserProfile,
  overrides: Pick<MerchantApplication, "businessName" | "legalBusinessName" | "businessType" | "ownerName" | "contactNumber" | "contactEmail" | "requestedMonthlyVolume" | "averageTransaction" | "status" | "riskStatus" | "assignedReviewerUserId" | "assignedReviewerName" | "reviewNote">,
  offset: number,
): MerchantApplication => {
  const createdAt = new Date(Date.now() - offset * 86_400_000).toISOString();
  const submittedAt = overrides.status === "DRAFT" ? null : createdAt;
  return {
    id: `MF-${String(profile.userId).padStart(3, "0")}-${String(offset).padStart(3, "0")}`,
    ...overrides,
    createdAt,
    updatedAt: createdAt,
    submittedAt,
    createdByUserId: profile.userId,
    createdByName: displayName(profile),
  };
};

function seedForUser(profile: UserProfile, role: DemoRole): MerchantApplication[] {
  if (role === "sales") {
    return [
      sample(profile, { businessName: "Juniper Market", legalBusinessName: "Juniper Market LLC", businessType: "Retail", ownerName: "Nora Patel", contactNumber: "(415) 555-0182", contactEmail: "nora@junipermarket.example", requestedMonthlyVolume: 85000, averageTransaction: 74, status: "IN_REVIEW", riskStatus: "PENDING", assignedReviewerUserId: null, assignedReviewerName: null, reviewNote: "" }, 2),
      sample(profile, { businessName: "Cedar & Stone", legalBusinessName: "Cedar and Stone Foods Inc.", businessType: "Food & beverage", ownerName: "Miles Chen", contactNumber: "(415) 555-0124", contactEmail: "miles@cedarstone.example", requestedMonthlyVolume: 42000, averageTransaction: 38, status: "DRAFT", riskStatus: "PENDING", assignedReviewerUserId: null, assignedReviewerName: null, reviewNote: "" }, 1),
      sample(profile, { businessName: "Northline Fitness", legalBusinessName: "Northline Fitness LLC", businessType: "Health & fitness", ownerName: "Avery Brooks", contactNumber: "(510) 555-0135", contactEmail: "avery@northline.example", requestedMonthlyVolume: 126000, averageTransaction: 112, status: "APPROVED", riskStatus: "LOW", assignedReviewerUserId: null, assignedReviewerName: null, reviewNote: "Approved after standard KYB review." }, 7),
    ];
  }

  if (role === "reviewer") {
    const assignedReviewerName = displayName(profile);
    return [
      sample(profile, { businessName: "Solace Travel Co.", legalBusinessName: "Solace Travel Company LLC", businessType: "Travel", ownerName: "Riley James", contactNumber: "(312) 555-0148", contactEmail: "riley@solacetravel.example", requestedMonthlyVolume: 196000, averageTransaction: 680, status: "IN_REVIEW", riskStatus: "MEDIUM", assignedReviewerUserId: profile.userId, assignedReviewerName, reviewNote: "" }, 1),
      sample(profile, { businessName: "Arcwell Supplements", legalBusinessName: "Arcwell Health Inc.", businessType: "Health products", ownerName: "Drew Wilson", contactNumber: "(646) 555-0163", contactEmail: "drew@arcwell.example", requestedMonthlyVolume: 78000, averageTransaction: 96, status: "IN_REVIEW", riskStatus: "HIGH", assignedReviewerUserId: profile.userId, assignedReviewerName, reviewNote: "" }, 2),
      sample(profile, { businessName: "Little Fern Studio", legalBusinessName: "Little Fern Studio LLC", businessType: "Professional services", ownerName: "Quinn Harper", contactNumber: "(206) 555-0111", contactEmail: "quinn@littlefern.example", requestedMonthlyVolume: 24000, averageTransaction: 54, status: "NEEDS_INFO", riskStatus: "LOW", assignedReviewerUserId: profile.userId, assignedReviewerName, reviewNote: "Please provide the latest proof of business address." }, 4),
    ];
  }

  return [
    sample(profile, { businessName: "Juniper Market", legalBusinessName: "Juniper Market LLC", businessType: "Retail", ownerName: "Nora Patel", contactNumber: "(415) 555-0182", contactEmail: "nora@junipermarket.example", requestedMonthlyVolume: 85000, averageTransaction: 74, status: "SUBMITTED", riskStatus: "PENDING", assignedReviewerUserId: null, assignedReviewerName: null, reviewNote: "" }, 1),
    sample(profile, { businessName: "Solace Travel Co.", legalBusinessName: "Solace Travel Company LLC", businessType: "Travel", ownerName: "Riley James", contactNumber: "(312) 555-0148", contactEmail: "riley@solacetravel.example", requestedMonthlyVolume: 196000, averageTransaction: 680, status: "IN_REVIEW", riskStatus: "MEDIUM", assignedReviewerUserId: 2, assignedReviewerName: "Jordan Lee", reviewNote: "" }, 2),
    sample(profile, { businessName: "Northline Fitness", legalBusinessName: "Northline Fitness LLC", businessType: "Health & fitness", ownerName: "Avery Brooks", contactNumber: "(510) 555-0135", contactEmail: "avery@northline.example", requestedMonthlyVolume: 126000, averageTransaction: 112, status: "APPROVED", riskStatus: "LOW", assignedReviewerUserId: 2, assignedReviewerName: "Jordan Lee", reviewNote: "Approved after standard KYB review." }, 7),
    sample(profile, { businessName: "Arcwell Supplements", legalBusinessName: "Arcwell Health Inc.", businessType: "Health products", ownerName: "Drew Wilson", contactNumber: "(646) 555-0163", contactEmail: "drew@arcwell.example", requestedMonthlyVolume: 78000, averageTransaction: 96, status: "NEEDS_INFO", riskStatus: "HIGH", assignedReviewerUserId: null, assignedReviewerName: null, reviewNote: "Please clarify the source of high-value transactions." }, 3),
  ];
}

const readApplications = (): MerchantApplication[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as MerchantApplication[]) : [];
  } catch {
    return [];
  }
};

const writeApplications = (applications: MerchantApplication[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));

function ensureSeeded(profile: UserProfile, role: DemoRole): MerchantApplication[] {
  const applications = readApplications();
  const seededUsers = JSON.parse(localStorage.getItem(SEEDED_USERS_KEY) ?? "[]") as number[];
  if (seededUsers.includes(profile.userId)) return applications;
  const nextApplications = [...applications, ...seedForUser(profile, role)];
  localStorage.setItem(SEEDED_USERS_KEY, JSON.stringify([...seededUsers, profile.userId]));
  writeApplications(nextApplications);
  return nextApplications;
}

export function listApplications(profile: UserProfile, role: DemoRole): MerchantApplication[] {
  const applications = ensureSeeded(profile, role);
  if (role === "admin") return applications;
  if (role === "sales") return applications.filter((application) => application.createdByUserId === profile.userId);
  return applications.filter((application) => application.assignedReviewerUserId === profile.userId);
}

export function saveApplication(
  profile: UserProfile,
  role: DemoRole,
  applicationId: string | null,
  values: Pick<MerchantApplication, "businessName" | "legalBusinessName" | "businessType" | "ownerName" | "contactNumber" | "contactEmail" | "requestedMonthlyVolume" | "averageTransaction"> & { submit: boolean },
): MerchantApplication {
  const applications = ensureSeeded(profile, role);
  const { submit, ...fields } = values;
  const now = new Date().toISOString();
  if (applicationId) {
    const target = applications.find((item) => item.id === applicationId);
    if (!target) throw new Error("Application not found.");
    if (role !== "admin" && (role !== "sales" || target.createdByUserId !== profile.userId)) throw new Error("You can only edit applications you created.");
    if (role === "sales" && !["DRAFT", "NEEDS_INFO"].includes(target.status)) throw new Error("This application is no longer editable.");
    const updated = { ...target, ...fields, status: submit ? "SUBMITTED" as const : target.status, submittedAt: submit ? now : target.submittedAt, updatedAt: now };
    writeApplications(applications.map((item) => item.id === applicationId ? updated : item));
    return updated;
  }

  if (role !== "admin" && role !== "sales") throw new Error("Your role cannot create applications.");
  const id = `MF-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const created: MerchantApplication = {
    id,
    ...fields,
    status: submit ? "SUBMITTED" : "DRAFT",
    riskStatus: "PENDING",
    createdAt: now,
    updatedAt: now,
    submittedAt: submit ? now : null,
    createdByUserId: profile.userId,
    createdByName: displayName(profile),
    assignedReviewerUserId: null,
    assignedReviewerName: null,
    reviewNote: "",
  };
  writeApplications([created, ...applications]);
  return created;
}

export function assignReviewer(
  applicationId: string,
  reviewer: Pick<WorkspaceUser, "userId" | "name">,
  role: DemoRole,
): void {
  if (role !== "admin") throw new Error("Only admins can assign reviewers.");
  const applications = readApplications();
  const target = applications.find((application) => application.id === applicationId);
  if (!target || !["SUBMITTED", "IN_REVIEW", "NEEDS_INFO"].includes(target.status)) throw new Error("This application cannot be assigned.");
  writeApplications(applications.map((application) => application.id === applicationId
    ? { ...application, assignedReviewerUserId: reviewer.userId, assignedReviewerName: reviewer.name, status: "IN_REVIEW", updatedAt: new Date().toISOString() }
    : application));
}

export function recordReviewDecision(
  applicationId: string,
  decision: ReviewDecision,
  note: string,
  profile: UserProfile,
  role: DemoRole,
): void {
  if (role !== "reviewer") throw new Error("Only reviewers can record a risk decision.");
  const applications = readApplications();
  const target = applications.find((application) => application.id === applicationId);
  if (!target || target.assignedReviewerUserId !== profile.userId) throw new Error("Only the assigned reviewer can decide this application.");
  if (target.status !== "IN_REVIEW") throw new Error("This application is not awaiting a decision.");

  const status: ApplicationStatus = decision === "APPROVE" ? "APPROVED" : decision === "REJECT" ? "REJECTED" : "NEEDS_INFO";
  const riskStatus: RiskStatus = decision === "APPROVE" ? "LOW" : decision === "REJECT" ? "HIGH" : target.riskStatus;
  writeApplications(applications.map((application) => application.id === applicationId
    ? { ...application, status, riskStatus, reviewNote: note.trim(), updatedAt: new Date().toISOString() }
    : application));
}

export function demoWorkspaceUsers(profile: UserProfile): WorkspaceUser[] {
  const currentRole = profile.role[0]?.roleCode.toUpperCase().replace(/^ROLE_/, "");
  const role: DemoRole = currentRole === "REVIEWER" ? "reviewer" : currentRole === "SALES" ? "sales" : "admin";
  const contactNumber = profile.contactNumber ? `••••••${profile.contactNumber.slice(-4)}` : "—";
  const me: WorkspaceUser = { userId: profile.userId, name: displayName(profile), contactNumber, email: profile.email, role, status: "Active" };
  const seeded: WorkspaceUser[] = [
    { userId: 3, name: "System Admin", contactNumber: "••••••7890", email: "admin@merchflow.example", role: "admin", status: "Active" },
    { userId: 2, name: "Jordan Lee", contactNumber: "••••••1422", email: "jordan@merchflow.example", role: "reviewer", status: "Active" },
    { userId: 4, name: "Taylor Morgan", contactNumber: "••••••3814", email: "taylor@merchflow.example", role: "sales", status: "Active" },
    { userId: 5, name: "Casey Rivera", contactNumber: "••••••8061", email: "casey@merchflow.example", role: "reviewer", status: "Invited" },
  ];
  const invitedUsers = JSON.parse(localStorage.getItem(INVITED_USERS_KEY) ?? "[]") as WorkspaceUser[];
  return [me, ...seeded.filter((user) => user.userId !== me.userId), ...invitedUsers.filter((user) => user.userId !== me.userId)];
}

export function inviteWorkspaceUser(
  profile: UserProfile,
  input: Pick<WorkspaceUser, "name" | "email" | "contactNumber" | "role">,
): WorkspaceUser {
  const currentRole = profile.role[0]?.roleCode.toUpperCase().replace(/^ROLE_/, "");
  if (currentRole !== "ADMIN") throw new Error("Only admins can invite team members.");
  const users = demoWorkspaceUsers(profile);
  if (users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) throw new Error("A team member with that email already exists.");
  const invited: WorkspaceUser = {
    ...input,
    userId: Math.max(...users.map((user) => user.userId), 0) + 1,
    status: "Invited",
  };
  const stored = JSON.parse(localStorage.getItem(INVITED_USERS_KEY) ?? "[]") as WorkspaceUser[];
  localStorage.setItem(INVITED_USERS_KEY, JSON.stringify([...stored, invited]));
  return invited;
}
