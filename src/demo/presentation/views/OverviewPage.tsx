import { useEffect, useState } from "react";
import { ArrowRightOutlined, ClockCircleOutlined, FileDoneOutlined, SafetyCertificateOutlined, TeamOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { readAccessToken, type DemoRole, type UserProfile } from "../../business/auth";
import { listApplicationsApi } from "../../infrastructure/AuthApi";
import type { MerchantApplication } from "../../business/merchantApplication";

const statusLabels: Record<MerchantApplication["status"], string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  IN_REVIEW: "In review",
  NEEDS_INFO: "Needs information",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

function StatusBadge({ status }: { status: MerchantApplication["status"] }) {
  return <span className={`mf-status mf-status-${status.toLowerCase()}`}>{statusLabels[status]}</span>;
}

export default function OverviewPage({ profile, role }: { profile: UserProfile; role: DemoRole }) {
  const [applications, setApplications] = useState<MerchantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = readAccessToken();
    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      setLoading(false);
      return;
    }
    let active = true;
    listApplicationsApi(accessToken)
      .then((items) => {
        if (active) {
          setApplications(items);
          setError("");
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load applications.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const counts = {
    total: applications.length,
    inReview: applications.filter((item) => item.status === "IN_REVIEW").length,
    approved: applications.filter((item) => item.status === "APPROVED").length,
    needsAttention: applications.filter((item) => item.status === "NEEDS_INFO" || item.riskStatus === "HIGH").length,
  };
  const name = profile.firstName || profile.email.split("@")[0];
  const metrics = role === "reviewer"
    ? [{ label: "Assigned to me", value: counts.total, icon: FileDoneOutlined, tone: "indigo" }, { label: "Awaiting decision", value: counts.inReview, icon: ClockCircleOutlined, tone: "amber" }, { label: "Decisions this week", value: counts.approved, icon: SafetyCertificateOutlined, tone: "green" }, { label: "High risk", value: counts.needsAttention, icon: TeamOutlined, tone: "rose" }]
    : role === "sales"
      ? [{ label: "My applications", value: counts.total, icon: FileDoneOutlined, tone: "indigo" }, { label: "In review", value: counts.inReview, icon: ClockCircleOutlined, tone: "amber" }, { label: "Approved", value: counts.approved, icon: SafetyCertificateOutlined, tone: "green" }, { label: "Needs information", value: counts.needsAttention, icon: TeamOutlined, tone: "rose" }]
      : [{ label: "Total applications", value: counts.total, icon: FileDoneOutlined, tone: "indigo" }, { label: "In review", value: counts.inReview, icon: ClockCircleOutlined, tone: "amber" }, { label: "Approved", value: counts.approved, icon: SafetyCertificateOutlined, tone: "green" }, { label: "Needs attention", value: counts.needsAttention, icon: TeamOutlined, tone: "rose" }];

  return (
    <div className="mf-page">
      <div className="mf-page-heading">
        <div><div className="mf-overline">OVERVIEW</div><h1>Good to see you, {name}</h1><p>Here’s the latest across your merchant portfolio.</p></div>
        {(role === "admin" || role === "sales") && <Link className="mf-button mf-button-primary" to="/demo/dashboard/applications/new">Create application <span>＋</span></Link>}
      </div>

      <section className="mf-metric-grid" aria-label="Application summary">
        {metrics.map(({ label, value, icon: Icon, tone }) => <article className="mf-metric-card" key={label}><div className="mf-metric-label">{label}<span className={`mf-metric-icon ${tone}`}><Icon /></span></div><strong>{loading ? "—" : value}</strong></article>)}
      </section>

      <section className="mf-panel mf-recent-panel">
        <div className="mf-panel-heading"><div><h2>{role === "reviewer" ? "Your review queue" : role === "sales" ? "Your applications" : "Recent applications"}</h2><p>Track status and move work forward.</p></div><Link to={role === "reviewer" ? "/demo/dashboard/review" : "/demo/dashboard/applications"}>View all <ArrowRightOutlined /></Link></div>
        {error && <div className="mf-empty" role="alert"><strong>Could not load applications</strong><span>{error}</span></div>}
        {!error && loading && <div className="mf-empty"><strong>Loading applications…</strong></div>}
        {!error && !loading && (applications.length ? <div className="mf-table-scroll"><table className="mf-table"><thead><tr><th>MERCHANT</th><th>BUSINESS TYPE</th><th>OWNER</th><th>STATUS</th><th>UPDATED</th></tr></thead><tbody>{applications.slice(0, 5).map((item) => <tr key={item.id}><td><strong>{item.businessName}</strong><small>{item.id}</small></td><td>{item.businessType}</td><td>{item.ownerName}</td><td><StatusBadge status={item.status} /></td><td>{new Date(item.updatedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <div className="mf-empty"><FileDoneOutlined /><strong>No applications yet</strong><span>New merchant applications will appear here.</span></div>)}
      </section>

      <div className="mf-overview-bottom">
        <section className="mf-panel mf-quick-panel"><div className="mf-panel-heading"><div><h2>Quick actions</h2><p>Common tasks for your role.</p></div></div><div className="mf-quick-actions">
          {(role === "admin" || role === "sales") && <Link to="/demo/dashboard/applications/new"><span className="mf-quick-icon violet">＋</span><span><strong>Start an application</strong><small>Capture a new merchant</small></span><ArrowRightOutlined /></Link>}
          {role === "reviewer" && <Link to="/demo/dashboard/review"><span className="mf-quick-icon amber"><SafetyCertificateOutlined /></span><span><strong>Review an application</strong><small>Record a risk decision</small></span><ArrowRightOutlined /></Link>}
          {role === "admin" && <Link to="/demo/dashboard/users"><span className="mf-quick-icon blue"><TeamOutlined /></span><span><strong>Manage team access</strong><small>Review roles and account status</small></span><ArrowRightOutlined /></Link>}
          <Link to={role === "reviewer" ? "/demo/dashboard/review" : "/demo/dashboard/applications"}><span className="mf-quick-icon green"><FileDoneOutlined /></span><span><strong>{role === "reviewer" ? "Open review queue" : "Browse applications"}</strong><small>{role === "sales" ? "Your submitted merchants" : "Find a merchant record"}</small></span><ArrowRightOutlined /></Link>
        </div></section>
        <section className="mf-panel mf-role-panel"><div className="mf-panel-heading"><div><h2>Access summary</h2><p>Your workspace permissions</p></div></div><div className="mf-role-summary"><span className="mf-role-badge">{role.toUpperCase()}</span><strong>{role === "admin" ? "Full operational access" : role === "reviewer" ? "Assigned risk reviews" : "Your merchant applications"}</strong><p>{role === "admin" ? "Manage applications, assign reviewers, and view team access." : role === "reviewer" ? "Review only applications assigned to your account." : "Create and update applications you have submitted."}</p></div></section>
      </div>
      <div className="mf-demo-notice">Application totals and recent records are loaded from the applications API.</div>
    </div>
  );
}
