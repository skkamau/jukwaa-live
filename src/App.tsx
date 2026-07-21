import { Component, type ErrorInfo, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./auth";
import { CreatorProvider, CreatorRoute } from "./creator";
import { Layout } from "./components";
import { AppProvider } from "./context";
import { EarningsPage, SettingsPage } from "./pages/account";
import { AnalyticsPage } from "./pages/analytics";
import {
  ForgotPasswordPage,
  LegalPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from "./pages/auth";
import { CreatorPage } from "./pages/creator";
import { CreatorContentPage, PastStreamDetails } from "./pages/creatorContent";
import {
  BrowsePage,
  CategoryPage,
  ClipsPage,
  FollowingPage,
  HomePage,
} from "./pages/discovery";
import { GoLivePage } from "./pages/liveStudio";
import { DashboardPage } from "./pages/studio";
import { WatchPage } from "./pages/watch";
import { ChannelPage } from "./pages/channel";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }
  render() {
    return this.state.error ? (
      <main className="fatal">
        <h1>Vyrlo hit a snag.</h1>
        <p>Refresh the page to get back to the live action.</p>
      </main>
    ) : (
      this.props.children
    );
  }
}
const protectedPage = (page: ReactNode) => (
  <ProtectedRoute>{page}</ProtectedRoute>
);

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CreatorProvider>
            <AppProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/browse" element={<BrowsePage />} />
                <Route path="/following" element={<FollowingPage />} />
                <Route
                  path="/category/:categoryName"
                  element={<CategoryPage />}
                />
                <Route path="/watch/:streamId" element={<WatchPage />} />
                <Route path="/creator/:creatorId" element={<CreatorPage />} />
                <Route path="/channel/:slug" element={<ChannelPage />} />
                <Route path="/clips" element={<ClipsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/terms" element={<LegalPage kind="terms" />} />
                <Route path="/privacy" element={<LegalPage kind="privacy" />} />
                <Route
                  path="/dashboard"
                  element={protectedPage(<DashboardPage />)}
                />
                <Route
                  path="/dashboard/content"
                  element={protectedPage(<CreatorRoute><CreatorContentPage /></CreatorRoute>)}
                />
                <Route
                  path="/dashboard/content/:streamId"
                  element={protectedPage(<CreatorRoute><PastStreamDetails /></CreatorRoute>)}
                />
                <Route
                  path="/dashboard/analytics"
                  element={protectedPage(<CreatorRoute><AnalyticsPage /></CreatorRoute>)}
                />
                <Route
                  path="/wallet"
                  element={protectedPage(<EarningsPage />)}
                />
                <Route
                  path="/settings"
                  element={protectedPage(<SettingsPage />)}
                />
                <Route
                  path="/go-live"
                  element={protectedPage(<CreatorRoute><GoLivePage /></CreatorRoute>)}
                />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </Layout>
            </AppProvider>
          </CreatorProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
