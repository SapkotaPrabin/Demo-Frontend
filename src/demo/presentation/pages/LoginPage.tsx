import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAccessToken, readAccessToken, saveAccessToken } from "../../business/auth";
import { login } from "../../infrastructure/AuthApi";
import merchFlowLogo from "../../../assets/images/logo-square.png";
import "../styles/demo.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => (location.state as { authError?: string } | null)?.authError ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (readAccessToken()) navigate("/demo/dashboard", { replace: true });
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (!contactNumber.trim() || !password) {
      setError("Enter your contact number and password to continue.");
      return;
    }

    setLoading(true);
    setError("");
    clearAccessToken();
    try {
      const auth = await login(contactNumber.trim(), password);
      saveAccessToken(auth.accessToken);
      navigate("/demo/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="demo-login-page">
      <section className="demo-login-card" aria-labelledby="login-title">
        <div className="demo-brand"><img className="demo-brand-logo" src={merchFlowLogo} alt="MerchFlow" /></div>
        <p className="demo-eyebrow">MERCHANT OPERATIONS</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="demo-muted">Sign in to manage applications, reviews, and merchant risk.</p>

        <form className="demo-login-form" onSubmit={handleSubmit}>
          <label htmlFor="contact-number">Contact number</label>
          <input id="contact-number" type="tel" inputMode="tel" autoComplete="tel" placeholder="Enter your contact number" value={contactNumber} onChange={(event) => setContactNumber(event.target.value)} />

          <div className="demo-label-row"><label htmlFor="password">Password</label><a href="#help" onClick={(event) => event.preventDefault()}>Forgot password?</a></div>
          <input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} />

          {error && <p className="demo-form-error" role="alert">{error}</p>}
          <button className="demo-primary-button" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"} <span aria-hidden="true">→</span></button>
        </form>
        <p className="demo-login-footnote">Secure sign-in for your MerchFlow account</p>
      </section>
      <aside className="demo-login-aside">
        <div className="demo-aside-orbit demo-aside-orbit-one" />
        <div className="demo-aside-orbit demo-aside-orbit-two" />
        <div className="demo-aside-content">
          <span className="demo-aside-kicker">MERCHANT ONBOARDING &amp; RISK</span>
          <h2>From application to decision, all in one flow.</h2>
          <p>Keep merchant details, reviews, and risk decisions moving through a clear, accountable workflow.</p>
          <div className="demo-aside-quote"><div className="demo-avatar-stack"><i>AD</i><i>RV</i><i>SL</i></div><span>One workflow for Admin, Reviewer, and Sales teams</span></div>
        </div>
        <span className="demo-aside-caption">MERCHFLOW · MERCHANT OPERATIONS <span>© 2026</span></span>
      </aside>
    </main>
  );
}
