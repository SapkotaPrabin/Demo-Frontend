import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { roleLabels, type DemoRole, type UserProfile } from "../../business/auth";
import {
  assignReviewer,
  demoWorkspaceUsers,
  listApplications,
  recordReviewDecision,
  saveApplication,
  type ApplicationStatus,
  type MerchantApplication,
  type ReviewDecision,
} from "../../business/merchantApplication";

type FormValues = Pick<MerchantApplication, "businessName" | "legalBusinessName" | "businessType" | "ownerName" | "contactNumber" | "contactEmail" | "requestedMonthlyVolume" | "averageTransaction">;

const emptyForm: FormValues = { businessName: "", legalBusinessName: "", businessType: "", ownerName: "", contactNumber: "", contactEmail: "", requestedMonthlyVolume: 0, averageTransaction: 0 };
const statusLabel: Record<ApplicationStatus, string> = { DRAFT: "Draft", SUBMITTED: "Submitted", IN_REVIEW: "In review", NEEDS_INFO: "Needs information", APPROVED: "Approved", REJECTED: "Rejected" };
const businessTypes = ["Retail", "Food & beverage", "Professional services", "Health & fitness", "Health products", "Travel", "Other"];

function Status({ status }: { status: ApplicationStatus }) {
  return <span className={`mf-status mf-status-${status.toLowerCase()}`}>{statusLabel[status]}</span>;
}

function ApplicationForm({ initial, onCancel, onSave, saving }: { initial?: MerchantApplication; onCancel: () => void; onSave: (values: FormValues, submit: boolean) => void; saving: boolean }) {
  const [values, setValues] = useState<FormValues>(initial ? {
    businessName: initial.businessName,
    legalBusinessName: initial.legalBusinessName,
    businessType: initial.businessType,
    ownerName: initial.ownerName,
    contactNumber: initial.contactNumber,
    contactEmail: initial.contactEmail,
    requestedMonthlyVolume: initial.requestedMonthlyVolume,
    averageTransaction: initial.averageTransaction,
  } : emptyForm);
  const [error, setError] = useState("");
  const update = (field: keyof FormValues, value: string) => setValues((current) => ({ ...current, [field]: field === "requestedMonthlyVolume" || field === "averageTransaction" ? Number(value) : value }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.businessName.trim() || !values.legalBusinessName.trim() || !values.ownerName.trim() || !values.contactNumber.trim() || !values.contactEmail.trim() || !values.businessType) {
      setError("Complete all required business and contact information.");
      return;
    }
    setError("");
    onSave(values, (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "submit");
  };

  return <div className="mf-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="mf-modal mf-form-modal" role="dialog" aria-modal="true" aria-labelledby="application-form-title">
    <div className="mf-modal-heading"><div><div className="mf-overline">MERCHANT APPLICATION</div><h2 id="application-form-title">{initial ? "Update application" : "Create application"}</h2><p>Enter business details and requested processing information.</p></div><button className="mf-close" type="button" onClick={onCancel} aria-label="Close">×</button></div>
    <form className="mf-application-form" onSubmit={submit}><div className="mf-form-section-title">Business details</div>
      <div className="mf-form-grid"><label>Business name *<input value={values.businessName} onChange={(event) => update("businessName", event.target.value)} placeholder="e.g. Juniper Market" required /></label><label>Legal business name *<input value={values.legalBusinessName} onChange={(event) => update("legalBusinessName", event.target.value)} placeholder="Registered legal name" required /></label><label>Business type *<select value={values.businessType} onChange={(event) => update("businessType", event.target.value)} required><option value="">Select business type</option>{businessTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label>Owner / primary contact *<input value={values.ownerName} onChange={(event) => update("ownerName", event.target.value)} placeholder="Full name" required /></label><label>Contact number *<input type="tel" value={values.contactNumber} onChange={(event) => update("contactNumber", event.target.value)} placeholder="+1 (555) 000-0000" required /></label><label>Contact email *<input type="email" value={values.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} placeholder="owner@business.com" required /></label></div>
      <div className="mf-form-section-title mf-form-section-spaced">Requested processing</div><div className="mf-form-grid"><label>Expected monthly volume *<div className="mf-input-prefix"><span>$</span><input type="number" min="0" value={values.requestedMonthlyVolume || ""} onChange={(event) => update("requestedMonthlyVolume", event.target.value)} placeholder="50000" required /></div></label><label>Average transaction *<div className="mf-input-prefix"><span>$</span><input type="number" min="0" value={values.averageTransaction || ""} onChange={(event) => update("averageTransaction", event.target.value)} placeholder="75" required /></div></label></div>
      {error && <p className="mf-inline-error" role="alert">{error}</p>}<div className="mf-modal-actions"><button className="mf-button mf-button-quiet" type="button" onClick={onCancel}>Cancel</button><button className="mf-button mf-button-outline" type="submit" value="draft" disabled={saving}>Save draft</button><button className="mf-button mf-button-primary" type="submit" value="submit" disabled={saving}>{saving ? "Saving…" : initial ? "Save changes" : "Submit application"}</button></div>
    </form>
  </section></div>;
}

export default function ApplicationsPage({ profile, role, newApplication = false, reviewQueue = false }: { profile: UserProfile; role: DemoRole; newApplication?: boolean; reviewQueue?: boolean }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState(() => listApplications(profile, role));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(newApplication);
  const [editing, setEditing] = useState<MerchantApplication | undefined>();
  const [saving, setSaving] = useState(false);
  const [assignedReviewer, setAssignedReviewer] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [error, setError] = useState("");

  const selected = applications.find((item) => item.id === selectedId) ?? null;
  const visibleApplications = useMemo(() => applications.filter((item) => {
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.businessName, item.legalBusinessName, item.ownerName, item.id].some((value) => value.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  }), [applications, search, statusFilter]);
  const reviewers = demoWorkspaceUsers(profile).filter((user) => user.role === "reviewer" && user.status === "Active");

  const refresh = () => setApplications(listApplications(profile, role));
  const handleSave = (values: FormValues, submit: boolean) => {
    setSaving(true);
    try {
      const saved = saveApplication(profile, role, editing?.id ?? null, { ...values, submit });
      refresh();
      setFormOpen(false);
      setEditing(undefined);
      setSelectedId(saved.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the application.");
    } finally { setSaving(false); }
  };

  const handleAssign = () => {
    const reviewer = reviewers.find((item) => item.userId === Number(assignedReviewer));
    if (!selected || !reviewer) return;
    try {
      assignReviewer(selected.id, { userId: reviewer.userId, name: reviewer.name }, role);
      setError("");
      refresh();
    } catch (assignError) { setError(assignError instanceof Error ? assignError.message : "Could not assign reviewer."); }
  };

  const handleDecision = () => {
    if (!selected || !decision) return;
    if (decision !== "APPROVE" && !reviewNote.trim()) { setError("Add a decision note before requesting information or rejecting."); return; }
    try {
      recordReviewDecision(selected.id, decision, reviewNote, profile, role);
      setReviewing(false);
      setDecision(null);
      setReviewNote("");
      setError("");
      refresh();
    } catch (decisionError) { setError(decisionError instanceof Error ? decisionError.message : "Could not record the decision."); }
  };

  const closeForm = () => { setFormOpen(false); setEditing(undefined); if (newApplication) navigate("/demo/dashboard/applications"); };
  const heading = reviewQueue ? "Review queue" : role === "sales" ? "My applications" : "Merchant applications";
  const canEdit = (item: MerchantApplication) => role === "admin" || (role === "sales" && item.createdByUserId === profile.userId && ["DRAFT", "NEEDS_INFO"].includes(item.status));

  return <div className="mf-page">
    <div className="mf-page-heading"><div><div className="mf-overline">{reviewQueue ? "RISK & UNDERWRITING" : "MERCHANTS"}</div><h1>{heading}</h1><p>{reviewQueue ? "Review only applications assigned to your account." : role === "sales" ? "Create and track applications you submitted." : "Manage merchant onboarding from submission through decision."}</p></div>{(role === "sales" || role === "admin") && !reviewQueue && <button className="mf-button mf-button-primary" onClick={() => { setEditing(undefined); setFormOpen(true); }}>＋ New application</button>}</div>
    <section className="mf-panel mf-list-panel"><div className="mf-list-toolbar"><label className="mf-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search merchants, owners, or ID" /></label><label className="mf-filter-label">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All statuses</option>{Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><span className="mf-result-count">{visibleApplications.length} {visibleApplications.length === 1 ? "application" : "applications"}</span></div>
      {visibleApplications.length ? <div className="mf-table-scroll"><table className="mf-table"><thead><tr><th>MERCHANT</th><th>BUSINESS TYPE</th><th>OWNER / CONTACT</th><th>VOLUME / MO.</th><th>RISK</th><th>STATUS</th><th>UPDATED</th><th /></tr></thead><tbody>{visibleApplications.map((item) => <tr key={item.id}><td><button className="mf-merchant-cell" onClick={() => setSelectedId(item.id)}><span className="mf-merchant-avatar">{item.businessName.slice(0, 1).toUpperCase()}</span><span><strong>{item.businessName}</strong><small>{item.id}</small></span></button></td><td>{item.businessType}</td><td><strong>{item.ownerName}</strong><small>{item.contactEmail}</small></td><td>${item.requestedMonthlyVolume.toLocaleString()}</td><td><span className={`mf-risk mf-risk-${item.riskStatus.toLowerCase()}`}>{item.riskStatus}</span></td><td><Status status={item.status} /></td><td>{new Date(item.updatedAt).toLocaleDateString()}</td><td><button className="mf-row-action" onClick={() => setSelectedId(item.id)} aria-label={`Open ${item.businessName}`}>›</button></td></tr>)}</tbody></table></div> : <div className="mf-empty"><span className="mf-empty-icon">⌕</span><strong>No matching applications</strong><span>Adjust your search or filters, or create a new application.</span></div>}
    </section>
    <div className="mf-demo-notice">Preview records are stored in this browser. Production access rules and records must be enforced by the API.</div>

    {formOpen && <ApplicationForm initial={editing} onCancel={closeForm} onSave={handleSave} saving={saving} />}

    {selected && !reviewing && <div className="mf-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelectedId(null); setError(""); } }}><section className="mf-modal mf-detail-modal" role="dialog" aria-modal="true" aria-labelledby="application-detail-title"><div className="mf-modal-heading"><div><div className="mf-overline">APPLICATION · {selected.id}</div><h2 id="application-detail-title">{selected.businessName}</h2><p>{selected.legalBusinessName}</p></div><button className="mf-close" onClick={() => { setSelectedId(null); setError(""); }} aria-label="Close">×</button></div>
      <div className="mf-detail-status"><Status status={selected.status} /><span className={`mf-risk mf-risk-${selected.riskStatus.toLowerCase()}`}>Risk: {selected.riskStatus}</span></div><div className="mf-detail-grid"><div><small>BUSINESS TYPE</small><strong>{selected.businessType}</strong></div><div><small>OWNER / CONTACT</small><strong>{selected.ownerName}</strong></div><div><small>CONTACT NUMBER</small><strong>{selected.contactNumber}</strong></div><div><small>CONTACT EMAIL</small><strong>{selected.contactEmail}</strong></div><div><small>REQUESTED MONTHLY VOLUME</small><strong>${selected.requestedMonthlyVolume.toLocaleString()}</strong></div><div><small>AVERAGE TRANSACTION</small><strong>${selected.averageTransaction.toLocaleString()}</strong></div><div><small>CREATED BY</small><strong>{selected.createdByName}</strong></div><div><small>ASSIGNED REVIEWER</small><strong>{selected.assignedReviewerName ?? "Unassigned"}</strong></div><div><small>CREATED</small><strong>{new Date(selected.createdAt).toLocaleString()}</strong></div><div><small>LAST UPDATED</small><strong>{new Date(selected.updatedAt).toLocaleString()}</strong></div></div>
      {selected.reviewNote && <div className="mf-review-note"><strong>Review note</strong><p>{selected.reviewNote}</p></div>}{error && <p className="mf-inline-error" role="alert">{error}</p>}
      {role === "admin" && ["SUBMITTED", "IN_REVIEW", "NEEDS_INFO"].includes(selected.status) && <div className="mf-assign-row"><label>Assign reviewer<select value={assignedReviewer} onChange={(event) => setAssignedReviewer(event.target.value)}><option value="">Choose a reviewer</option>{reviewers.map((reviewer) => <option value={reviewer.userId} key={reviewer.userId}>{reviewer.name} · {roleLabels[reviewer.role]}</option>)}</select></label><button className="mf-button mf-button-outline" onClick={handleAssign} disabled={!assignedReviewer}>Assign</button></div>}
      <div className="mf-modal-actions"><button className="mf-button mf-button-quiet" onClick={() => setSelectedId(null)}>Close</button>{canEdit(selected) && <button className="mf-button mf-button-outline" onClick={() => { setEditing(selected); setFormOpen(true); setSelectedId(null); }}>Edit application</button>}{role === "reviewer" && selected.assignedReviewerUserId === profile.userId && selected.status === "IN_REVIEW" && <button className="mf-button mf-button-primary" onClick={() => setReviewing(true)}>Make decision</button>}</div>
    </section></div>}

    {selected && reviewing && <div className="mf-modal-backdrop"><section className="mf-modal mf-decision-modal" role="dialog" aria-modal="true" aria-labelledby="decision-title"><div className="mf-modal-heading"><div><div className="mf-overline">RISK DECISION · {selected.id}</div><h2 id="decision-title">{selected.businessName}</h2><p>Record a decision for this assigned application.</p></div><button className="mf-close" onClick={() => setReviewing(false)} aria-label="Close">×</button></div><label className="mf-field-label">Decision<select value={decision ?? ""} onChange={(event) => setDecision(event.target.value as ReviewDecision)}><option value="">Select a decision</option><option value="APPROVE">Approve application</option><option value="REQUEST_INFO">Request more information</option><option value="REJECT">Reject application</option></select></label><label className="mf-field-label">Decision note<textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={4} placeholder="Summarize the risk rationale and next steps…" /></label>{error && <p className="mf-inline-error" role="alert">{error}</p>}<div className="mf-modal-actions"><button className="mf-button mf-button-quiet" onClick={() => setReviewing(false)}>Cancel</button><button className="mf-button mf-button-primary" onClick={handleDecision} disabled={!decision}>Record decision</button></div></section></div>}
  </div>;
}
