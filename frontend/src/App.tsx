import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ApplyPage from './pages/ApplyPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import WorkflowsPage from './pages/WorkflowsPage';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/*" element={
          <div className="app-layout">
            <Sidebar />
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/apply" element={<ApplyPage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
                <Route path="/applications/:id" element={<ApplicationDetailPage />} />
                <Route path="/workflows" element={<WorkflowsPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

