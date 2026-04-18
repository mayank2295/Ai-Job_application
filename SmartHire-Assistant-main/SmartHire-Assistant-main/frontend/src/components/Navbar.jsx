import { Link, useNavigate, useLocation } from 'react-router-dom'
import { getStoredUser } from '../hooks/useAuth'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getStoredUser()

  const isDashboard = ['/recruiter', '/candidate', '/admin'].some(p =>
    location.pathname.startsWith(p)
  )

  const handleLogout = () => {
    localStorage.removeItem('smarthire_user')
    navigate('/')
  }

  const dashboardPath = user
    ? user.role === 'ADMIN' ? '/admin'
    : user.role === 'RECRUITER' ? '/recruiter'
    : '/candidate'
    : null

  return (
    <nav className="bg-navy-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
              <span className="text-navy-900 font-bold text-sm">SH</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">SmartHire</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            {!isDashboard && (
              <>
                <a href="#features" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Features</a>
                <a href="#about" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">About</a>
              </>
            )}
            {isDashboard && dashboardPath && (
              <Link to={dashboardPath} className="text-gray-300 hover:text-white text-sm font-medium">
                Dashboard
              </Link>
            )}
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-gray-300 text-sm hidden md:block">
                  {user.name} <span className="text-gold text-xs ml-1">({user.role})</span>
                </span>
                <button onClick={handleLogout}
                  className="text-sm border border-gray-500 text-gray-300 hover:text-white hover:border-white px-4 py-1.5 rounded-lg transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link to="/signup"
                  className="bg-gold hover:bg-yellow-500 text-navy-900 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
