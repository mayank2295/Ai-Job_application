import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { ROLE_ROUTES } from '../utils/constants'
import Navbar from '../components/Navbar'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CANDIDATE' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.name.trim().length < 2) return setError('Name must be at least 2 characters')
    setLoading(true)
    try {
      const res = await authApi.register(form)
      if (res.data.success) {
        login(res.data)
        navigate(ROLE_ROUTES[res.data.role] || '/candidate')
      } else {
        setError(res.data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.')
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
              <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-navy-900 text-xl font-bold">+</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
              <p className="text-gray-500 text-sm mt-1">Join SmartHire today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input" placeholder="John Doe" />
              </div>
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
                  className="input" placeholder="Choose a password" minLength={6} />
              </div>
              <div>
                <label className="label">I am a…</label>
                <div className="grid grid-cols-3 gap-2">
                  {['CANDIDATE', 'RECRUITER', 'ADMIN'].map(role => (
                    <button key={role} type="button"
                      onClick={() => setForm(p => ({ ...p, role }))}
                      className={`py-2.5 text-sm font-medium rounded-lg border-2 transition-colors ${
                        form.role === role
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {role === 'CANDIDATE' ? '👤 Candidate' : role === 'RECRUITER' ? '💼 Recruiter' : '⚙️ Admin'}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-50">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already registered?{' '}
              <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
