import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, Search, Settings, LogOut, User, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect, useCallback } from 'react';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')
).replace(/\/$/, '');

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/applications': 'All Applications',
  '/admin/jobs': 'Manage Jobs',
  '/admin/users': 'All Users',
  '/admin/subscriptions': 'Subscriptions',
  '/admin/workflows': 'Workflows',
  '/admin/activity': 'Activity Log',
  '/admin/career-bot': 'AI Chat',
  '/admin/ats-resume': 'ATS Analyzer',
  '/admin/skill-assessment': 'Skill Assessment',
  '/admin/settings': 'Settings',
  '/jobs': 'Job Board',
  '/my-applications': 'My Applications',
  '/profile': 'My Profile',
  '/career-bot': 'AI Chat',
  '/interview': 'Mock Interview',
  '/ats-resume': 'ATS Analyzer',
  '/skill-assessment': 'Skill Assessment',
  '/courses': 'Find Courses',
  '/web-search': 'Web Search',
  '/billing': 'Billing & Plans',
  '/settings': 'Settings',
  '/resume-builder': 'Resume Builder',
};

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Search modal
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getTitle = () => {
    if (location.pathname.startsWith('/applications/')) return 'Application Details';
    if (location.pathname.startsWith('/admin/applications/')) return 'Application Details';
    if (location.pathname.startsWith('/jobs/')) return 'Job Details';
    return pageTitles[location.pathname] || 'Dashboard';
  };

  const userInitial = user
    ? (user.name || user.email || 'U').charAt(0).toUpperCase()
    : 'U';

  const handleGoBack = () => {
    if (window.history.length > 1) { navigate(-1); return; }
    navigate('/home');
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  // Focus search input when modal opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Debounced job search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`${API_BASE}/jobs?search=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setSearchResults(data.jobs || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSearchResultClick = (jobId: string) => {
    setSearchOpen(false);
    navigate(isAdmin ? `/admin/jobs` : `/jobs/${jobId}`);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/');
  };

  const handleSettings = () => {
    setProfileOpen(false);
    navigate(isAdmin ? '/admin/settings' : '/settings');
  };

  const handleProfile = () => {
    setProfileOpen(false);
    navigate('/profile');
  };

  return (
    <>
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
          {/* Search button */}
          <button className="navbar-icon-btn" title="Search jobs" onClick={() => setSearchOpen(true)}>
            <Search />
          </button>

          <NotificationBell />
          <ThemeToggle />

          {/* Profile avatar with dropdown */}
          <div style={{ position: 'relative' }} ref={profileRef}>
            <button
              onClick={() => setProfileOpen(v => !v)}
              title="Account menu"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center',
              }}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  style={{
                    width: 34, height: 34, borderRadius: '50%', objectFit: 'cover',
                    border: '2px solid var(--border-accent)',
                  }}
                />
              ) : (
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'white',
                }}>
                  {userInitial}
                </div>
              )}
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                width: 220, background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                zIndex: 1000, overflow: 'hidden',
              }}>
                {/* User info header */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-primary)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: '6px 0' }}>
                  {!isAdmin && (
                    <DropdownItem icon={<User size={15} />} label="My Profile" onClick={handleProfile} />
                  )}
                  <DropdownItem icon={<Settings size={15} />} label="Settings" onClick={handleSettings} />
                  <div style={{ height: 1, background: 'var(--border-primary)', margin: '6px 0' }} />
                  <DropdownItem icon={<LogOut size={15} />} label="Sign Out" onClick={handleLogout} danger />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '10vh',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 560, margin: '0 16px',
            background: 'var(--bg-card)', borderRadius: 16,
            border: '1px solid var(--border-primary)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}>
            {/* Search input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border-primary)' }}>
              <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search jobs by title, location, department..."
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  background: 'transparent', fontSize: 15,
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={() => setSearchOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {searchLoading && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Searching...
                </div>
              )}
              {!searchLoading && searchQuery && searchResults.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No jobs found for "{searchQuery}"
                </div>
              )}
              {!searchLoading && !searchQuery && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Type to search jobs...
                </div>
              )}
              {searchResults.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleSearchResultClick(job.id)}
                  style={{
                    padding: '12px 16px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border-primary)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-glass-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                    {job.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                    <span>{job.location}</span>
                    {job.department && <span>{job.department}</span>}
                    <span style={{ marginLeft: 'auto', color: 'var(--accent-primary)', fontWeight: 600 }}>{job.type}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer hint */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-primary)', display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Press <kbd style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 4, fontSize: 10 }}>Esc</kbd> to close</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click a result to view job</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DropdownItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 13, color: danger ? 'var(--accent-rose)' : 'var(--text-secondary)',
        textAlign: 'left', transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-glass-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      {label}
    </button>
  );
}
