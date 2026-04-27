import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HelpBot from './components/HelpBot';
import ProfileCompletionModal from './components/ProfileCompletionModal';
import { useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import { ToastProvider } from './components/ui/Toast';

// Shared pages
import CareerBotPage from './pages/CareerBotPage';
import SettingsPage from './pages/SettingsPage';

// Admin pages
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import WorkflowsPage from './pages/WorkflowsPage';
import ActivityPage from './pages/ActivityPage';
import AdminJobsPage from './pages/AdminJobsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCandidateAnalyticsPage from './pages/AdminCandidateAnalyticsPage';
import AdminSubscriptionsPage from './pages/AdminSubscriptionsPage';

// Candidate pages
import JobBoardPage from './pages/JobBoardPage';
import JobDetailPage from './pages/JobDetailPage';
import CoursesPage from './pages/CoursesPage';
import AtsResumePage from './pages/AtsResumePage';
import WebSearchPage from './pages/WebSearchPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import ProfilePage from './pages/ProfilePage';
import InterviewPage from './pages/InterviewPage';
import SkillAssessmentPage from './pages/SkillAssessmentPage';
import BillingPage from './pages/BillingPage';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import CandidateSettingsPage from './pages/CandidateSettingsPage';
function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, emailVerified, resendVerificationEmail } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isMobileViewport = window.matchMedia('(max-width: 1024px)').matches;
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    return isMobileViewport && isAdminRoute;
  });
  const [verificationSent, setVerificationSent] = useState(false);

  // Show profile completion modal for candidates with incomplete profiles
  const [showProfileModal, setShowProfileModal] = useState(false);
  useEffect(() => {
    if (!user || isAdmin) return;
    const dismissed = sessionStorage.getItem(`profile_modal_dismissed_${user.id}`);
    if (dismissed) return;
    const isIncomplete = !user.name || !user.phone || !user.skills;
    if (isIncomplete) setShowProfileModal(true);
  }, [user?.id]);

  const handleModalClose = () => {
    if (user) sessionStorage.setItem(`profile_modal_dismissed_${user.id}`, '1');
    setShowProfileModal(false);
  };

  const handleResendVerification = async () => {
    await resendVerificationEmail();
    setVerificationSent(true);
    setTimeout(() => setVerificationSent(false), 5000);
  };

  // Show email verification banner for email/password users who haven't verified
  const showVerificationBanner = user && !emailVerified && !isAdmin &&
    user.firebaseUser.providerData.some(p => p.providerId === 'password');

  return (
    <div className="app-layout">
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <Navbar onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)} />
      {showVerificationBanner && (
        <div style={{
          position: 'fixed', top: 'var(--navbar-height)', left: 'var(--sidebar-width)', right: 0,
          zIndex: 200, background: '#f59e0b', padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          fontSize: 13, color: '#1c1917', flexWrap: 'wrap',
        }}>
          <span>📧 Please verify your email address to unlock all features.</span>
          <button
            onClick={handleResendVerification}
            style={{ background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#1c1917', fontFamily: 'inherit' }}
          >
            {verificationSent ? 'Sent!' : 'Resend email'}
          </button>
        </div>
      )}
      <main className="main-content" style={showVerificationBanner ? { paddingTop: 'calc(var(--navbar-height) + 40px)' } : undefined}>{children}</main>
      <HelpBot />
      {showProfileModal && <ProfileCompletionModal onClose={handleModalClose} />}
    </div>
  );
}

function AdminRoot() {
  const { isAdmin, user } = useAuth();
  if (!user) return null;
  if (!isAdmin) return <Navigate to="/jobs" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}

function CandidateRoot() {
  const { isAdmin, user } = useAuth();
  if (!user) return null;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/jobs" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Role redirect */}
        <Route path="/home" element={<ProtectedRoute><CandidateRoot /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute requiredRole="admin">
            <AppLayout>
              <Routes>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="applications/:id" element={<ApplicationDetailPage />} />
                <Route path="jobs" element={<AdminJobsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
                <Route path="workflows" element={<WorkflowsPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="career-bot" element={<CareerBotPage />} />
                <Route path="candidate-analytics" element={<AdminCandidateAnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="ats-resume" element={<AtsResumePage />} />
                <Route path="skill-assessment" element={<SkillAssessmentPage />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Candidate routes */}
        <Route path="/jobs" element={
          <ProtectedRoute requiredRole="candidate">
            <AppLayout><JobBoardPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/jobs/:id" element={
          <ProtectedRoute requiredRole="candidate">
            <AppLayout><JobDetailPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/my-applications" element={
          <ProtectedRoute requiredRole="candidate">
            <AppLayout><MyApplicationsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute requiredRole="candidate">
            <AppLayout><ProfilePage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/interview" element={
          <ProtectedRoute requiredRole="candidate">
            <AppLayout><InterviewPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/interview/:jobId" element={
          <ProtectedRoute requiredRole="candidate">
            <AppLayout><InterviewPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/skill-assessment" element={
          <ProtectedRoute requiredRole="candidate">
            <AppLayout><SkillAssessmentPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/career-bot" element={
          <ProtectedRoute requiredRole="candidate">
            <AppLayout><CareerBotPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/ats-resume" element={
          <ProtectedRoute requiredRole="candidate">
            <AppLayout><AtsResumePage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/courses" element={
          <ProtectedRoute requiredRole="candidate">
            <AppLayout><CoursesPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/web-search" element={
          <ProtectedRoute requiredRole="candidate">
            <AppLayout><WebSearchPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/resume-builder" element={
          <ProtectedRoute requiredRole="candidate">
            <AppLayout><ResumeBuilderPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/billing" element={
          <ProtectedRoute>
            <AppLayout><BillingPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout><CandidateSettingsPage /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Legacy redirects — keep old links working */}
        <Route path="/dashboard" element={<ProtectedRoute><AdminRoot /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><Navigate to="/admin/applications" replace /></ProtectedRoute>} />
        <Route path="/apply" element={<ProtectedRoute><Navigate to="/jobs" replace /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
