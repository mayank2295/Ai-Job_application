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
function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isMobileViewport = window.matchMedia('(max-width: 1024px)').matches;
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    return isMobileViewport && isAdminRoute;
  });

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

  return (
    <div className="app-layout">
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <Navbar onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)} />
      <main className="main-content">{children}</main>
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
        <Route path="/billing" element={
          <ProtectedRoute>
            <AppLayout><BillingPage /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Legacy redirects — keep old links working */}
        <Route path="/dashboard" element={<ProtectedRoute><AdminRoot /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><Navigate to="/admin/applications" replace /></ProtectedRoute>} />
        <Route path="/apply" element={<ProtectedRoute><Navigate to="/jobs" replace /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
