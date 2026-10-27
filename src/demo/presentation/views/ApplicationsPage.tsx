import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { notification } from "antd/lib";
import { createApplicationApi, listAllUsersByRoleApi, listApplicationsApi, recordRiskDecisionApi, updateApplicationApi, type ApiUser } from "../../infrastructure/AuthApi";
import { readAccessToken } from "../../business/auth";
import { type DemoRole, type UserProfile } from "../../business/auth";
import { getContactNumberError, getEmailError } from "../../business/fieldValidation";
import {
  demoWorkspaceUsers,
  type ApplicationStatus,
  type MerchantApplication,
  type RiskDecision,
} from "../../business/merchantApplication";

type FormValues = Pick<MerchantApplication, "businessName" | "legalBusinessName" | "businessType" | "contactNumber" | "contactEmail" | "requestedMonthlyVolume" | "averageTransaction"> & {
  ownerFirstName: string;
  ownerLastName: string;
  applicationStatus: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "INFO_REQUIRED" | "APPROVED" | "DECLINED" | "WITHDRAWN";
  riskStatus: MerchantApplication["riskStatus"];
  salesUserId?: number;
  assignedReviewerId?: number;
};

const emptyForm: FormValues = { businessName: "", legalBusinessName: "", businessType: "", ownerFirstName: "", ownerLastName: "", contactNumber: "", contactEmail: "", requestedMonthlyVolume: 0, averageTransaction: 0, applicationStatus: "SUBMITTED", riskStatus: "LOW" };
const applicationStatuses: FormValues["applicationStatus"][] = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "INFO_REQUIRED", "APPROVED", "DECLINED", "WITHDRAWN"];
const riskStatuses: Exclude<FormValues["riskStatus"], "PENDING">[] = ["LOW", "MEDIUM", "HIGH", "PROHIBITED"];
const statusLabel: Record<ApplicationStatus, string> = { DRAFT: "Draft", SUBMITTED: "Submitted", IN_REVIEW: "In review", NEEDS_INFO: "Needs information", APPROVED: "Approved", REJECTED: "Rejected" };
const businessTypes = ["Retail", "Food & beverage", "Professional services", "Health & fitness", "Health products", "Travel", "Other"];

function Status({ status }: { status: ApplicationStatus }) {
  return <span className={`mf-status mf-status-${status.toLowerCase()}`}>{statusLabel[status]}</span>;
}

function ApplicationForm({ initial, role, salesUsers, reviewers, onCancel, onSave, saving }: { initial?: MerchantApplication; role: DemoRole; salesUsers: ApiUser[]; reviewers: ReturnType<typeof demoWorkspaceUsers>; onCancel: () => void; onSave: (values: FormValues) => void; saving: boolean }) {
  const [values, setValues] = useState<FormValues>(initial ? {
    businessName: initial.businessName,
    legalBusinessName: initial.legalBusinessName,
    businessType: initial.businessType,
    ownerFirstName: initial.ownerName.trim().split(/\s+/)[0] ?? "",
    ownerLastName: initial.ownerName.trim().split(/\s+/).slice(1).join(" "),
    applicationStatus: initial.status === "IN_REVIEW" ? "UNDER_REVIEW" : initial.status === "NEEDS_INFO" ? "INFO_REQUIRED" : initial.status === "REJECTED" ? "DECLINED" : initial.status,
    riskStatus: initial.riskStatus === "PENDING" ? "LOW" : initial.riskStatus,
    contactNumber: initial.contactNumber,
    contactEmail: initial.contactEmail,
    requestedMonthlyVolume: initial.requestedMonthlyVolume,
    averageTransaction: initial.averageTransaction,
    salesUserId: initial.createdByUserId || undefined,
    assignedReviewerId: initial.assignedReviewerUserId ?? undefined,
  } : emptyForm);
  const [contactNumberTouched, setContactNumberTouched] = useState(false);
  const [contactEmailTouched, setContactEmailTouched] = useState(false);
  const contactNumberError = contactNumberTouched ? getContactNumberError(values.contactNumber, true) : "";
  const contactEmailError = contactEmailTouched ? getEmailError(values.contactEmail, true) : "";
  const update = (field: keyof FormValues, value: string) => setValues((current) => ({ ...current, [field]: field === "requestedMonthlyVolume" || field === "averageTransaction" ? Number(value) : value }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactNumberTouched(true);
    setContactEmailTouched(true);
    if (getContactNumberError(values.contactNumber, true) || getEmailError(values.contactEmail, true)) return;
    if (!values.businessName.trim() || !values.legalBusinessName.trim() || !values.ownerFirstName.trim() || !values.ownerLastName.trim() || !values.contactNumber.trim() || !values.contactEmail.trim() || !values.businessType) {
      notification.error({
        message: "Incomplete application",
        description: "Complete all required business and contact information.",
      });
      return;
    }
    if (role === "admin" && (!values.salesUserId || !values.assignedReviewerId)) {
      notification.error({
        message: "Assignments required",
        description: "Select both a Sales owner and an assigned reviewer before submitting.",
      });
      return;
    }
    onSave(values);
  };

  return <div className="mf-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="mf-modal mf-form-modal" role="dialog" aria-modal="true" aria-labelledby="application-form-title">
    <div className="mf-modal-heading"><div><div className="mf-overline">MERCHANT APPLICATION</div><h2 id="application-form-title">{initial ? "Update application" : "Create application"}</h2><p>Enter business details and requested processing information.</p></div><button className="mf-close" type="button" onClick={onCancel} aria-label="Close">×</button></div>
    <form className="mf-application-form" onSubmit={submit} noValidate><div className="mf-form-section-title">Business details</div>
      <div className="mf-form-grid"><label>Business name *<input value={values.businessName} onChange={(event) => update("businessName", event.target.value)} placeholder="e.g. Juniper Market" required /></label><label>Legal business name *<input value={values.legalBusinessName} onChange={(event) => update("legalBusinessName", event.target.value)} placeholder="Registered legal name" required /></label><label>Business type *<select value={values.businessType} onChange={(event) => update("businessType", event.target.value)} required><option value="">Select business type</option>{businessTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label>Owner first name *<input value={values.ownerFirstName} onChange={(event) => update("ownerFirstName", event.target.value)} placeholder="First name" required /></label><label>Owner last name *<input value={values.ownerLastName} onChange={(event) => update("ownerLastName", event.target.value)} placeholder="Last name" required /></label><label className={contactNumberError ? "mf-field-invalid" : ""}>Contact number *<input type="tel" inputMode="numeric" pattern="[0-9]{10}" aria-invalid={Boolean(contactNumberError)} aria-describedby="application-contact-number-error" value={values.contactNumber} onBlur={() => setContactNumberTouched(true)} onChange={(event) => { setContactNumberTouched(true); update("contactNumber", event.target.value); }} placeholder="10-digit number" required /><span id="application-contact-number-error" className="mf-field-error" aria-live="polite">{contactNumberError}</span></label><label className={contactEmailError ? "mf-field-invalid" : ""}>Contact email *<input type="email" aria-invalid={Boolean(contactEmailError)} aria-describedby="application-contact-email-error" value={values.contactEmail} onBlur={() => setContactEmailTouched(true)} onChange={(event) => { setContactEmailTouched(true); update("contactEmail", event.target.value); }} placeholder="owner@business.com" required /><span id="application-contact-email-error" className="mf-field-error" aria-live="polite">{contactEmailError}</span></label>
        {role === "admin" && <><label>Sales owner *<select required value={values.salesUserId ?? ""} onChange={(event) => setValues((current) => ({ ...current, salesUserId: event.target.value ? Number(event.target.value) : undefined }))}><option value="">Select sales user</option>{initial && values.salesUserId && !salesUsers.some((user) => user.userId === values.salesUserId) && <option value={values.salesUserId}>{initial.createdByName || `User ${values.salesUserId}`}</option>}{salesUsers.map((user) => <option key={user.userId} value={user.userId}>{[user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ")} · {user.email}</option>)}</select></label><label>Assigned reviewer *<select required value={values.assignedReviewerId ?? ""} onChange={(event) => setValues((current) => ({ ...current, assignedReviewerId: event.target.value ? Number(event.target.value) : undefined }))}><option value="">Select reviewer</option>{initial && values.assignedReviewerId && !reviewers.some((reviewer) => reviewer.userId === values.assignedReviewerId) && <option value={values.assignedReviewerId}>{initial.assignedReviewerName || `User ${values.assignedReviewerId}`}</option>}{reviewers.map((reviewer) => <option key={reviewer.userId} value={reviewer.userId}>{reviewer.name}</option>)}</select></label></>}
      </div>
      <div className="mf-form-section-title mf-form-section-spaced">Requested processing</div><div className="mf-form-grid"><label>Expected monthly volume *<div className="mf-input-prefix"><span>$</span><input type="number" min="0" value={values.requestedMonthlyVolume || ""} onChange={(event) => update("requestedMonthlyVolume", event.target.value)} placeholder="50000" required /></div></label><label>Average transaction *<div className="mf-input-prefix"><span>$</span><input type="number" min="0" value={values.averageTransaction || ""} onChange={(event) => update("averageTransaction", event.target.value)} placeholder="75" required /></div></label></div>
      <div className="mf-form-section-title mf-form-section-spaced">Application and risk status</div><div className="mf-form-grid"><label>Application status *<select required value={values.applicationStatus} onChange={(event) => setValues((current) => ({ ...current, applicationStatus: event.target.value as FormValues["applicationStatus"] }))}>{applicationStatuses.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}</select></label><label>Risk status *<select required value={values.riskStatus} onChange={(event) => setValues((current) => ({ ...current, riskStatus: event.target.value as FormValues["riskStatus"] }))}>{riskStatuses.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}</select></label></div>
      <div className="mf-modal-actions"><button className="mf-button mf-button-quiet" type="button" onClick={onCancel}>Cancel</button><button className="mf-button mf-button-primary" type="submit" disabled={saving}>{saving ? (initial ? "Saving…" : "Submitting…") : initial ? "Save changes" : "Submit application"}</button></div>
    </form>
  </section></div>;
}

export default function ApplicationsPage({ profile, role, newApplication = false, reviewQueue = false }: { profile: UserProfile; role: DemoRole; newApplication?: boolean; reviewQueue?: boolean }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<MerchantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewerChoices, setReviewerChoices] = useState<ReturnType<typeof demoWorkspaceUsers>>([]);
  const [salesChoices, setSalesChoices] = useState<ApiUser[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(newApplication);
  const [editing, setEditing] = useState<MerchantApplication | undefined>();
  const [saving, setSaving] = useState(false);
  const [savingRiskDecision, setSavingRiskDecision] = useState(false);
  const [decision, setDecision] = useState<RiskDecision>("PENDING");
  useEffect(() => {
    const token = readAccessToken();
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        return Promise.all([
          listApplicationsApi(token),
          role === "admin" ? listAllUsersByRoleApi(token, "reviewer") : Promise.resolve([]),
          role === "admin" ? listAllUsersByRoleApi(token, "sales") : Promise.resolve([]),
        ]);
      })
      .then(([rows, apiReviewers, apiSalesUsers]) => {
        if (!active) return;
        setApplications(rows);
        setReviewerChoices(apiReviewers.map((user) => ({ userId: user.userId, name: [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" "), contactNumber: user.contactNumber, email: user.email, role: "reviewer" as const, status: "Active" as const })));
        setSalesChoices(apiSalesUsers);
      }).catch((loadError: unknown) => {
        if (active) notification.error({
          message: "Could not load applications",
          description: loadError instanceof Error ? loadError.message : "Could not load applications.",
        });
      }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [role]);

  const selected = applications.find((item) => item.id === selectedId) ?? null;
  const visibleApplications = applications;
  const reviewers = reviewerChoices;

  const openApplication = (application: MerchantApplication) => {
    setDecision(application.riskDecision);
    setSelectedId(application.id);
  };

  const refresh = async () => {
    const token = readAccessToken();
    if (token) setApplications(await listApplicationsApi(token));
  };
  const handleSave = async (values: FormValues) => {
    setSaving(true);
    try {
      const token = readAccessToken();
      if (!token) throw new Error("Your session has expired. Please sign in again.");
      const payload = {
        businessName: values.businessName,
        legalBusinessName: values.legalBusinessName,
        businessType: values.businessType,
        ownerFirstName: values.ownerFirstName,
        ownerLastName: values.ownerLastName,
        ownerEmail: values.contactEmail,
        ownerContactNumber: values.contactNumber,
        requestedMonthlyVolume: values.requestedMonthlyVolume,
        averageTransactionAmount: values.averageTransaction,
        applicationStatus: values.applicationStatus,
        riskStatus: values.riskStatus,
        ...(role === "admin" && values.salesUserId ? { salesUserId: values.salesUserId } : {}),
        ...(values.assignedReviewerId ? { assignedReviewerId: values.assignedReviewerId } : {}),
      };
      if (editing) {
        await updateApplicationApi(token, editing.id, payload);
      } else {
        await createApplicationApi(token, payload);
      }
      await refresh();
      setFormOpen(false);
      setEditing(undefined);
      notification.success({
        message: editing ? "Application updated" : "Application submitted",
        description: `${values.businessName} was ${editing ? "updated" : "submitted"} successfully.`,
      });
    } catch (saveError) {
      notification.error({
        message: "Could not save the application",
        description: saveError instanceof Error ? saveError.message : "Could not save the application.",
      });
    } finally { setSaving(false); }
  };

  const handleDecision = async (decision: Exclude<RiskDecision, "PENDING">) => {
    if (!selected) return;
    setSavingRiskDecision(true);
    try {
      const token = readAccessToken();
      if (!token) throw new Error("Your session has expired. Please sign in again.");
      await recordRiskDecisionApi(token, selected.id, decision);
      await refresh();
      notification.success({ message: "Risk decision saved", description: `The risk decision for ${selected.businessName} was saved.` });
    } catch (decisionError) {
      notification.error({
        message: "Could not record the decision",
        description: decisionError instanceof Error ? decisionError.message : "Could not record the decision.",
      });
    } finally {
      setSavingRiskDecision(false);
    }
  };

  const closeForm = () => { setFormOpen(false); setEditing(undefined); if (newApplication) navigate("/demo/dashboard/applications"); };
  const heading = reviewQueue ? "Review queue" : role === "sales" ? "My applications" : "Merchant applications";
  const canEdit = (item: MerchantApplication) => role === "admin" || (role === "sales" && item.createdByUserId === profile.userId && ["DRAFT", "NEEDS_INFO"].includes(item.status));

  return <div className="mf-page">
    <div className="mf-page-heading"><div><div className="mf-overline">{reviewQueue ? "RISK & UNDERWRITING" : "MERCHANTS"}</div><h1>{heading}</h1><p>{reviewQueue ? "Review only applications assigned to your account." : role === "sales" ? "Create and track applications you submitted." : "Manage merchant onboarding from submission through decision."}</p></div>{(role === "sales" || role === "admin") && !reviewQueue && <button className="mf-button mf-button-primary" onClick={() => { setEditing(undefined); setFormOpen(true); }}>＋ New application</button>}</div>
    <section className="mf-panel mf-list-panel"><div className="mf-list-toolbar"><span className="mf-result-count">{visibleApplications.length} {visibleApplications.length === 1 ? "application" : "applications"}</span></div>
      {loading ? <div className="mf-empty"><strong>Loading applications…</strong></div> : null}
      {!loading && (visibleApplications.length ? <div className="mf-table-scroll"><table className="mf-table"><thead><tr><th>MERCHANT</th><th>BUSINESS TYPE</th><th>OWNER / CONTACT</th><th>SALES USER</th><th>REVIEWER</th><th>VOLUME / MO.</th><th>RISK</th><th>RISK DECISION</th><th>STATUS</th><th>UPDATED</th><th /></tr></thead><tbody>{visibleApplications.map((item) => <tr key={item.id}><td><button className="mf-merchant-cell" onClick={() => openApplication(item)}><span className="mf-merchant-avatar">{item.businessName.slice(0, 1).toUpperCase()}</span><span><strong>{item.businessName}</strong><small>{item.id}</small></span></button></td><td>{item.businessType}</td><td><strong>{item.ownerName}</strong><small>{item.contactEmail}</small></td><td>{item.createdByName || "—"}</td><td>{item.assignedReviewerName || "—"}</td><td>${item.requestedMonthlyVolume.toLocaleString()}</td><td><span className={`mf-risk mf-risk-${item.riskStatus.toLowerCase()}`}>{item.riskStatus}</span></td><td><span className={`mf-risk mf-risk-decision-${item.riskDecision.toLowerCase()}`}>{item.riskDecision}</span></td><td><Status status={item.status} /></td><td>{new Date(item.updatedAt).toLocaleDateString()}</td><td><button className="mf-row-action" onClick={() => openApplication(item)} aria-label={`Open ${item.businessName}`}>›</button></td></tr>)}</tbody></table></div> : <div className="mf-empty"><span className="mf-empty-icon">⌕</span><strong>No applications</strong><span>Applications will appear here when they are available.</span></div>)}
    </section>

    {formOpen && <ApplicationForm initial={editing} role={role} salesUsers={salesChoices} reviewers={reviewers} onCancel={closeForm} onSave={handleSave} saving={saving} />}

    {selected && <div className="mf-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}><section className="mf-modal mf-detail-modal" role="dialog" aria-modal="true" aria-labelledby="application-detail-title"><div className="mf-modal-heading"><div><div className="mf-overline">APPLICATION · {selected.id}</div><h2 id="application-detail-title">{selected.businessName}</h2><p>{selected.legalBusinessName}</p></div><button className="mf-close" onClick={() => setSelectedId(null)} aria-label="Close">×</button></div>
      <div className="mf-detail-status"><Status status={selected.status} /><span className={`mf-risk mf-risk-${selected.riskStatus.toLowerCase()}`}>Risk: {selected.riskStatus}</span><span className={`mf-risk mf-risk-decision-${selected.riskDecision.toLowerCase()}`}>Decision: {selected.riskDecision}</span></div><div className="mf-detail-grid"><div><small>BUSINESS TYPE</small><strong>{selected.businessType}</strong></div><div><small>OWNER / CONTACT</small><strong>{selected.ownerName}</strong></div><div><small>CONTACT NUMBER</small><strong>{selected.contactNumber}</strong></div><div><small>CONTACT EMAIL</small><strong>{selected.contactEmail}</strong></div><div><small>REQUESTED MONTHLY VOLUME</small><strong>${selected.requestedMonthlyVolume.toLocaleString()}</strong></div><div><small>AVERAGE TRANSACTION</small><strong>${selected.averageTransaction.toLocaleString()}</strong></div><div><small>CREATED BY</small><strong>{selected.createdByName}</strong></div><div><small>ASSIGNED REVIEWER</small><strong>{selected.assignedReviewerName ?? "Unassigned"}</strong></div><div><small>CREATED</small><strong>{new Date(selected.createdAt).toLocaleString()}</strong></div><div><small>LAST UPDATED</small><strong>{new Date(selected.updatedAt).toLocaleString()}</strong></div></div>
      {selected.reviewNote && <div className="mf-review-note"><strong>Review note</strong><p>{selected.reviewNote}</p></div>}
      {(role === "admin" || (role === "reviewer" && selected.assignedReviewerUserId === profile.userId)) && <div className="mf-assign-row"><label>Risk Decision<select value={decision} onChange={(event) => setDecision(event.target.value as RiskDecision)} disabled={savingRiskDecision}><option value="PENDING" disabled>Select a decision</option><option value="APPROVE">Accept</option><option value="REJECT">Reject</option></select></label><button className="mf-button mf-button-outline" onClick={() => { if (decision !== "PENDING" && decision !== selected.riskDecision) void handleDecision(decision); }} disabled={savingRiskDecision || decision === "PENDING" || decision === selected.riskDecision}>{savingRiskDecision ? "Updating…" : "Update decision"}</button></div>}
      <div className="mf-modal-actions"><button className="mf-button mf-button-quiet" onClick={() => setSelectedId(null)}>Close</button>{canEdit(selected) && <button className="mf-button mf-button-outline" onClick={() => { setEditing(selected); setFormOpen(true); setSelectedId(null); }}>Edit application</button>}</div>
    </section></div>}

  </div>;
}
