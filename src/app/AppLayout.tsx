import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/student/Navbar';

export function AppLayout() {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup', '/verify-email', '/forgot-password', '/verify-reset-otp', '/reset-password'].includes(location.pathname);

  if (isAuthPage) {
    return <main className="min-h-screen bg-surface"><Outlet /></main>;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
