import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/apply': 'Submit Application',
  '/applications': 'All Applications',
  '/workflows': 'Power Automate Workflows',
  '/activity': 'Activity Log',
  '/settings': 'Settings',
};

export default function Navbar() {
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname.startsWith('/applications/')) return 'Application Details';
    return pageTitles[location.pathname] || 'Dashboard';
  };

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
          M
        </div>
      </div>
    </header>
  );
}
