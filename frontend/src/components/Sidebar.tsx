import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Briefcase, Users, Bot,
  Settings, LogOut, Zap, User, BookOpen, Globe, CheckSquare,
  Mic, BarChart2, CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export default function Sidebar({
  isMobileMenuOpen = false,
  onCloseMobileMenu,
}: SidebarProps) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onCloseMobileMenu?.();
    await logout();
    navigate('/');
  };

  const link = (to: string, Icon: any, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      onClick={() => onCloseMobileMenu?.()}
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <>
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => onCloseMobileMenu?.()}
      />

      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
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
              {link('/admin/career-bot', Bot, 'AI Chat')}
              {link('/admin/ats-resume', CheckSquare, 'ATS Analyzer')}
              {link('/admin/skill-assessment', BarChart2, 'Skill Assessment')}
              {link('/admin/settings', Settings, 'Settings')}
              <span className="sidebar-section-title">Account</span>
              {link('/billing', CreditCard, 'Billing')}
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
              {link('/interview', Mic, 'Mock Interview')}
              {link('/ats-resume', CheckSquare, 'ATS Analyzer')}
              {link('/skill-assessment', BarChart2, 'Skill Assessment')}
              {link('/courses', BookOpen, 'Find Courses')}
              {link('/web-search', Globe, 'Web Search')}
              <span className="sidebar-section-title">Account</span>
              {link('/billing', CreditCard, 'Billing')}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {user.photoURL
                ? <img src={user.photoURL} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
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
    </>
  );
}
