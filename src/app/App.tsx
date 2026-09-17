import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../components/common/ToastHost';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AppLayout } from './AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { VerifyResetOtpPage } from '../pages/auth/VerifyResetOtpPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { DeleteAccountPage } from '../pages/delete-account/DeleteAccountPage';
import { AccountDeletedPage } from '../pages/delete-account/AccountDeletedPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import StudentPreparationPage from '../pages/preparation/PreparationPage';
import TopicPage from '../pages/preparation/TopicPage';
import { MockTestPage } from '../pages/mock-tests/MockTestPage';
import { MockTestsListPage } from '../pages/mock-tests/MockTestsListPage';
import { MockTestsResultsPage } from '../pages/mock-tests/MockTestsResultsPage';
import { MockTestResultPage } from '../pages/mock-tests/MockTestResultPage';
import { DailyChallengePage } from '../pages/daily-challenge/DailyChallengePage';
import { LeaderboardPage } from '../pages/leaderboard/LeaderboardPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { DownloadsPage } from '../pages/downloads/DownloadsPage';
import NotificationsListPage from '../pages/notifications/NotificationsListPage';
import NotificationDetailPage from '../pages/notifications/NotificationDetailPage';
import { SplashScreen } from '../components/common/SplashScreen';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </AuthProvider>
  );
}

function AppRouter() {
  const auth = useAuth();

  return (
    <>
      <SplashScreen ready={!auth.loading} />
      <Routes>
        <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />
        <Route path="/verify-email" element={<PublicOnly><VerifyEmailPage /></PublicOnly>} />
        <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
        <Route path="/verify-reset-otp" element={<PublicOnly><VerifyResetOtpPage /></PublicOnly>} />
        <Route path="/reset-password" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />
        <Route path="/delete-account" element={<DeleteAccountPage />} />
        <Route path="/account-deleted" element={<AccountDeletedPage />} />
        <Route element={<ProtectedOnly><AppLayout /></ProtectedOnly>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/preparation/:category" element={<StudentPreparationPage />} />
          <Route path="/preparation/:category/topics/:topicId/*" element={<TopicPage />} />
          <Route path="/notifications" element={<NotificationsListPage />} />
          <Route path="/notifications/:notificationId" element={<NotificationDetailPage />} />
          <Route path="/notifications/:id" element={<NotificationDetailPage />} />
          <Route path="/mock-tests" element={<MockTestsListPage />} />
          <Route path="/mock-tests/results" element={<MockTestsResultsPage />} />
          <Route path="/mock-tests/results/:resultId" element={<MockTestResultPage />} />
          <Route path="/mock-tests/:id" element={<MockTestPage />} />
          <Route path="/daily-challenge" element={<DailyChallengePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/downloads" element={<DownloadsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/privacy" element={<SettingsPage defaultTab="privacy" />} />
        </Route>
        <Route path="*" element={<DefaultRoute />} />
      </Routes>
    </>
  );
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ProtectedOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function DefaultRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? '/' : '/login'} replace />;
}
