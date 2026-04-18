import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { ROLE_ROUTES } from '../utils/constants'
import Navbar from '../components/Navbar'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(form)
      if (res.data.success) {
        login(res.data)
        navigate(ROLE_ROUTES[res.data.role] || '/candidate')
      } else {
        setError(res.data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = async (email, password) => {
    setForm({ email, password })
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ email, password })
      if (res.data.success) {
        login(res.data)
        navigate(ROLE_ROUTES[res.data.role] || '/candidate')
      }
    } catch {
      setError('Demo login failed — ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">🔐</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-gray-500 text-sm mt-1">Sign in to your SmartHire account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input" placeholder="you@example.com" />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" required value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input" placeholder="••••••••" />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-50">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
                  Demo accounts
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: 'Admin', email: 'admin@smarthire.com', pass: 'admin123', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                  { label: 'Recruiter', email: 'recruiter@smarthire.com', pass: 'recruiter123', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                  { label: 'Candidate', email: 'candidate@smarthire.com', pass: 'candidate123', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
                ].map(d => (
                  <button key={d.label} type="button"
                    onClick={() => demoLogin(d.email, d.pass)}
                    className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors ${d.color}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              No account?{' '}
              <Link to="/signup" className="text-primary-600 font-medium hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
