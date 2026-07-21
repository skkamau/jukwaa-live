import { useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Bell, CalendarDays, Check, Play, Radio, Search } from "lucide-react";
import { categories, categoryMeta, clips, creatorById, creators, events, streams } from "../data";
import { CategoryCard, ClipCard, CreatorCard, EmptyState, FilterChips, FollowButton, LiveBadge, StreamCard, ViewerCount } from "../components";
import { useApp } from "../context";
import { demoContentEnabled, useLiveStreams } from "../liveStreams";
import type { PublicStream } from "../api/streams";

export function HomePage() {
  const featured = streams[0], creator = creatorById(featured.creatorId);
  const { toast } = useApp();
  const real = useLiveStreams();
  return <div className="page">
    {demoContentEnabled ? <section className="hero"><div className="hero-copy"><span className="eyebrow">FICTIONAL DEMO · THE 254</span><h1>Kenya is<br /><em>live.</em></h1><p>Watch the stories, sounds, games and conversations shaping the culture.</p><div className="hero-actions"><Link className="btn btn-white" to={`/watch/${featured.id}`}><Play /> Watch demo</Link><FollowButton creatorId={creator.id} /></div><div className="hero-creator"><span className="verified">✓</span><b>{creator.name}</b><span>{featured.category}</span></div></div><Link className="hero-preview" to={`/watch/${featured.id}`} style={{ "--accent": featured.accent } as React.CSSProperties}><LiveBadge /><ViewerCount count={featured.viewers} /><div className="signal"><i /><i /><i /><i /></div><div className="hero-preview-info"><span>{featured.title}</span><small>{featured.duration} demo live</small></div></Link></section> : <section className="hero honest-live-hero"><div className="hero-copy"><span className="eyebrow">THE 254 · REAL CHANNELS</span><h1>Kenya is<br /><em>live.</em></h1><p>{real.streams.length ? `${real.streams.length} real ${real.streams.length === 1 ? "channel is" : "channels are"} live now.` : "No creators are live right now. Check back soon."}</p>{real.streams[0] && <Link className="btn btn-white" to={`/watch/${real.streams[0].id}`}><Play /> Watch now</Link>}</div></section>}
    <Section title="Real live now" link="/browse">{real.loading ? <p className="content-loading">Checking live channels…</p> : real.streams.length ? <div className="stream-grid">{real.streams.slice(0, 8).map(stream => <RealStreamCard key={stream.id} stream={stream} />)}</div> : <EmptyState title="No real streams are live" text={real.unavailable ? "The API is unavailable. Start the backend to load real streams." : "Prepared and ended streams do not appear in public live discovery."} />}</Section>
    {demoContentEnabled && <><Section title="Fictional demo streams" link="/browse"><div className="stream-grid">{streams.slice(0, 8).map(stream => <StreamCard key={stream.id} stream={stream} />)}</div></Section><Section title="Demo categories" link="/browse#categories"><div className="category-grid">{categoryMeta.map(category => <CategoryCard key={category.name} {...category} />)}</div></Section><Section title="Demo events"><div className="event-grid">{events.map(([name, date, time]) => <article className="event" key={name}><CalendarDays /><div><span>{date} · {time}</span><h3>{name}</h3></div><button onClick={() => toast(`Demo reminder set for ${name}`)}><Bell /> Remind me</button></article>)}</div></Section></>}
  </div>;
}

function Section({ title, link, children }: { title: string; link?: string; children: ReactNode }) {
  return <section className="section"><div className="section-head"><h2>{title}</h2>{link && <Link to={link}>See all <ArrowRight /></Link>}</div>{children}</section>;
}

export function BrowsePage() {
  const [tab, setTab] = useState("Live streams"), [query, setQuery] = useState(""), [category, setCategory] = useState("All"), [language, setLanguage] = useState("All"), [sort, setSort] = useState("Recommended");
  const real = useLiveStreams();
  const demoList = useMemo(() => demoContentEnabled ? streams.filter(stream => (category === "All" || stream.category === category) && (language === "All" || stream.language === language) && `${stream.title} ${creatorById(stream.creatorId).name}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "Most viewers" ? b.viewers - a.viewers : sort === "Newest" ? a.created - b.created : 0) : [], [query, category, language, sort]);
  const realList = useMemo(() => real.streams.filter(stream => (category === "All" || stream.category === category) && (language === "All" || stream.language === language) && `${stream.title} ${stream.creator.displayName} ${stream.channel.name}`.toLowerCase().includes(query.toLowerCase())), [real.streams, query, category, language]);
  const hasLive = realList.length + demoList.length > 0;
  return <div className="page"><PageTitle eyebrow="FIND YOUR CROWD" title="Browse Vyrlo" text="Real database streams and optional fictional demo content are labelled separately." /><FilterChips options={["Live streams", "Creators", "Categories"]} value={tab} onChange={setTab} /><div className="browse-tools"><label className="search wide"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search streams and creators" /></label><select aria-label="Category" value={category} onChange={event => setCategory(event.target.value)}><option>All</option>{categories.map(item => <option key={item}>{item}</option>)}</select><select aria-label="Language" value={language} onChange={event => setLanguage(event.target.value)}>{["All", "English", "Kiswahili", "Sheng", "Kikuyu", "Luo", "Kalenjin", "Other"].map(item => <option key={item}>{item}</option>)}</select><select aria-label="Sort results" value={sort} onChange={event => setSort(event.target.value)}>{["Recommended", "Most viewers", "Newest"].map(item => <option key={item}>{item}</option>)}</select></div>
    {tab === "Live streams" && (hasLive ? <><StreamGroup label="REAL DATABASE STREAMS">{realList.map(stream => <RealStreamCard key={stream.id} stream={stream} />)}</StreamGroup>{demoContentEnabled && <StreamGroup label="FICTIONAL DEMO STREAMS">{demoList.map(stream => <StreamCard key={stream.id} stream={stream} />)}</StreamGroup>}</> : <EmptyState title="No streams found" text={real.loading ? "Checking live channels…" : "No real creators match these filters right now."} />)}
    {tab === "Creators" && (demoContentEnabled ? <><span className="content-source-label">FICTIONAL DEMO CREATORS</span><div className="creator-grid">{creators.filter(item => item.name.toLowerCase().includes(query.toLowerCase())).map(item => <CreatorCard key={item.id} creator={item} />)}</div></> : <EmptyState title="Creator directory is not available yet" text="Stage 5A exposes active streams, not a public all-creators directory." />)}
    {tab === "Categories" && (demoContentEnabled ? <><span className="content-source-label">DEMO CATEGORY COUNTS</span><div className="category-grid">{categoryMeta.map(item => <CategoryCard key={item.name} {...item} />)}</div></> : <EmptyState title="No category counts yet" text="Real analytics and category aggregation come in a later stage." />)}
  </div>;
}

function StreamGroup({ label, children }: { label: string; children: ReactNode }) {
  return <section className="stream-source-group"><span className="content-source-label">{label}</span><div className="stream-grid">{children}</div></section>;
}

function RealStreamCard({ stream }: { stream: PublicStream }) {
  return <article className="stream-card real-live-card"><Link className="thumb" to={`/watch/${stream.id}`}><span className="live-badge">LIVE</span><div className="real-card-signal"><Radio /><small>Provider-confirmed status</small></div></Link><div className="card-body"><span className="avatar real-stream-initials">{stream.creator.displayName.slice(0, 2).toUpperCase()}</span><div><Link className="card-title" to={`/watch/${stream.id}`}>{stream.title}</Link><Link className="creator-link" to={`/channel/${stream.channel.slug}`}>{stream.creator.displayName}</Link><div className="card-meta"><span>{stream.category}</span><span>{stream.language}</span></div></div></div></article>;
}

export function CategoryPage() {
  const { categoryName } = useParams();
  const name = decodeURIComponent(categoryName ?? "");
  const real = useLiveStreams();
  const demoList = demoContentEnabled ? streams.filter(stream => stream.category === name) : [];
  const realList = real.streams.filter(stream => stream.category === name);
  return <div className="page"><PageTitle eyebrow="CATEGORY" title={name} text={`${realList.length} real channels live now`} />{realList.length ? <StreamGroup label="REAL DATABASE STREAMS">{realList.map(stream => <RealStreamCard key={stream.id} stream={stream} />)}</StreamGroup> : <EmptyState title="No real streams in this category" text="Check another category or return later." />}{demoContentEnabled && <StreamGroup label="FICTIONAL DEMO STREAMS">{demoList.map(stream => <StreamCard key={stream.id} stream={stream} />)}</StreamGroup>}</div>;
}

export function FollowingPage() {
  const { followed } = useApp();
  if (!demoContentEnabled) return <div className="page"><PageTitle eyebrow="YOUR COMMUNITY" title="Following" /><EmptyState title="Real following is not connected yet" text="The follows backend is intentionally outside Stage 5A." action={<Link className="btn btn-accent" to="/browse">Browse live streams</Link>} /></div>;
  const followedCreators = creators.filter(creator => followed.has(creator.id));
  const live = streams.filter(stream => followed.has(stream.creatorId));
  if (!followed.size) return <div className="page"><PageTitle eyebrow="YOUR DEMO COMMUNITY" title="Following" /><EmptyState title="Your front row is waiting" text="Follow demo creators to see them here." action={<Link className="btn btn-accent" to="/browse">Find creators</Link>} /></div>;
  return <div className="page"><PageTitle eyebrow="FICTIONAL DEMO CONTENT" title="Following" text={`${followed.size} demo creators in your circle`} /><Section title="Live now"><div className="stream-grid">{live.map(stream => <StreamCard key={stream.id} stream={stream} />)}</div></Section><Section title="Offline creators"><div className="creator-grid">{followedCreators.filter(creator => !creator.live).map(creator => <CreatorCard key={creator.id} creator={creator} />)}</div></Section><Section title="Coming up"><div className="schedule-list">{followedCreators.slice(0, 3).map((creator, index) => <div key={creator.id}><span>{["Tomorrow · 8:00 PM", "Saturday · 3:00 PM", "Monday · 7:30 PM"][index]}</span><b>{creator.name} is going live</b><button><Check /> Following</button></div>)}</div></Section></div>;
}

export function ClipsPage() {
  const [filter, setFilter] = useState("Trending");
  if (!demoContentEnabled) return <div className="page"><PageTitle eyebrow="THE BEST MOMENTS" title="Clips" /><EmptyState title="No real clips yet" text="Recording and clip generation are intentionally outside Stage 5A." /></div>;
  return <div className="page"><PageTitle eyebrow="FICTIONAL DEMO CONTENT" title="Clips" text="These sample clips remain available for interface demonstrations." /><FilterChips options={["Trending", "Today", "This week", "Following"]} value={filter} onChange={setFilter} /><div className="clip-grid">{clips.map(clip => <ClipCard key={clip.id} clip={clip} />)}</div></div>;
}

export function PageTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return <header className="page-title"><span>{eyebrow}</span><h1>{title}</h1>{text && <p>{text}</p>}</header>;
}
