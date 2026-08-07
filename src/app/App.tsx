import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../components/common/ToastHost';
import { AuthProvider } from '../context/AuthContext';
import { AppLayout } from './AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { VerifyResetOtpPage } from '../pages/auth/VerifyResetOtpPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import StudentPreparationPage from '../pages/preparation/PreparationPage';
import TopicPage from '../pages/preparation/TopicPage';
import { BookmarksPage } from '../pages/bookmarks/BookmarksPage';
import { MockTestPage } from '../pages/mock-tests/MockTestPage';
import { MockTestsListPage } from '../pages/mock-tests/MockTestsListPage';
import { MockTestsResultsPage } from '../pages/mock-tests/MockTestsResultsPage';
import { MockTestResultPage } from '../pages/mock-tests/MockTestResultPage';
import { DailyChallengePage } from '../pages/daily-challenge/DailyChallengePage';
import { LeaderboardPage } from '../pages/leaderboard/LeaderboardPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import NotificationsListPage from '../pages/notifications/NotificationsListPage';
import NotificationDetailPage from '../pages/notifications/NotificationDetailPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/preparation/:category" element={<StudentPreparationPage />} />
            <Route path="/preparation/:category/topics/:topicId/*" element={<TopicPage />} />
            <Route path="/notifications" element={<NotificationsListPage />} />
            <Route path="/notifications/:id" element={<NotificationDetailPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/mock-tests" element={<MockTestsListPage />} />
            <Route path="/mock-tests/results" element={<MockTestsResultsPage />} />
            <Route path="/mock-tests/results/:resultId" element={<MockTestResultPage />} />
            <Route path="/mock-tests/:id" element={<MockTestPage />} />
            <Route path="/daily-challenge" element={<DailyChallengePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}