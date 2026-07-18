import { useState } from "react";
import {
  AlertTriangle,
  CreditCard,
  Download,
  Info,
  Lock,
  Smartphone,
  Trash2,
} from "lucide-react";
import { money, transactions } from "../data";
import { FilterChips, Modal } from "../components";
import { useApp } from "../context";
import { useAuth } from "../auth";
import { PageTitle } from "./discovery";

export function EarningsPage() {
  const [withdraw, setWithdraw] = useState(false);
  const { toast } = useApp();
  return (
    <div className="page">
      <PageTitle
        eyebrow="CREATOR EARNINGS · DEMO"
        title="Your earnings"
        text="A preview of future earnings and M-Pesa payouts."
      />
      <div className="balance-hero">
        <div>
          <span>Available balance</span>
          <strong>{money(12840)}</strong>
          <small>Demo balance · Last updated today</small>
        </div>
        <button className="btn btn-white" onClick={() => setWithdraw(true)}>
          <Download /> Withdraw
        </button>
      </div>
      <div className="money-stats">
        <div>
          <span>Pending</span>
          <b>{money(4260)}</b>
        </div>
        <div>
          <span>Lifetime earnings</span>
          <b>{money(186500)}</b>
        </div>
        <div>
          <span>Payout method</span>
          <b>
            <Smartphone /> M-Pesa ··· 472
          </b>
        </div>
      </div>
      <section className="panel">
        <div className="section-head">
          <h2>Recent transactions</h2>
          <span className="demo-pill">DEMO DATA</span>
        </div>
        <div className="transactions">
          {transactions.map((x) => (
            <div key={x.id}>
              <span className={x.amount < 0 ? "out" : "in"}>
                {x.amount < 0 ? <Download /> : <CreditCard />}
              </span>
              <div>
                <b>
                  {x.type} · {x.name}
                </b>
                <small>
                  {x.date} · {x.id}
                </small>
              </div>
              <strong className={x.amount < 0 ? "negative" : ""}>
                {x.amount < 0 ? "-" : "+"}
                {money(Math.abs(x.amount))}
              </strong>
            </div>
          ))}
        </div>
      </section>
      <div className="fee-note">
        <Info />
        <p>
          <b>Simple, transparent fees.</b> Jukwaa’s planned platform fee is 10%
          on creator support. Minimum withdrawal will be {money(500)}. Final
          terms may change before launch.
        </p>
      </div>
      <Modal
        open={withdraw}
        onClose={() => setWithdraw(false)}
        title="Demo withdrawal"
      >
        <div className="withdrawal">
          <Smartphone />
          <p>
            Withdraw <b>{money(12840)}</b> to M-Pesa ending in 472?
          </p>
          <button
            className="btn btn-accent full"
            onClick={() => {
              toast("Demo only — no withdrawal was processed");
              setWithdraw(false);
            }}
          >
            Confirm demo withdrawal
          </button>
          <small>
            No transaction will be initiated. Payouts arrive in Phase 2.
          </small>
        </div>
      </Modal>
    </div>
  );
}

export function SettingsPage() {
  const { appearance, setAppearance, lowData, setLowData, toast } = useApp();
  const { user, logoutAll } = useAuth();
  const [autoplay, setAutoplay] = useState(true),
    [del, setDel] = useState(false);
  return (
    <div className="page settings-page">
      <PageTitle
        eyebrow="MAKE IT YOURS"
        title="Settings"
        text="Tune your profile, streams and viewing experience."
      />
      <div className="settings-layout">
        <nav>
          {[
            "Profile",
            "Stream preferences",
            "Notifications",
            "Language",
            "Privacy",
            "Safety",
            "Appearance",
            "Payout settings",
          ].map((x) => (
            <a key={x} href={`#${x.toLowerCase().replace(" ", "-")}`}>
              {x}
            </a>
          ))}
        </nav>
        <div className="settings-content">
          <SettingSection title="Account identity" id="profile">
            <div className="identity-card">
              <span className="user-avatar">
                {user?.displayName.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <b>{user?.displayName}</b>
                <small>
                  @{user?.username} · {user?.email}
                </small>
                <span
                  className={
                    user?.emailVerified
                      ? "verified-status"
                      : "unverified-status"
                  }
                >
                  {user?.emailVerified
                    ? "Email verified"
                    : "Email not yet verified"}
                </span>
              </div>
            </div>
            <p className="identity-note">
              Profile editing will arrive in a later stage. Your authenticated
              account details are shown here read-only.
            </p>
            <button className="btn btn-muted" onClick={() => logoutAll()}>
              Sign out on all devices
            </button>
          </SettingSection>
          <SettingSection title="Stream preferences" id="stream-preferences">
            <Toggle
              label="Autoplay live streams"
              detail="Start playback automatically on Wi-Fi"
              value={autoplay}
              set={setAutoplay}
            />
            <Toggle
              label="Low-data mode"
              detail="Prefer lower quality and disable autoplay previews"
              value={lowData}
              set={setLowData}
            />
            <label>
              Default stream quality
              <select>
                <option>Auto</option>
                <option>720p</option>
                <option>480p</option>
                <option>360p</option>
              </select>
            </label>
            <label>
              Chat visibility
              <select>
                <option>Always show</option>
                <option>Remember last choice</option>
                <option>Hidden by default</option>
              </select>
            </label>
          </SettingSection>
          <SettingSection title="Notifications" id="notifications">
            <Toggle
              label="Creators going live"
              detail="Get notified when followed creators start"
              value={true}
              set={() => toast("Notification preference updated")}
            />
            <Toggle
              label="Event reminders"
              detail="Scheduled events and tournaments"
              value={true}
              set={() => toast("Notification preference updated")}
            />
          </SettingSection>
          <SettingSection title="Language" id="language">
            <label>
              Interface language
              <select>
                <option>English</option>
                <option>Kiswahili</option>
              </select>
            </label>
          </SettingSection>
          <SettingSection title="Privacy & safety" id="privacy">
            <div className="setting-row">
              <span>
                <b>Blocked users</b>
                <small>No users blocked</small>
              </span>
              <button className="btn btn-muted">Manage</button>
            </div>
            <div className="setting-row">
              <span>
                <b>Two-factor authentication</b>
                <small>Planned for Phase 2</small>
              </span>
              <span className="planned">
                <Lock /> Planned
              </span>
            </div>
          </SettingSection>
          <SettingSection title="Appearance" id="appearance">
            <FilterChips
              options={["Dark", "Light", "System"]}
              value={appearance[0].toUpperCase() + appearance.slice(1)}
              onChange={(v) => setAppearance(v.toLowerCase())}
            />
          </SettingSection>
          <SettingSection title="Payout settings" id="payout-settings">
            <div className="setting-row">
              <span>
                <b>M-Pesa payout method</b>
                <small>+254 7•• ••• 472 · Demo</small>
              </span>
              <button className="btn btn-muted">Edit</button>
            </div>
          </SettingSection>
          <section className="danger-zone">
            <AlertTriangle />
            <div>
              <h2>Delete account</h2>
              <p>Permanently remove your Jukwaa profile and demo data.</p>
            </div>
            <button className="btn danger" onClick={() => setDel(true)}>
              <Trash2 /> Delete
            </button>
          </section>
        </div>
      </div>
      <Modal
        open={del}
        onClose={() => setDel(false)}
        title="Delete demo account?"
      >
        <p>
          This is a frontend demo. Confirming will only show a notification; no
          data will be deleted.
        </p>
        <button
          className="btn danger full"
          onClick={() => {
            toast("Demo account deletion simulated");
            setDel(false);
          }}
        >
          I understand, delete demo account
        </button>
      </Modal>
    </div>
  );
}
function SettingSection({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section className="setting-section" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function Toggle({
  label,
  detail,
  value,
  set,
}: {
  label: string;
  detail: string;
  value: boolean;
  set: (v: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>
        <b>{label}</b>
        <small>{detail}</small>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={value}
        onChange={(e) => set(e.target.checked)}
      />
    </label>
  );
}
