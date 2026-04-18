import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import DashboardCard from '../components/DashboardCard'
import { analyticsApi, candidateApi, jdApi } from '../services/api'
import { getStoredUser } from '../hooks/useAuth'
import { MATCH_COLORS } from '../utils/constants'

export default function AdminDashboard() {
  const user = getStoredUser()
  const [analytics, setAnalytics] = useState({})
  const [candidates, setCandidates] = useState([])
  const [jds, setJds] = useState([])
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    analyticsApi.getSummary().then(r => setAnalytics(r.data)).catch(() => {})
    candidateApi.getAll().then(r => setCandidates(r.data)).catch(() => {})
    jdApi.getAll().then(r => setJds(r.data)).catch(() => {})
  }, [])

  const topCandidates = [...candidates]
    .filter(c => c.matchScore != null)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-800 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-gray-300 text-sm">System overview · Welcome, {user?.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <DashboardCard title="Total Candidates" value={analytics.totalCandidates ?? '…'} icon="👥" color="indigo" />
          <DashboardCard title="Interested" value={analytics.interestedCandidates ?? '…'} icon="🙋" color="green" sub="Expressed interest" />
          <DashboardCard title="Active Jobs" value={analytics.activeJobs ?? '…'} icon="💼" color="amber" />
          <DashboardCard title="Registered Users" value={analytics.totalUsers ?? '…'} icon="🔑" color="blue" />
          <DashboardCard title="Avg Match Score" value={analytics.averageMatchScore ? `${analytics.averageMatchScore}%` : '—'} icon="🎯" color="rose" />
          <DashboardCard title="Chat Messages" value={analytics.totalChatMessages ?? '…'} icon="💬" color="indigo" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[
            { key: 'overview', label: '📈 Overview' },
            { key: 'candidates', label: '👥 All Candidates' },
            { key: 'jds', label: '📋 All JDs' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t.key ? 'bg-white shadow text-primary-700' : 'text-gray-600 hover:text-gray-900'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top candidates */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">🏆 Top Candidates by Match %</h3>
              {topCandidates.length === 0 ? (
                <p className="text-gray-400 text-sm">No candidates with match scores yet.</p>
              ) : (
                <div className="space-y-3">
                  {topCandidates.map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-400 w-5">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.email}</p>
                        </div>
                      </div>
                      <span className={`badge font-bold text-sm ${MATCH_COLORS(c.matchScore)}`}>
                        {c.matchScore}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* JD summary */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">📋 Job Description Summary</h3>
              <div className="space-y-2">
                {jds.slice(0, 6).map(jd => (
                  <div key={jd.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{jd.title}</p>
                      <p className="text-xs text-gray-500">{jd.location}</p>
                    </div>
                    <span className={`badge ${jd.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {jd.isActive ? 'Active' : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* All Candidates */}
        {tab === 'candidates' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Candidates ({candidates.length})</h2>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="pb-3 font-semibold">Name</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Exp (yrs)</th>
                    <th className="pb-3 font-semibold">Match %</th>
                    <th className="pb-3 font-semibold">Interested</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="py-3 text-gray-500">{c.email}</td>
                      <td className="py-3 text-gray-600">{c.experienceYears ?? '—'}</td>
                      <td className="py-3">
                        {c.matchScore != null
                          ? <span className={`badge font-semibold ${MATCH_COLORS(c.matchScore)}`}>{c.matchScore}%</span>
                          : <span className="text-gray-400">—</span>
                        }
                      </td>
                      <td className="py-3">
                        <span className={`badge ${c.isInterested ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.isInterested ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {candidates.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">No candidates registered yet.</p>
              )}
            </div>
          </div>
        )}

        {/* All JDs */}
        {tab === 'jds' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Job Descriptions ({jds.length})</h2>
            <div className="space-y-3">
              {jds.map(jd => (
                <div key={jd.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{jd.title}</h3>
                        <span className={`badge ${jd.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {jd.isActive ? 'Active' : 'Closed'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{jd.company} · {jd.location} · {jd.experienceRequired} yrs · {jd.modeOfWork}</p>
                    </div>
                    <span className="text-xs text-gray-400">ID: {jd.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
