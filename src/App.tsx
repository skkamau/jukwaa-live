import {Component,type ErrorInfo,type ReactNode} from 'react'
import {BrowserRouter,Route,Routes} from 'react-router-dom'
import {AppProvider} from './context'
import {Layout} from './components'
import {BrowsePage,CategoryPage,ClipsPage,FollowingPage,HomePage} from './pages/discovery'
import {WatchPage} from './pages/watch'
import {CreatorPage} from './pages/creator'
import {DashboardPage} from './pages/studio'
import {GoLivePage} from './pages/liveStudio'
import {CreatorContentPage,PastStreamDetails} from './pages/creatorContent'
import {AnalyticsPage} from './pages/analytics'
import {EarningsPage,SettingsPage} from './pages/account'
class ErrorBoundary extends Component<{children:ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return{error:true}}componentDidCatch(e:Error,info:ErrorInfo){console.error(e,info)}render(){return this.state.error?<main className="fatal"><h1>Jukwaa hit a snag.</h1><p>Refresh the page to get back to the live action.</p></main>:this.props.children}}
export default function App(){return <ErrorBoundary><AppProvider><BrowserRouter><Layout><Routes><Route path="/" element={<HomePage/>}/><Route path="/browse" element={<BrowsePage/>}/><Route path="/following" element={<FollowingPage/>}/><Route path="/category/:categoryName" element={<CategoryPage/>}/><Route path="/watch/:streamId" element={<WatchPage/>}/><Route path="/creator/:creatorId" element={<CreatorPage/>}/><Route path="/clips" element={<ClipsPage/>}/><Route path="/dashboard" element={<DashboardPage/>}/><Route path="/dashboard/content" element={<CreatorContentPage/>}/><Route path="/dashboard/content/:streamId" element={<PastStreamDetails/>}/><Route path="/dashboard/analytics" element={<AnalyticsPage/>}/><Route path="/wallet" element={<EarningsPage/>}/><Route path="/settings" element={<SettingsPage/>}/><Route path="/go-live" element={<GoLivePage/>}/><Route path="*" element={<HomePage/>}/></Routes></Layout></BrowserRouter></AppProvider></ErrorBoundary>}
