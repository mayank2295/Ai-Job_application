import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Workflow,
  Settings,
  Zap,
  Activity,
} from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Zap size={20} />
        </div>
        <div>
          <div className="sidebar-title">JobFlow AI</div>
          <div className="sidebar-subtitle">Automation System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-title">Main</span>

        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          end
        >
          <LayoutDashboard />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/apply"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <PlusCircle />
          <span>New Application</span>
        </NavLink>

        <NavLink
          to="/applications"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FileText />
          <span>All Applications</span>
        </NavLink>

        <span className="sidebar-section-title">Automation</span>

        <NavLink
          to="/workflows"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Workflow />
          <span>Workflows</span>
        </NavLink>

        <NavLink
          to="/activity"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Activity />
          <span>Activity Log</span>
        </NavLink>

        <span className="sidebar-section-title">System</span>

        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Settings />
          <span>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
}
