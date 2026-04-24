import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Briefcase, Users, Bot,
  Settings, LogOut, Zap, User, BookOpen, Globe, CheckSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const link = (to: string, Icon: any, label: string) => (
    <NavLink to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo"><Zap size={20} /></div>
        <div>
          <div className="sidebar-title">JobFlow AI</div>
          <div className="sidebar-subtitle">{isAdmin ? 'Admin Portal' : 'Career Portal'}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {isAdmin ? (
          <>
            <span className="sidebar-section-title">Management</span>
            {link('/admin/dashboard', LayoutDashboard, 'Dashboard')}
            {link('/admin/applications', FileText, 'All Applications')}
            {link('/admin/jobs', Briefcase, 'Manage Jobs')}
            {link('/admin/users', Users, 'All Users')}
            <span className="sidebar-section-title">Tools</span>
            {link('/admin/career-bot', Bot, 'Career Bot')}
            {link('/admin/settings', Settings, 'Settings')}
          </>
        ) : (
          <>
            <span className="sidebar-section-title">Explore</span>
            {link('/jobs', Briefcase, 'Job Board')}
            <span className="sidebar-section-title">My Space</span>
            {link('/my-applications', FileText, 'My Applications')}
            {link('/profile', User, 'My Profile')}
            <span className="sidebar-section-title">AI Tools</span>
            {link('/career-bot', Bot, 'AI Chat')}
            {link('/ats-resume', CheckSquare, 'ATS Analyzer')}
            {link('/courses', BookOpen, 'Find Courses')}
            {link('/web-search', Globe, 'Web Search')}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {user.photoURL
              ? <img src={user.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
            }
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || 'User'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isAdmin ? '👑 Admin' : 'Candidate'}</div>
            </div>
          </div>
        )}
        <button className="sidebar-link sidebar-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
