import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Calendar, Radio, UserRound } from "lucide-react";
import { profilesApi, type PublicChannel } from "../api/profiles";

export function ChannelPage() {
  const { slug = "" } = useParams();
  const [channel, setChannel] = useState<PublicChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    setLoading(true);
    setMissing(false);
    profilesApi
      .publicChannel(slug)
      .then((result) => setChannel(result.channel))
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  }, [slug]);
  if (loading) return <div className="auth-loading">Loading channel…</div>;
  if (missing || !channel)
    return (
      <div className="page channel-missing">
        <Radio />
        <h1>Channel unavailable</h1>
        <p>This channel does not exist or is not currently public.</p>
        <Link className="btn btn-accent" to="/browse">Browse live channels</Link>
      </div>
    );
  const initials = channel.creator.displayName.slice(0, 2).toUpperCase();
  return (
    <div className="creator-page real-channel-page">
      <div className="cover real-channel-cover"><span>JUKWAA CHANNEL · OFFLINE</span></div>
      <div className="profile-head">
        {channel.creator.avatarUrl ? (
          <img className="real-avatar" src={channel.creator.avatarUrl} alt="" />
        ) : (
          <span className="real-avatar initials">{initials}</span>
        )}
        <div className="profile-copy">
          <span className="channel-label">{channel.name}</span>
          <h1>
            {channel.creator.displayName}
            {channel.creator.verified && <span className="verified">✓</span>}
          </h1>
          <p>@{channel.creator.username}</p>
          <div><b>0</b> followers <b>0</b> past streams</div>
        </div>
        <span className="offline-pill">Offline</span>
      </div>
      <div className="real-channel-tabs"><button className="active">Home</button><button>About</button><button>Past Streams</button></div>
      <div className="profile-body">
        <div>
          <h2>About {channel.name}</h2>
          <p className="bio">{channel.description || "This creator has not added a channel description yet."}</p>
          {channel.creator.bio && <p className="creator-bio"><b>Creator bio</b><br />{channel.creator.bio}</p>}
        </div>
        <aside className="schedule-card zero-card">
          <h3><Calendar /> Channel activity</h3>
          <div><b>Status</b><span>Offline</span></div>
          <div><b>Streams</b><span>0</span></div>
          <div><b>Followers</b><span>0</span></div>
        </aside>
      </div>
      <section className="section real-empty-streams">
        <Radio />
        <h2>No past streams yet.</h2>
        <p>When {channel.creator.displayName} finishes a stream, broadcasts will appear here.</p>
      </section>
    </div>
  );
}
