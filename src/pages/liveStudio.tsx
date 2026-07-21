import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Code2,
  Radio,
  Save,
  Shield,
  Square,
  X,
} from "lucide-react";
import { streamsApi, type PublicStream, type StreamInput, type StreamingConfiguration } from "../api/streams";
import { useAuth } from "../auth";
import { useCreator } from "../creator";
import { categories } from "../data";
import { PageTitle } from "./discovery";

const initialInput: StreamInput = {
  title: "",
  description: "",
  category: "Just Chatting",
  language: "English",
  tags: [],
  matureContent: false,
};

export function GoLivePage() {
  const { user } = useAuth();
  const { channel } = useCreator();
  const [stream, setStream] = useState<PublicStream | null>(null);
  const [configuration, setConfiguration] = useState<StreamingConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([streamsApi.current(), streamsApi.configuration()])
      .then(([current, config]) => {
        setStream(current.stream);
        setConfiguration(config.streaming);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load Creator Studio"))
      .finally(() => setLoading(false));
  }, []);

  async function act(action: () => Promise<{ stream: PublicStream }>) {
    setBusy(true);
    setError("");
    try {
      setStream((await action()).stream);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The stream could not be updated");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="auth-loading">Loading Creator Studio…</div>;
  if (!stream || stream.status === "CANCELLED" || stream.status === "FAILED") {
    return (
      <PrepareStream
        error={error}
        busy={busy}
        onPrepare={(input) => act(() => streamsApi.prepare(input))}
        prelaunchTestMode={configuration?.prelaunchTestMode ?? false}
      />
    );
  }
  if (stream.status === "ENDED") {
    return <EndedStream stream={stream} onAnother={() => { setStream(null); setError(""); }} />;
  }
  return (
    <div className="page live-studio-page real-stream-studio">
      <div className="studio-heading">
        <div>
          <span className="section-kicker">CREATOR STUDIO · REAL STREAM RECORD</span>
          <h1>{stream.status === "LIVE" ? `You’re live, ${user?.displayName}.` : "Waiting for broadcast"}</h1>
          <p>{stream.status === "LIVE" ? "The provider has reported this broadcast active." : "Your stream is prepared. It will not become live until the provider reports an active broadcast."}</p>
        </div>
        <span className={`stream-state-pill ${stream.status.toLowerCase()}`}><i /> {stream.status}</span>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {configuration?.prelaunchTestMode && <TestModeNotice />}
      <RealStatusBar stream={stream} />
      <div className="live-studio-layout">
        <main className="studio-main">
          <RealStudioPreview stream={stream} channelName={channel?.name ?? "Your channel"} />
          <div className="studio-controls real-studio-controls">
            {stream.status === "PREPARING" && (
              <button className="end-control" disabled={busy} onClick={() => act(streamsApi.cancel)}><X /> Cancel prepared stream</button>
            )}
            {stream.status === "LIVE" && configuration?.simulationAvailable && (
              <button className="end-control" disabled={busy} onClick={() => act(streamsApi.simulateEnd)}><Square /> Simulate Stream End</button>
            )}
          </div>
        </main>
        <aside className="studio-live-chat stage-placeholder">
          <header><div><Shield /> LIVE CHAT</div></header>
          <div><Shield /><h3>Chat is not connected yet</h3><p>Real chat and WebSockets are intentionally outside Stage 5A. No fictional messages are attached to this real stream.</p></div>
        </aside>
      </div>
      {configuration?.simulationAvailable && (
        <section className="development-controls panel">
          <div><Code2 /><div><span className="section-kicker">{configuration.prelaunchTestMode ? "PRELAUNCH TEST CONTROLS" : "DEVELOPMENT STREAMING CONTROLS"}</span><h2>Mock provider · no video delivery</h2><p>This deterministic control changes stream status only. It never broadcasts video.</p></div></div>
          {stream.status === "PREPARING" && <button className="btn btn-accent" disabled={busy} onClick={() => act(streamsApi.simulateLive)}><Radio /> Simulate Go Live</button>}
          {stream.status === "LIVE" && <button className="btn btn-muted" disabled={busy} onClick={() => act(streamsApi.simulateEnd)}><Square /> Simulate End</button>}
        </section>
      )}
      <StreamInformation stream={stream} busy={busy} onSaved={(next) => act(() => streamsApi.update(next))} />
    </div>
  );
}

function PrepareStream({ error, busy, onPrepare, prelaunchTestMode }: { error: string; busy: boolean; onPrepare: (input: StreamInput) => void; prelaunchTestMode: boolean }) {
  const [form, setForm] = useState(initialInput);
  const [tags, setTags] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    onPrepare({ ...form, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) });
  }
  return (
    <div className="page">
      <PageTitle eyebrow="CREATOR STUDIO" title="Prepare your stream" text="Create a real broadcast record first. Jukwaa waits for the configured provider before marking it live." />
      {prelaunchTestMode && <TestModeNotice />}
      <div className="go-live-layout">
        <form className="setup-form" onSubmit={submit}>
          {error && <div className="form-error" role="alert">{error}</div>}
          <Field label="Stream title"><input required minLength={3} maxLength={140} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What are you streaming today?" /></Field>
          <Field label="Description (optional)"><textarea maxLength={1000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Give viewers a little more context." /></Field>
          <div className="form-row">
            <Field label="Category"><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></Field>
            <Field label="Language"><select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}>{["English", "Kiswahili", "Sheng", "Kikuyu", "Luo", "Kalenjin", "Other"].map((language) => <option key={language}>{language}</option>)}</select></Field>
          </div>
          <Field label="Tags"><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Nairobi, Coding, Careers" /><small>Up to 10 comma-separated tags.</small></Field>
          <label className="studio-toggle"><span><b>Mature content</b><small>Mark this stream for adult audiences.</small></span><input type="checkbox" role="switch" checked={form.matureContent} onChange={(event) => setForm({ ...form, matureContent: event.target.checked })} /></label>
          <button className="btn btn-accent full big" disabled={busy}>{busy ? "Preparing…" : "Prepare Stream"}</button>
        </form>
        <div>
          <div className="stream-preview ready real-prepare-preview"><Radio /><b>Provider-controlled lifecycle</b><span>PREPARING → LIVE → ENDED</span><small>The mock provider simulates status only. It does not deliver video.</small></div>
          <p className="demo-note">No camera, microphone, payment service, or cloud streaming account is used.</p>
        </div>
      </div>
    </div>
  );
}

function TestModeNotice() {
  return <div className="form-error test-mode-notice" role="status"><b>TEST MODE — No real video is being broadcast.</b><span>This is a prelaunch test stream. Real video broadcasting has not been enabled.</span></div>;
}

function RealStatusBar({ stream }: { stream: PublicStream }) {
  const duration = useDuration(stream.startedAt, stream.endedAt);
  const items = [
    ["Stream state", stream.status], ["Duration", duration], ["Provider", stream.playback?.provider ?? "mock"],
    ["Viewers", "Not tracked"], ["Health", "Not available"], ["Recording", "Not available"],
  ];
  return <section className="studio-status"><strong><i /> {stream.status}</strong>{items.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</section>;
}

function RealStudioPreview({ stream, channelName }: { stream: PublicStream; channelName: string }) {
  return <div className="studio-preview real-provider-preview"><div className="studio-preview-top"><span><i /> {stream.status}</span></div><div className="studio-signal"><Radio /><b>{channelName}</b><small>{stream.status === "PREPARING" ? "Waiting for broadcasting software" : "Development livestream simulation · no video"}</small></div></div>;
}

function StreamInformation({ stream, busy, onSaved }: { stream: PublicStream; busy: boolean; onSaved: (input: Partial<StreamInput>) => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(stream.title);
  const [description, setDescription] = useState(stream.description ?? "");
  if (editing) return <section className="current-stream-info"><header><div><span className="section-kicker">CURRENT BROADCAST</span><h2>Edit stream information</h2></div></header><div className="stream-inline-edit"><Field label="Title"><input value={title} onChange={(event) => setTitle(event.target.value)} /></Field><Field label="Description"><textarea value={description} onChange={(event) => setDescription(event.target.value)} /></Field><button className="btn btn-accent" disabled={busy} onClick={() => { onSaved({ title, description }); setEditing(false); }}><Save /> Save changes</button></div></section>;
  return <section className="current-stream-info"><header><div><span className="section-kicker">CURRENT BROADCAST</span><h2>Stream information</h2></div><button className="btn btn-muted" onClick={() => setEditing(true)}>Edit</button></header><h3>{stream.title}</h3>{stream.description && <p>{stream.description}</p>}<dl><div><dt>Category</dt><dd>{stream.category}</dd></div><div><dt>Language</dt><dd>{stream.language}</dd></div><div><dt>Tags</dt><dd>{stream.tags.join(", ") || "None"}</dd></div><div><dt>Mature</dt><dd>{stream.matureContent ? "Yes" : "No"}</dd></div><div><dt>Created</dt><dd>{new Date(stream.createdAt).toLocaleString()}</dd></div></dl></section>;
}

function EndedStream({ stream, onAnother }: { stream: PublicStream; onAnother: () => void }) {
  return <div className="page stream-summary"><span className="summary-icon"><CheckCircle2 /></span><span className="section-kicker">STREAM ENDED</span><h1>Broadcast complete.</h1><p>{stream.title} ended after {useDuration(stream.startedAt, stream.endedAt)}. No recording or fabricated analytics were created.</p><div className="summary-actions"><Link className="btn btn-muted" to="/dashboard">Return to Creator Dashboard</Link><button className="btn btn-accent" onClick={onAnother}><Radio /> Prepare Another Stream</button></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="studio-field"><span>{label}</span>{children}</label>;
}

function useDuration(startedAt: string | null, endedAt: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt || endedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt, endedAt]);
  return useMemo(() => {
    if (!startedAt) return "00:00:00";
    const seconds = Math.max(0, Math.floor(((endedAt ? new Date(endedAt).getTime() : now) - new Date(startedAt).getTime()) / 1000));
    return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map((value) => String(value).padStart(2, "0")).join(":");
  }, [startedAt, endedAt, now]);
}
