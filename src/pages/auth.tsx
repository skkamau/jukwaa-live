import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Radio,
  UserRound,
} from "lucide-react";
import { useAuth } from "../auth";
import { authApi } from "../api/auth";

function AuthShell({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-page">
      <section className="auth-card">
        <Link className="auth-brand" to="/">
          <span>J</span> Jukwaa Live
        </Link>
        <div className="auth-heading">
          <small>{eyebrow}</small>
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
        {children}
      </section>
      <aside className="auth-aside">
        <Radio />
        <h2>Live, local, together.</h2>
        <p>
          Join Kenya’s home for live conversations, gaming, music, learning and
          culture.
        </p>
      </aside>
    </div>
  );
}
const messageOf = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";

const newPasswordPattern = "(?=.*[A-Za-z])(?=.*[0-9]).{8,128}";

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  newPassword = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  newPassword?: boolean;
  hint?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={newPassword ? 8 : undefined}
          maxLength={128}
          pattern={newPassword ? newPasswordPattern : undefined}
          title={newPassword ? "Use 8–128 characters with at least one letter and one number." : undefined}
          required
        />
        <button
          type="button"
          className="password-visibility"
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [identity, setIdentity] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const destination =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";
  useEffect(() => {
    if (isAuthenticated) navigate(destination, { replace: true });
  }, [isAuthenticated, navigate, destination]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(identity, password);
      navigate(destination, { replace: true });
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Sign in to Jukwaa"
      text="Continue watching, following and creating."
    >
      <form className="auth-form" onSubmit={submit}>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <label>
          Email or username
          <input
            autoComplete="username"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            required
          />
        </label>
        <PasswordField
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />
        <div className="auth-form-row">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <button className="btn btn-accent full" disabled={busy}>
          {busy ? (
            "Signing in…"
          ) : (
            <>
              Sign in <ArrowRight />
            </>
          )}
        </button>
        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuth(),
    navigate = useNavigate();
  const [form, setForm] = useState({
      displayName: "",
      username: "",
      email: "",
      password: "",
    }),
    [confirm, setConfirm] = useState(""),
    [agreed, setAgreed] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const registration = await register(form);
      if (registration.emailVerified) {
        navigate("/dashboard", { replace: true });
        return;
      }
      navigate(
        `/verify-email?registered=1&email=${encodeURIComponent(form.email)}${registration.emailDeliveryAvailable ? "" : "&delivery=disabled"}`,
        { replace: true },
      );
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }
  const update = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <AuthShell
      eyebrow="JOIN THE COMMUNITY"
      title="Create your account"
      text="Your Jukwaa identity for watching and creating."
    >
      <form className="auth-form" onSubmit={submit}>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <label>
          Display name
          <input
            autoComplete="name"
            value={form.displayName}
            onChange={(e) => update("displayName")(e.target.value)}
            maxLength={100}
            required
          />
        </label>
        <label>
          Username
          <input
            autoComplete="username"
            value={form.username}
            onChange={(e) => update("username")(e.target.value)}
            minLength={3}
            maxLength={50}
            pattern="[A-Za-z0-9_]+"
            required
          />
          <small>Letters, numbers and underscores.</small>
        </label>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => update("email")(e.target.value)}
            required
          />
        </label>
        <PasswordField
          label="Password"
          autoComplete="new-password"
          value={form.password}
          onChange={update("password")}
          newPassword
          hint="Use 8–128 characters with at least one letter and one number. Spaces are allowed."
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          newPassword
        />
        <label className="terms-check">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            required
          />
          <span>
            I agree to the <Link to="/terms">Terms</Link> and{" "}
            <Link to="/privacy">Privacy Notice</Link>.
          </span>
        </label>
        <button className="btn btn-accent full" disabled={busy || !agreed}>
          {busy ? (
            "Creating account…"
          ) : (
            <>
              Create account <ArrowRight />
            </>
          )}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState(""),
    [sent, setSent] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthShell
      eyebrow="ACCOUNT RECOVERY"
      title="Reset your password"
      text="We’ll send reset instructions if an eligible account exists."
    >
      {sent ? (
        <div className="auth-success">
          <Mail />
          <h2>Check your email</h2>
          <p>
            If an eligible account matches <b>{email}</b>, a reset link is on
            its way.
          </p>
          <Link className="btn btn-muted" to="/login">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button className="btn btn-accent full" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
          <p className="auth-switch">
            <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams(),
    navigate = useNavigate(),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [busy, setBusy] = useState(false);
  const token = params.get("token") ?? "";
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthShell
      eyebrow="SECURE YOUR ACCOUNT"
      title="Choose a new password"
      text="This will sign out every existing session on your account."
    >
      {done ? (
        <div className="auth-success">
          <CheckCircle2 />
          <h2>Password updated</h2>
          <button
            className="btn btn-accent"
            onClick={() => navigate("/login", { replace: true })}
          >
            Sign in again
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          {!token && (
            <div className="form-error">
              This reset link is missing its token.
            </div>
          )}
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <PasswordField
            label="New password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            newPassword
            hint="Use 8–128 characters with at least one letter and one number."
          />
          <PasswordField
            label="Confirm password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            newPassword
          />
          <button className="btn btn-accent full" disabled={busy || !token}>
            <KeyRound /> {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export function VerifyEmailPage() {
  const { refresh } = useAuth();
  const [params] = useSearchParams(),
    registered = params.get("registered") === "1",
    deliveryDisabled = params.get("delivery") === "disabled",
    email = params.get("email") ?? "",
    [state, setState] = useState<"notice" | "working" | "done" | "error">(
      registered ? "notice" : "working",
    ),
    [error, setError] = useState(""),
    [resent, setResent] = useState(false),
    started = useRef(false);
  useEffect(() => {
    const token = params.get("token");
    if (started.current) return;
    started.current = true;
    if (registered) return;
    if (!token) {
      setState("error");
      setError("This verification link is missing its token.");
      return;
    }
    authApi
      .verifyEmail(token)
      .then(async () => {
        await refresh();
        setState("done");
      })
      .catch((reason) => {
        setState("error");
        setError(messageOf(reason));
      });
  }, [params, registered, refresh]);
  const resend = async () => {
    if (!email) return;
    await authApi.resendVerification(email);
    setResent(true);
  };
  return (
    <AuthShell
      eyebrow="EMAIL VERIFICATION"
      title={
        state === "notice"
          ? "Verify your email"
          : state === "done"
          ? "Email verified"
          : state === "error"
            ? "Link not accepted"
            : "Verifying your email…"
      }
      text="Email verification helps keep Jukwaa accounts trustworthy."
    >
      <div className={`auth-success ${state}`}>
        {state === "working" || state === "notice" ? (
          <Mail />
        ) : state === "done" ? (
          <CheckCircle2 />
        ) : (
          <UserRound />
        )}
        <p>
          {state === "notice"
            ? deliveryDisabled
              ? "Your account has been created. Email verification is temporarily unavailable, but you can log in and use your account."
              : `Your account is ready. We sent a verification link to ${email}. You can continue using Jukwaa while unverified.`
            : state === "done"
            ? "Your email address is now verified."
            : state === "error"
              ? error
              : "Please wait a moment."}
        </p>
        {state === "notice" ? (
          <div className="verify-actions">
            <Link className="btn btn-accent" to="/dashboard">Continue</Link>
            {!deliveryDisabled && (
              <button className="btn btn-muted" onClick={resend} disabled={resent}>
                {resent ? "Email sent" : "Resend email"}
              </button>
            )}
          </div>
        ) : (
          <Link className="btn btn-accent" to={state === "done" ? "/dashboard" : "/login"}>
            {state === "done" ? "Continue" : "Back to sign in"}
          </Link>
        )}
      </div>
    </AuthShell>
  );
}

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  return (
    <div className="page legal-page">
      <h1>{kind === "terms" ? "Terms of Use" : "Privacy Notice"}</h1>
      <p>
        This Stage 3 preview describes the authentication experience only. Final
        legal terms will be published before launch.
      </p>
      <Link to="/register">Back to account creation</Link>
    </div>
  );
}
