import { Calendar, ExternalLink, Instagram, Play, Youtube } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Avatar, ClipCard, FollowButton, StreamCard } from '../components'
import { useApp } from '../context'
import { clips, creatorById, formatCount, streams } from '../data'

export function CreatorPage() {
  const { creatorId } = useParams()
  const creator = creatorById(creatorId ?? '')
  const live = streams.find((stream) => stream.creatorId === creator.id)
  const { toast, pastStreams } = useApp()
  const publicBroadcasts = pastStreams.filter(
    (stream) => stream.creatorId === creator.id && stream.visibility === 'PUBLIC',
  )

  return (
    <div className="creator-page">
      <div className="cover" style={{ '--accent': creator.accent } as React.CSSProperties}>
        <span>VYRLO CREATOR</span>
      </div>
      <div className="profile-head">
        <Avatar creator={creator} size="xl" />
        <div className="profile-copy">
          <h1>
            {creator.name} {creator.verified && <span className="verified">✓</span>}
          </h1>
          <p>{creator.handle}</p>
          <div>
            <b>{formatCount(creator.followers)}</b> followers{' '}
            <b>{formatCount(creator.views)}</b> total views
          </div>
        </div>
        <div className="profile-actions">
          <FollowButton creatorId={creator.id} />
          <button
            className="btn btn-muted"
            onClick={() => toast('Subscriptions are coming in Phase 2')}
          >
            Subscribe · Coming soon
          </button>
        </div>
      </div>
      <div className="profile-body">
        <div>
          <p className="bio">{creator.bio}</p>
          <div className="socials">
            <button onClick={() => toast('Demo social link')}><Instagram /> Instagram</button>
            <button onClick={() => toast('Demo social link')}><Youtube /> YouTube</button>
            <button onClick={() => toast('Demo social link')}><ExternalLink /> Website</button>
          </div>
        </div>
        <aside className="schedule-card">
          <h3><Calendar /> Stream schedule</h3>
          <div><b>Tuesday</b><span>8:00 PM</span></div>
          <div><b>Thursday</b><span>8:00 PM</span></div>
          <div><b>Saturday</b><span>4:00 PM</span></div>
        </aside>
      </div>
      {live && (
        <section className="section">
          <div className="section-head"><h2>Live now</h2></div>
          <div className="stream-grid"><StreamCard stream={live} /></div>
        </section>
      )}
      <section className="section">
        <div className="section-head"><h2>Recent clips</h2></div>
        <div className="clip-grid">
          {clips.filter((clip) => clip.creatorId === creator.id).slice(0, 4).map((clip) => (
            <ClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      </section>
      {publicBroadcasts.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Past Broadcasts</h2></div>
          <div className="public-broadcast-grid">
            {publicBroadcasts.slice(0, 6).map((stream) => (
              <Link to={`/dashboard/content/${stream.id}`} key={stream.id}>
                <div
                  className="public-broadcast-thumb"
                  style={{ '--accent': stream.accent } as React.CSSProperties}
                >
                  <Play /><span>{stream.duration}</span>
                </div>
                <b>{stream.title}</b>
                <small>{formatCount(stream.views)} views · {stream.date}</small>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
