import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Compass,
  Gamepad2,
  Heart,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Radio,
  Search,
  Settings,
  UserRound,
  Video,
  WalletCards,
  X,
} from "lucide-react";
import {
  APP,
  creatorById,
  formatCount,
  type Creator,
  type Stream,
  type Clip,
} from "./data";
import { useApp } from "./context";
import { useAuth } from "./auth";

export const Avatar = ({
  creator,
  size = "md",
}: {
  creator: Creator;
  size?: "sm" | "md" | "lg" | "xl";
}) => (
  <span
    className={`avatar avatar-${size}`}
    style={{ background: `linear-gradient(145deg,${creator.accent},#161c19)` }}
    aria-label={`${creator.name} avatar`}
  >
    {creator.name.slice(0, 2).toUpperCase()}
  </span>
);
export const LiveBadge = () => (
  <span className="live-badge">
    <i /> LIVE
  </span>
);
export const ViewerCount = ({ count }: { count: number }) => (
  <span className="viewer">
    <UserRound size={13} />
    {formatCount(count)}
  </span>
);
export function FollowButton({ creatorId }: { creatorId: string }) {
  const { followed, toggleFollow } = useApp();
  const on = followed.has(creatorId);
  return (
    <button
      className={on ? "btn btn-muted" : "btn btn-accent"}
      onClick={() => toggleFollow(creatorId)}
    >
      {on ? "Following" : "Follow"}
    </button>
  );
}
export function StreamCard({ stream }: { stream: Stream }) {
  const c = creatorById(stream.creatorId);
  return (
    <article className="stream-card">
      <Link
        className="preview"
        style={{ "--accent": stream.accent } as React.CSSProperties}
        to={`/watch/${stream.id}`}
      >
        <div className="preview-noise" />
        <LiveBadge />
        <ViewerCount count={stream.viewers} />
        <span className="preview-mark">
          <Radio />J
        </span>
      </Link>
      <div className="stream-meta">
        <Link to={`/creator/${c.id}`}>
          <Avatar creator={c} />
        </Link>
        <div className="min-w-0">
          <Link className="card-title" to={`/watch/${stream.id}`}>
            {stream.title}
          </Link>
          <Link className="muted creator-line" to={`/creator/${c.id}`}>
            {c.name}
            {c.verified && <span className="verified">✓</span>}
          </Link>
          <div className="subline">
            <span>{stream.category}</span>
            <span>{stream.language}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
export const CategoryCard = ({
  name,
  live,
  accent,
}: {
  name: string;
  live: number;
  accent: string;
}) => (
  <Link
    to={`/category/${encodeURIComponent(name)}`}
    className="category-card"
    style={{ "--accent": accent } as React.CSSProperties}
  >
    <span className="category-icon">
      <Gamepad2 />
    </span>
    <strong>{name}</strong>
    <span>{live} live channels</span>
  </Link>
);
export const CreatorCard = ({ creator }: { creator: Creator }) => (
  <article className="creator-card">
    <Link to={`/creator/${creator.id}`}>
      <Avatar creator={creator} size="lg" />
    </Link>
    <div>
      <Link className="card-title" to={`/creator/${creator.id}`}>
        {creator.name} {creator.verified && <span className="verified">✓</span>}
      </Link>
      <p>{formatCount(creator.followers)} followers</p>
    </div>
    <FollowButton creatorId={creator.id} />
  </article>
);
export const ClipCard = ({ clip }: { clip: Clip }) => {
  const c = creatorById(clip.creatorId);
  const { toast } = useApp();
  return (
    <article className="clip-card">
      <div
        className="clip-thumb"
        style={{ "--accent": clip.accent } as React.CSSProperties}
      >
        <Clapperboard />
        <span>{clip.duration}</span>
      </div>
      <h3>{clip.title}</h3>
      <Link to={`/creator/${c.id}`}>{c.name}</Link>
      <div className="clip-foot">
        <span>
          {formatCount(clip.views)} views · {clip.age}
        </span>
        <button
          aria-label="Share clip"
          onClick={() => toast("Clip link copied")}
        >
          Share
        </button>
      </div>
    </article>
  );
};
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", key);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={ref}
      >
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button aria-label="Close modal" onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export const FilterChips = ({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="chips">
    {options.map((x) => (
      <button
        key={x}
        className={value === x ? "chip active" : "chip"}
        onClick={() => onChange(x)}
      >
        {x}
      </button>
    ))}
  </div>
);
export const EmptyState = ({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) => (
  <div className="empty">
    <Heart />
    <h2>{title}</h2>
    <p>{text}</p>
    {action}
  </div>
);
export const LoadingSkeleton = () => (
  <div className="skeleton-grid">
    {Array.from({ length: 4 }, (_, i) => (
      <div className="skeleton" key={i} />
    ))}
  </div>
);

const links = [
  ["/", "Home", Home],
  ["/browse", "Browse", Compass],
  ["/following", "Following", Heart],
  ["/browse#categories", "Categories", Gamepad2],
  ["/clips", "Clips", Clapperboard],
  ["/dashboard", "Creator Dashboard", LayoutDashboard],
  ["/wallet", "Earnings", WalletCards],
] as const;
export function Layout({ children }: { children: ReactNode }) {
  const { sidebar, setSidebar, toast } = useApp(),
    { user, isAuthenticated, isLoading, logout } = useAuth(),
    navigate = useNavigate(),
    [accountOpen, setAccountOpen] = useState(false);
  const signOut = async () => {
    await logout();
    setAccountOpen(false);
    navigate("/");
  };
  return (
    <div className={sidebar ? "shell" : "shell collapsed"}>
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span>V</span>
          <b>{APP.name}</b>
        </Link>
        <nav>
          {links.map(([to, label, Icon]) => (
            <NavLink key={label} to={to} end={to === "/"}>
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-bottom">
          <NavLink to="/settings">
            <Settings />
            <span>Settings</span>
          </NavLink>
          <button onClick={() => toast("Help centre is coming soon")}>
            <HelpCircle />
            <span>Help</span>
          </button>
          <button className="collapse" onClick={() => setSidebar(!sidebar)}>
            {sidebar ? <ChevronLeft /> : <ChevronRight />}
            <span>Collapse</span>
          </button>
        </div>
      </aside>
      <header className="topbar">
        <button
          className="menu-btn"
          aria-label="Toggle sidebar"
          onClick={() => setSidebar(!sidebar)}
        >
          <Menu />
        </button>
        <Link className="mobile-brand" to="/">
          <span>J</span>
        </Link>
        <label className="search">
          <Search />
          <input
            placeholder="Search creators, games or topics"
            onKeyDown={(e) =>
              e.key === "Enter" &&
              toast(`Searching for “${e.currentTarget.value}”`)
            }
          />
        </label>
        <div className="top-actions">
          {isAuthenticated && (
            <Link className="top-go-live" to="/go-live">
              <Video /> Go Live
            </Link>
          )}
          <button
            aria-label="Notifications"
            onClick={() => toast("You’re all caught up")}
          >
            <Bell />
          </button>
          <button
            aria-label="Messages"
            onClick={() => toast("Messages are coming soon")}
          >
            <MessageCircle />
          </button>
          {!isLoading && !isAuthenticated && (
            <>
              <Link className="top-sign-in" to="/login">
                Sign in
              </Link>
              <Link className="btn btn-accent top-create" to="/register">
                Create account
              </Link>
            </>
          )}
          {user && (
            <div className="account-menu">
              <button
                className="account-trigger"
                onClick={() => setAccountOpen((value) => !value)}
                aria-expanded={accountOpen}
              >
                <span className="user-avatar">
                  {user.displayName.slice(0, 2).toUpperCase()}
                </span>
                <span>{user.displayName}</span>
                <ChevronDown />
              </button>
              {accountOpen && (
                <div className="account-popover">
                  <div>
                    <b>{user.displayName}</b>
                    <small>@{user.username}</small>
                  </div>
                  <Link to="/dashboard" onClick={() => setAccountOpen(false)}>
                    <LayoutDashboard /> Dashboard
                  </Link>
                  <Link to="/settings" onClick={() => setAccountOpen(false)}>
                    <Settings /> Settings
                  </Link>
                  <button onClick={signOut}>
                    <LogOut /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      <main>{children}</main>
      <nav className="bottom-nav">
        <NavLink to="/">
          <Home />
          <span>Home</span>
        </NavLink>
        <NavLink to="/browse">
          <Compass />
          <span>Browse</span>
        </NavLink>
        <NavLink to="/following">
          <Heart />
          <span>Following</span>
        </NavLink>
        <NavLink
          className="go-live"
          to={isAuthenticated ? "/go-live" : "/login"}
        >
          <Video />
          <span>Go Live</span>
        </NavLink>
        <NavLink to={isAuthenticated ? "/settings" : "/login"}>
          <UserRound />
          <span>{isAuthenticated ? "Account" : "Sign in"}</span>
        </NavLink>
      </nav>
    </div>
  );
}
