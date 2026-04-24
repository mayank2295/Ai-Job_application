import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/apply': 'Submit Application',
  '/applications': 'All Applications',
  '/workflows': 'Power Automate Workflows',
  '/activity': 'Activity Log',
  '/settings': 'Settings',
  '/career-bot': 'CareerAI Assistant',
};

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();

  const getTitle = () => {
    if (location.pathname.startsWith('/applications/')) return 'Application Details';
    return pageTitles[location.pathname] || 'Dashboard';
  };

  const userInitial = user
    ? (user.displayName || user.email || 'U').charAt(0).toUpperCase()
    : 'U';

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h2 className="navbar-page-title">{getTitle()}</h2>
      </div>
      <div className="navbar-right">
        <button className="navbar-icon-btn" title="Search">
          <Search />
        </button>
        <button className="navbar-icon-btn" title="Notifications">
          <Bell />
        </button>
        <ThemeToggle />
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
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
