import { Link } from "react-router-dom";
import {
  Activity,
  Calendar,
  Eye,
  Radio,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { money, transactions } from "../data";
import { PageTitle } from "./discovery";
import { useAuth } from "../auth";
const stats = [
  ["Current followers", "28.6K", Users],
  ["Total views", "610K", Eye],
  ["Hours streamed", "186h", Activity],
  ["Estimated demo earnings", "KES 42.8K", WalletCards],
  ["Avg. concurrent", "1,840", Activity],
] as const;
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
  return (
    <div className="page">
      <nav className="studio-subnav" aria-label="Creator Dashboard">
        {nav.map(([to, label]) => (
          <Link
            className={label === "Overview" ? "active" : ""}
            to={to}
            key={label}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="dashboard-title">
        <PageTitle
          eyebrow="CREATOR STUDIO"
          title={`Good evening, ${user?.displayName ?? "creator"}.`}
          text="Your community grew 12% this month."
        />
        <Link className="btn btn-accent" to="/go-live">
          <Radio /> Go live
        </Link>
      </div>
      <div className="stat-grid">
        {stats.map(([label, value, Icon]) => (
          <article key={label}>
            <Icon />
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Demo data</small>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel title="Recent streams">
          <div className="table-list">
            {[
              "Building a biashara app",
              "Portfolio reviews live",
              "React state without stress",
            ].map((x, i) => (
              <Link to="/dashboard/content" key={x}>
                <span>
                  <b>{x}</b>
                  <small>
                    {12 - i * 3} Jul · {2 + i}h
                  </small>
                </span>
                <strong>{4.2 - i * 0.6}K viewers</strong>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel title="Upcoming schedule">
          <div className="table-list">
            {["React clinic", "Career Q&A", "Build night"].map((x, i) => (
              <div key={x}>
                <Calendar />
                <span>
                  <b>{x}</b>
                  <small>
                    {["Thu 8:00 PM", "Sat 4:00 PM", "Tue 8:00 PM"][i]}
                  </small>
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent supporters">
          <div className="table-list">
            {transactions.slice(0, 4).map((x) => (
              <div key={x.id}>
                <span>
                  <b>{x.name}</b>
                  <small>{x.date}</small>
                </span>
                <strong>{money(Math.abs(x.amount))}</strong>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Moderation pulse">
          <div className="moderation">
            <ShieldCheck />
            <div>
              <b>Chat is healthy</b>
              <p>3 messages removed · 1 timeout · 0 bans this week.</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
