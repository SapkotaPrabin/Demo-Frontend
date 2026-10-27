import { useState, type FormEvent } from "react";
import { TeamOutlined } from "@ant-design/icons";
import { demoWorkspaceUsers, inviteWorkspaceUser } from "../../business/merchantApplication";
import { roleLabels, type DemoRole, type UserProfile } from "../../business/auth";

export default function UsersPage({ profile, role }: { profile: UserProfile; role: DemoRole }) {
  const [users, setUsers] = useState(() => demoWorkspaceUsers(profile));
  const [inviteOpen, setInviteOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [values, setValues] = useState({ name: "", email: "", contactNumber: "", role: "sales" as DemoRole });

  const invite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      inviteWorkspaceUser(profile, values);
      setUsers(demoWorkspaceUsers(profile));
      setInviteOpen(false);
      setSuccess(`Invitation prepared for ${values.email}.`);
      setError("");
      setValues({ name: "", email: "", contactNumber: "", role: "sales" });
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Unable to invite this user.");
    }
  };

  if (role !== "admin") return <div className="mf-page"><section className="mf-panel mf-access-denied"><span>🔒</span><h1>Team access is restricted</h1><p>Only administrators can view and manage team accounts.</p></section></div>;

  return <div className="mf-page">
    <div className="mf-page-heading"><div><div className="mf-overline">ACCESS CONTROL</div><h1>Team members</h1><p>Manage roles and workspace access for your operations team.</p></div><button className="mf-button mf-button-primary" onClick={() => setInviteOpen(true)}>＋ Invite member</button></div>
    <section className="mf-panel mf-list-panel"><div className="mf-user-summary"><span className="mf-user-summary-icon"><TeamOutlined /></span><span><strong>{users.length} team members</strong><small>Admin, reviewer, and sales access</small></span><span className="mf-user-summary-spacer" /><span className="mf-role-badge">ROLE BASED ACCESS</span></div>
      {success && <p className="mf-success-notice" role="status">{success} The invite is saved in this browser preview.</p>}
      <div className="mf-table-scroll"><table className="mf-table"><thead><tr><th>TEAM MEMBER</th><th>CONTACT NUMBER</th><th>ROLE</th><th>STATUS</th><th>USER ID</th><th /></tr></thead><tbody>{users.map((user) => <tr key={user.userId}><td><div className="mf-user-cell"><span className="mf-merchant-avatar">{user.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div></td><td>{user.contactNumber || "—"}</td><td><span className={`mf-role-pill mf-role-${user.role}`}>{roleLabels[user.role]}</span></td><td><span className={`mf-user-status ${user.status === "Active" ? "active" : "invited"}`}><i />{user.status}</span></td><td>MFU-{String(user.userId).padStart(4, "0")}</td><td><button className="mf-row-action" aria-label={`Options for ${user.name}`}>···</button></td></tr>)}</tbody></table></div>
    </section>
    <div className="mf-demo-notice">Team records and invitations are preview data stored in this browser.</div>
    {inviteOpen && <div className="mf-modal-backdrop"><section className="mf-modal mf-form-modal" role="dialog" aria-modal="true" aria-labelledby="invite-title"><div className="mf-modal-heading"><div><div className="mf-overline">TEAM ACCESS</div><h2 id="invite-title">Invite a team member</h2><p>Choose the access role that fits their responsibilities.</p></div><button className="mf-close" onClick={() => setInviteOpen(false)} aria-label="Close">×</button></div><form className="mf-application-form" onSubmit={invite}><div className="mf-form-grid"><label>Full name *<input required value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="Full name" /></label><label>Work email *<input required type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="name@company.com" /></label><label>Contact number<input type="tel" value={values.contactNumber} onChange={(event) => setValues({ ...values, contactNumber: event.target.value })} placeholder="Contact number" /></label><label>Workspace role *<select value={values.role} onChange={(event) => setValues({ ...values, role: event.target.value as DemoRole })}><option value="sales">Sales</option><option value="reviewer">Reviewer</option><option value="admin">Admin</option></select></label></div>{error && <p className="mf-inline-error" role="alert">{error}</p>}<div className="mf-modal-actions"><button className="mf-button mf-button-quiet" type="button" onClick={() => setInviteOpen(false)}>Cancel</button><button className="mf-button mf-button-primary" type="submit">Prepare invitation</button></div></form></section></div>}
  </div>;
}
