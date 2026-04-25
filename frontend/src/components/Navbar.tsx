import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, Search } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/applications': 'All Applications',
  '/admin/jobs': 'Manage Jobs',
  '/admin/users': 'All Users',
  '/admin/kanban': 'Kanban',
  '/admin/workflows': 'Workflows',
  '/admin/activity': 'Activity Log',
  '/admin/career-bot': 'CareerAI Assistant',
  '/admin/settings': 'Settings',
  '/jobs': 'Job Board',
  '/my-applications': 'My Applications',
  '/profile': 'My Profile',
  '/career-bot': 'CareerAI Assistant',
  '/skill-assessment': 'Skill Assessment',
  '/linkedin-optimizer': 'LinkedIn Optimizer',
  '/courses': 'Find Courses',
  // legacy
  '/dashboard': 'Dashboard',
  '/applications': 'All Applications',
  '/workflows': 'Workflows',
  '/activity': 'Activity Log',
  '/settings': 'Settings',
};

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const getTitle = () => {
    if (location.pathname.startsWith('/applications/')) return 'Application Details';
    return pageTitles[location.pathname] || 'Dashboard';
  };

  const userInitial = user
    ? (user.name || user.email || 'U').charAt(0).toUpperCase()
    : 'U';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/home');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-icon-btn" title="Go back" onClick={handleGoBack}>
          <ArrowLeft />
        </button>
        <button className="navbar-icon-btn navbar-menu-btn" title="Open menu" onClick={onMenuClick}>
          <Menu />
        </button>
        <h2 className="navbar-page-title">{getTitle()}</h2>
      </div>
      <div className="navbar-right">
        <button className="navbar-icon-btn" title="Search">
          <Search />
        </button>
        <NotificationBell />
        <ThemeToggle />
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--border-accent)',
              cursor: 'pointer',
            }}
          />
        ) : (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {userInitial}
          </div>
        )}
      </div>
    </header>
  );
}
