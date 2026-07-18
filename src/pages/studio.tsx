import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Check,
  CircleDollarSign,
  Edit3,
  ExternalLink,
  Radio,
  Users,
} from "lucide-react";
import { useAuth } from "../auth";
import { useCreator } from "../creator";
import { authApi } from "../api/auth";
import { PageTitle } from "./discovery";

const nav = [
  ["/dashboard", "Overview"],
  ["/dashboard/content", "Content"],
  ["/dashboard/analytics", "Analytics"],
  ["/wallet", "Earnings"],
  ["/dashboard", "Schedule"],
  ["/settings", "Settings"],
];

export function DashboardPage() {
  const { user } = useAuth();
  const { creator, channel, isLoadingCreator } = useCreator();
  if (isLoadingCreator) return <div className="auth-loading">Loading your creator account…</div>;
  if (!creator || !channel) return <CreatorOnboarding />;
  return (
    <div className="page">
      <StudioNav />
      <div className="dashboard-title real-dashboard-title">
        <PageTitle
          eyebrow="CREATOR STUDIO"
          title="Welcome to your Creator Dashboard"
          text={`${channel.name} is ready. Your real creator metrics start at zero.`}
        />
        <div className="dashboard-actions">
          <Link className="btn btn-muted" to={`/channel/${channel.slug}`}><ExternalLink /> View channel</Link>
          <Link className="btn btn-muted" to="/settings#channel"><Edit3 /> Edit channel</Link>
          <Link className="btn btn-accent" to="/go-live"><Radio /> Go live</Link>
        </div>
      </div>
      <section className="channel-summary panel">
        <span className="user-avatar">{user?.displayName.slice(0, 2).toUpperCase()}</span>
        <div><small>CHANNEL</small><h2>{channel.name}</h2><Link to={`/channel/${channel.slug}`}>jukwaa.live/channel/{channel.slug}</Link></div>
        <span className={`status-pill ${creator.status.toLowerCase()}`}>{creator.status}</span>
      </section>
      <div className="stat-grid honest-stats">
        <ZeroStat label="Followers" icon={Users} />
        <ZeroStat label="Streams" icon={Radio} />
        <ZeroStat label="Hours streamed" icon={Activity} />
        <ZeroStat label="Earnings" icon={CircleDollarSign} unavailable />
      </div>
      <div className="dashboard-grid">
        <section className="panel dashboard-zero"><Radio /><h2>Streaming foundation ready</h2><p>Prepare a real stream record, then use the development mock provider to test the provider-confirmed lifecycle. Mock mode does not deliver video.</p><Link className="btn btn-accent" to="/go-live">Open Creator Studio</Link></section>
        <section className="panel dashboard-zero"><Users /><h2>Build your first audience</h2><p>Share your public channel URL. Followers and community activity will start from zero.</p><button className="btn btn-muted" onClick={() => navigator.clipboard?.writeText(`${location.origin}/channel/${channel.slug}`)}>Copy channel link</button></section>
      </div>
    </div>
  );
}

function CreatorOnboarding() {
  const { user } = useAuth();
  const { createCreator } = useCreator();
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [resent, setResent] = useState(false);
  const normalizedSlug = form.slug.trim().toLowerCase().replace(/\s+/g, "-");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user?.emailVerified) return;
    setBusy(true); setError("");
    try {
      await createCreator({ name: form.name, slug: normalizedSlug, description: form.description });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create your channel");
    } finally { setBusy(false); }
  }
  async function resend() {
    if (!user) return;
    await authApi.resendVerification(user.email);
    setResent(true);
  }
  return (
    <div className="page creator-onboarding-page">
      <StudioNav />
      <div className="onboarding-layout">
        <section>
          <span className="eyebrow">CREATOR ONBOARDING</span>
          <h1>Become a Jukwaa Creator</h1>
          <p>Create your channel and start building your audience. Monetisation is separate and is not part of this step.</p>
          <div className="creator-requirements">
            <div className="met"><Check /> Account created</div>
            <div className={user?.emailVerified ? "met" : "required"}>{user?.emailVerified ? <Check /> : <span>!</span>} {user?.emailVerified ? "Email verified" : "Email verification required"}</div>
          </div>
          {!user?.emailVerified && <div className="verification-callout"><div><b>Verify your email before creating a channel.</b><p>Open the verification link sent to {user?.email}.</p></div><button className="btn btn-muted" onClick={resend} disabled={resent}>{resent ? "Verification sent" : "Resend verification"}</button></div>}
        </section>
        <form className="creator-onboarding-form" onSubmit={submit}>
          <h2>Create your channel</h2>
          {error && <div className="form-error" role="alert">{error}</div>}
          <label>Channel name<input value={form.name} onChange={(event) => setForm(current => ({ ...current, name: event.target.value }))} maxLength={100} required placeholder="Samuel Plays" /></label>
          <label>Channel URL<input value={form.slug} onChange={(event) => setForm(current => ({ ...current, slug: event.target.value }))} minLength={3} maxLength={80} pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*" required placeholder="samuel-plays" /><small>Lowercase letters, numbers and single hyphens.</small></label>
          <div className="channel-url-preview"><span>YOUR CHANNEL</span><b>jukwaa.live/channel/{normalizedSlug || "your-channel"}</b></div>
          <label>Description <span>Optional</span><textarea value={form.description} onChange={(event) => setForm(current => ({ ...current, description: event.target.value }))} maxLength={1000} placeholder="Tell viewers what your channel is about." /></label>
          <button className="btn btn-accent full" disabled={busy || !user?.emailVerified}>{busy ? "Creating channel…" : <>Create My Channel <ArrowRight /></>}</button>
        </form>
      </div>
    </div>
  );
}

function StudioNav() { return <nav className="studio-subnav" aria-label="Creator Dashboard">{nav.map(([to, label]) => <Link className={label === "Overview" ? "active" : ""} to={to} key={label}>{label}</Link>)}</nav>; }
function ZeroStat({ label, icon: Icon, unavailable = false }: { label: string; icon: typeof Users; unavailable?: boolean }) { return <article><Icon /><span>{label}</span><strong>{unavailable ? "Unavailable" : "0"}</strong><small>Real account data</small></article>; }
