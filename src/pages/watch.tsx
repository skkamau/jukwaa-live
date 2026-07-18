import {useEffect,useRef,useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {Ban,ChevronRight,Clock,Copy,Ellipsis,Flag,Headphones,Maximize2,MessageSquareOff,Pause,Play,Send,Settings,Share2,Shield,Smile,Trash2,UserRoundX,Volume2,X} from 'lucide-react'
import {APP,chatMessages,creatorById,formatCount,money,streams} from '../data'
import {Avatar,FollowButton,LiveBadge,Modal,StreamCard,ViewerCount} from '../components'
import {useApp} from '../context'

const description='Late-night Nairobi stories, culture and unfiltered conversation with the Jukwaa community. Pull up, share where you are watching from, and keep the chat respectful.'

export function WatchPage(){
  const {streamId}=useParams();
  const stream=streams.find(s=>s.id===streamId)??streams[0],creator=creatorById(stream.creatorId)
  const [playing,setPlaying]=useState(true),[quality,setQuality]=useState('Auto'),[chatOpen,setChatOpen]=useState(true),[support,setSupport]=useState(false),[moreOpen,setMoreOpen]=useState(false)
  const {toast}=useApp()
  const recommended=streams.filter(s=>s.id!==stream.id).slice(0,4)
  return <div className="watch-page">
    <div className={chatOpen?'watch-layout':'watch-layout no-chat'}>
      <div className="watch-main">
        <div className="player" style={{'--accent':stream.accent} as React.CSSProperties}>
          <div className="player-top"><LiveBadge/><ViewerCount count={stream.viewers}/><span><Clock/> {stream.duration}</span></div>
          <button className="play-center" onClick={()=>setPlaying(!playing)} aria-label={playing?'Pause':'Play'}>{playing?<Pause/>:<Play/>}</button>
          <div className="player-controls"><button onClick={()=>setPlaying(!playing)} aria-label={playing?'Pause':'Play'}>{playing?<Pause/>:<Play/>}</button><button aria-label="Volume"><Volume2/></button><span>LIVE</span><button className="text-control" onClick={()=>toast('Audio-only mode enabled')}><Headphones/> Audio only</button><select value={quality} onChange={e=>setQuality(e.target.value)} aria-label="Quality">{['Auto','720p','480p','360p','240p'].map(x=><option key={x}>{x}</option>)}</select><button aria-label="Theatre mode"><Maximize2/></button></div>
        </div>
        <section className="stream-info">
          <h1>{stream.title}</h1>
          <div className="creator-row">
            <Link to={`/creator/${creator.id}`}><Avatar creator={creator} size="lg"/></Link>
            <div className="creator-details"><Link to={`/creator/${creator.id}`}><b>{creator.name}</b>{creator.verified&&<span className="verified">✓</span>}</Link><span>{formatCount(creator.followers)} followers</span><span>{stream.category} · {stream.language}</span></div>
            <div className="stream-actions"><FollowButton creatorId={creator.id}/><button className="btn btn-muted" onClick={()=>toast('Stream link copied')}><Share2/> Share</button><button className="btn mpesa" onClick={()=>setSupport(true)}>Support with M-Pesa</button><div className="more-wrap"><button className="btn btn-muted icon-btn" aria-label="More stream actions" aria-expanded={moreOpen} onClick={()=>setMoreOpen(!moreOpen)}><Ellipsis/></button>{moreOpen&&<div className="more-menu"><button onClick={()=>{toast('Stream link copied');setMoreOpen(false)}}><Copy/> Copy stream link</button><button onClick={()=>{toast('Report form opened in demo mode');setMoreOpen(false)}}><Flag/> Report stream</button><button onClick={()=>{toast(`${creator.name} blocked in demo mode`);setMoreOpen(false)}}><Ban/> Block creator</button></div>}</div></div>
          </div>
          <p className="stream-description">{description}</p>
        </section>
        {!chatOpen&&<button className="show-chat" onClick={()=>setChatOpen(true)}><MessageSquareOff/> Show live chat</button>}
      </div>
      {chatOpen&&<ChatPanel onHide={()=>setChatOpen(false)}/>} 
    </div>
    <section className="about-stream"><div><span className="section-kicker">STREAM DETAILS</span><h2>About this stream</h2><p>{description}</p></div><dl><div><dt>Started</dt><dd>Today, 8:04 PM EAT</dd></div><div><dt>Category</dt><dd>{stream.category}</dd></div><div><dt>Language</dt><dd>{stream.language}</dd></div><div><dt>Tags</dt><dd className="tags">{stream.tags.map(x=><span key={x}>{x}</span>)}</dd></div></dl></section>
    <section className="section"><div className="section-head"><h2>More Like This</h2><Link to="/browse">Browse all <ChevronRight/></Link></div><div className="stream-grid">{recommended.map(s=><StreamCard key={s.id} stream={s}/>)}</div></section>
    <section className="section"><div className="section-head"><h2>More From {creator.name}</h2><Link to={`/creator/${creator.id}`}>View profile <ChevronRight/></Link></div><div className="past-broadcast-grid">{['City stories you sent us','Nairobi after hours: community call-in','The week that was in the 254'].map((title,i)=><Link to={`/watch/${stream.id}`} className="past-broadcast" key={title}><div className="broadcast-thumb" style={{'--accent':creator.accent} as React.CSSProperties}><Play/><span>{['1:42:18','2:08:44','1:16:09'][i]}</span></div><b>{title}</b><small>{[18400,12700,9600][i].toLocaleString()} views · {i+2} days ago</small></Link>)}</div></section>
    <SupportModal open={support} onClose={()=>setSupport(false)} creator={creator.name}/>
  </div>
}

type ChatMessage={id:number;user:string;text:string;badge?:string}
function ChatPanel({onHide}:{onHide:()=>void}){
  const [messages,setMessages]=useState<ChatMessage[]>(chatMessages),[text,setText]=useState(''),[settingsOpen,setSettingsOpen]=useState(false),[slowMode,setSlowMode]=useState(true),[followersOnly,setFollowersOnly]=useState(false),[moderatorMode,setModeratorMode]=useState(false)
  const messagesRef=useRef<HTMLDivElement>(null);const {toast}=useApp()
  useEffect(()=>{const el=messagesRef.current;if(el)el.scrollTop=el.scrollHeight},[messages])
  const send=()=>{if(!text.trim())return;setMessages(x=>[...x,{id:Date.now(),user:'You',text:text.trim()}]);setText('')}
  const moderate=(id:number,action:string,user:string)=>{if(action==='Delete')setMessages(x=>x.filter(m=>m.id!==id));else toast(`${user} ${action==='Timeout'?'timed out for 10 minutes':'banned'} in demo mode`)}
  return <aside className="chat">
    <header><div><i/> LIVE CHAT {slowMode&&<span>Slow mode</span>}{followersOnly&&<span>Followers only</span>}</div><div className="chat-head-actions"><button aria-label="Chat settings" aria-expanded={settingsOpen} onClick={()=>setSettingsOpen(!settingsOpen)}><Settings/></button><button aria-label="Hide chat" title="Hide Chat" onClick={onHide}><X/></button></div></header>
    {settingsOpen&&<div className="chat-settings"><label><span>Slow mode <small>5 seconds</small></span><input type="checkbox" role="switch" checked={slowMode} onChange={e=>setSlowMode(e.target.checked)}/></label><label><span>Followers-only mode</span><input type="checkbox" role="switch" checked={followersOnly} onChange={e=>setFollowersOnly(e.target.checked)}/></label><label><span>Demo moderator mode</span><input type="checkbox" role="switch" checked={moderatorMode} onChange={e=>setModeratorMode(e.target.checked)}/></label>{moderatorMode&&<button className="clear-chat" onClick={()=>setMessages([])}><Trash2/> Clear chat</button>}<button className="hide-chat-setting" onClick={onHide}><MessageSquareOff/> Hide Chat</button></div>}
    <div className="system-message">Keep it kind, keep it Kenyan. Respect the Jukwaa community guidelines.</div>
    <div className="pinned-message"><span>PINNED BY CREATOR</span><p><b>NairobiNightOwl:</b> Leo tunataka kuskia—what is one Nairobi story you will never forget?</p></div>
    <div className="messages" ref={messagesRef}>{messages.length===0?<div className="chat-cleared">Chat cleared by a moderator.</div>:messages.map(m=><div className="chat-message" key={m.id}><p>{m.badge&&<span className={`badge ${m.badge.toLowerCase()}`}>{m.badge}</span>}<b>{m.user}</b> {m.text}</p>{moderatorMode&&m.user!=='You'&&<div className="mod-actions"><button aria-label={`Delete message from ${m.user}`} title="Delete message" onClick={()=>moderate(m.id,'Delete',m.user)}><Trash2/></button><button aria-label={`Timeout ${m.user}`} title="Timeout user" onClick={()=>moderate(m.id,'Timeout',m.user)}><UserRoundX/></button><button aria-label={`Ban ${m.user}`} title="Ban user" onClick={()=>moderate(m.id,'Ban',m.user)}><Shield/></button></div>}</div>)}</div>
    <div className="chat-input"><div><button aria-label="Add emoji" onClick={()=>setText(x=>x+'🔥')}><Smile/></button><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={followersOnly?'Followers can chat…':'Say something…'} aria-label="Chat message"/><button aria-label="Send message" onClick={send}><Send/></button></div><small>Chat responsibly · {slowMode?'5s slow mode':'Standard chat'}{moderatorMode?' · Moderator controls on':''}</small></div>
  </aside>
}

function SupportModal({open,onClose,creator}:{open:boolean;onClose:()=>void;creator:string}){const [amount,setAmount]=useState(250),[custom,setCustom]=useState(''),[message,setMessage]=useState('');const {toast}=useApp();const selected=custom?Number(custom):amount;return <Modal open={open} onClose={onClose} title={`Support ${creator}`}><div className="support-intro"><span className="mpesa-mark">M</span><p>Send a little love. Your support helps Kenyan creators keep creating.</p></div><label>Choose an amount</label><div className="amounts">{[100,250,500,1000].map(x=><button className={amount===x&&!custom?'selected':''} onClick={()=>{setAmount(x);setCustom('')}} key={x}>{money(x)}</button>)}</div><label htmlFor="custom">Custom amount ({APP.currency})</label><input id="custom" type="number" min="10" value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Enter amount"/><label htmlFor="note">Message (optional)</label><textarea id="note" value={message} onChange={e=>setMessage(e.target.value)} placeholder="Big up!"/><button className="btn btn-accent full" onClick={()=>{toast(`${money(selected)} demo support prepared — no payment processed`);onClose()}}>Continue with {money(selected)}</button><p className="demo-note">Demo only. No payment or M-Pesa request will be processed.</p></Modal>}
