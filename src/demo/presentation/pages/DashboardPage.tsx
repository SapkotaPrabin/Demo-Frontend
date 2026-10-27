import { useEffect, useState } from "react";
import { AppstoreOutlined, FileDoneOutlined, LogoutOutlined, PlusOutlined, SafetyCertificateOutlined, TeamOutlined } from "@ant-design/icons";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearAccessToken, readAccessToken, roleFromProfile, roleLabels, type DemoRole, type UserProfile } from "../../business/auth";
import { getProfile } from "../../infrastructure/AuthApi";
import merchFlowLogo from "../../../assets/images/logo-square.png";
import ApplicationsPage from "../views/ApplicationsPage";
import OverviewPage from "../views/OverviewPage";
import UsersPage from "../views/UsersPage";
import "../styles/demo.css";

interface NavItem { label: string; to: string; icon: typeof AppstoreOutlined; match: (pathname: string) => boolean }

const navigationFor = (role: DemoRole): NavItem[] => {
  const items: NavItem[] = [{ label: "Overview", to: "/demo/dashboard", icon: AppstoreOutlined, match: (path) => path === "/demo/dashboard" }];
  if (role === "admin") items.push({ label: "Applications", to: "/demo/dashboard/applications", icon: FileDoneOutlined, match: (path) => path.startsWith("/demo/dashboard/applications") });
  if (role === "reviewer") items.push({ label: "Review queue", to: "/demo/dashboard/review", icon: SafetyCertificateOutlined, match: (path) => path.startsWith("/demo/dashboard/review") });
  if (role === "sales") items.push({ label: "My applications", to: "/demo/dashboard/applications", icon: FileDoneOutlined, match: (path) => path.startsWith("/demo/dashboard/applications") });
  if (role === "admin") items.push({ label: "Team members", to: "/demo/dashboard/users", icon: TeamOutlined, match: (path) => path.startsWith("/demo/dashboard/users") });
  return items;
};

function RestrictedPage({ message }: { message: string }) {
  return <div className="mf-page"><section className="mf-panel mf-access-denied"><span>🔒</span><h1>Access restricted</h1><p>{message}</p></section></div>;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = readAccessToken();
    if (!accessToken) {
      navigate("/", { replace: true });
      return;
    }
    let active = true;
    getProfile(accessToken)
      .then((userProfile) => {
        if (active && roleFromProfile(userProfile)) setProfile(userProfile);
        else if (active) throw new Error("Your account role does not have a dashboard yet.");
      })
      .catch((error: unknown) => {
        clearAccessToken();
        if (active) {
          const authError = error instanceof Error ? error.message : "Your session has expired. Please sign in again.";
          navigate("/", { replace: true, state: { authError } });
        }
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [navigate]);

  if (loading) return <main className="workspace-loading"><span className="workspace-loading-mark">M</span><p>Loading your MerchFlow workspace…</p></main>;
  const role = profile ? roleFromProfile(profile) : null;
  if (!profile || !role) return null;

  const name = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ") || profile.email;
  const initials = name.split(/[\s._-]+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const pathname = location.pathname;
  const title = pathname.includes("/users") ? "Team members" : pathname.includes("/review") ? "Review queue" : pathname.includes("/applications") ? (pathname.endsWith("/new") ? "New application" : role === "sales" ? "My applications" : "Applications") : "Overview";
  const logout = () => { clearAccessToken(); navigate("/", { replace: true }); };

  return <div className="mf-shell">
    <aside className="mf-sidebar">
      <Link to="/demo/dashboard" className="mf-sidebar-brand"><img src={merchFlowLogo} alt="MerchFlow" /></Link>
      <div className="mf-workspace-switch"><span className="mf-workspace-symbol">M</span><span><strong>Merchant operations</strong><small>{roleLabels[role]} workspace</small></span><span className="mf-switch-caret">⌄</span></div>
      <div className="mf-sidebar-label">WORKSPACE</div>
      <nav className="mf-nav" aria-label="Workspace navigation">{navigationFor(role).map(({ label, to, icon: Icon, match }) => <NavLink key={to} to={to} end={to === "/demo/dashboard"} className={() => `mf-nav-link ${match(pathname) ? "active" : ""}`}><Icon /><span>{label}</span>{label === "Review queue" && <span className="mf-nav-count">{role === "reviewer" ? "3" : ""}</span>}</NavLink>)}</nav>
      {(role === "sales" || role === "admin") && <Link className="mf-sidebar-create" to="/demo/dashboard/applications/new"><PlusOutlined /><span>New application</span></Link>}
      <div className="mf-sidebar-bottom"><div className="mf-sidebar-help"><span className="mf-help-mark">i</span><strong>Need a hand?</strong><p>Find guidance on applications and reviews.</p><a href="mailto:support@merchflow.example">Contact support <span>↗</span></a></div><button className="mf-account-button" onClick={logout}><span className="mf-account-avatar">{initials}</span><span className="mf-account-copy"><strong>{name}</strong><small>{profile.email}</small></span><LogoutOutlined aria-label="Sign out" /></button></div>
    </aside>
    <main className="mf-main"><header className="mf-topbar"><div className="mf-crumb"><span>MerchFlow</span><span>/</span><strong>{title}</strong></div><div className="mf-topbar-actions"><span className="mf-topbar-environment"><i /> Secure workspace</span><span className="mf-topbar-avatar">{initials}</span></div></header>
      {pathname.endsWith("/users") && role !== "admin" ? <RestrictedPage message="Only administrators can view and manage team accounts." />
        : pathname.includes("/review") && role !== "reviewer" ? <RestrictedPage message="The review queue is available to reviewers only." />
          : pathname.endsWith("/users") ? <UsersPage profile={profile} role={role} />
        : pathname.includes("/review") ? <ApplicationsPage profile={profile} role={role} reviewQueue />
          : pathname.includes("/applications") ? <ApplicationsPage key={pathname} profile={profile} role={role} newApplication={pathname.endsWith("/new")} />
            : <OverviewPage profile={profile} role={role} />}
    </main>
  </div>;
}
