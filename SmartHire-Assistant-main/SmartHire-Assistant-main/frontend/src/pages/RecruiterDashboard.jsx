import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import DashboardCard from '../components/DashboardCard'
import { jdApi, candidateApi, analyticsApi } from '../services/api'
import { getStoredUser } from '../hooks/useAuth'
import { MATCH_COLORS, MATCH_BAR_COLOR } from '../utils/constants'

const BLANK_JD = { title: '', company: 'Wissen Technology', location: '', modeOfWork: 'Hybrid',
  experienceRequired: '', experienceMin: 0, experienceMax: 25, skills: '', content: '', isActive: true }

export default function RecruiterDashboard() {
  const user = getStoredUser()
  const [analytics, setAnalytics] = useState({})
  const [jds, setJds] = useState([])
  const [candidates, setCandidates] = useState([])
  const [tab, setTab] = useState('overview')
  const [showJdForm, setShowJdForm] = useState(false)
  const [jdForm, setJdForm] = useState(BLANK_JD)
  const [saving, setSaving] = useState(false)
  const [selectedJdFilter, setSelectedJdFilter] = useState('all')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    analyticsApi.getSummary().then(r => setAnalytics(r.data)).catch(() => {})
    jdApi.getAll().then(r => setJds(r.data)).catch(() => {})
    candidateApi.getAll().then(r => setCandidates(r.data)).catch(() => {})
  }, [])

  const handleSaveJd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await jdApi.create(jdForm)
      setJds(p => [res.data, ...p])
      setShowJdForm(false)
      setJdForm(BLANK_JD)
      analyticsApi.getSummary().then(r => setAnalytics(r.data)).catch(() => {})
    } catch { } finally { setSaving(false) }
  }

  const handleDeactivate = async (id) => {
    await jdApi.deactivate(id)
    setJds(p => p.map(j => j.id === id ? { ...j, isActive: false } : j))
  }

  const filteredCandidates = candidates
    .filter(c => selectedJdFilter === 'all' || String(c.jobDescriptionId) === selectedJdFilter)
    .sort((a, b) => sortOrder === 'desc'
      ? (b.matchScore || 0) - (a.matchScore || 0)
      : (a.matchScore || 0) - (b.matchScore || 0))

  const parseJson = (str) => { try { return JSON.parse(str || '[]') } catch { return [] } }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-navy-900 to-primary-800 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-2xl font-bold mb-1">Recruiter Dashboard</h1>
          <p className="text-gray-300 text-sm">Welcome back, {user?.name}. Manage JDs and review candidates.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <DashboardCard title="Total Candidates" value={analytics.totalCandidates ?? '…'} icon="👥" color="indigo" />
          <DashboardCard title="Avg Match %" value={analytics.averageMatchScore ? `${analytics.averageMatchScore}%` : '—'} icon="🎯" color="green" />
          <DashboardCard title="Active Jobs" value={analytics.activeJobs ?? '…'} icon="💼" color="amber" />
          <DashboardCard title="Chat Messages" value={analytics.totalChatMessages ?? '…'} icon="💬" color="blue" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[
            { key: 'overview', label: '📋 Job Descriptions' },
            { key: 'candidates', label: '👥 Candidates' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t.key ? 'bg-white shadow text-primary-700' : 'text-gray-600 hover:text-gray-900'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* JD Tab */}
        {tab === 'overview' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Job Descriptions ({jds.length})</h2>
              <button onClick={() => setShowJdForm(!showJdForm)} className="btn-primary text-sm">
                + New JD
              </button>
            </div>

            {/* JD Form */}
            {showJdForm && (
              <form onSubmit={handleSaveJd} className="card mb-6 space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-3">Create Job Description</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Job Title *</label>
                    <input required className="input" value={jdForm.title}
                      onChange={e => setJdForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Java Developer" />
                  </div>
                  <div>
                    <label className="label">Company</label>
                    <input className="input" value={jdForm.company}
                      onChange={e => setJdForm(p => ({ ...p, company: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Location *</label>
                    <input required className="input" value={jdForm.location}
                      onChange={e => setJdForm(p => ({ ...p, location: e.target.value }))}
                      placeholder="e.g. Bangalore" />
                  </div>
                  <div>
                    <label className="label">Experience Required</label>
                    <input className="input" value={jdForm.experienceRequired}
                      onChange={e => setJdForm(p => ({ ...p, experienceRequired: e.target.value }))}
                      placeholder="e.g. 5-8 or 12+" />
                  </div>
                  <div>
                    <label className="label">Min Experience (yrs)</label>
                    <input type="number" className="input" value={jdForm.experienceMin}
                      onChange={e => setJdForm(p => ({ ...p, experienceMin: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="label">Mode of Work</label>
                    <select className="input" value={jdForm.modeOfWork}
                      onChange={e => setJdForm(p => ({ ...p, modeOfWork: e.target.value }))}>
                      <option>Hybrid</option><option>Remote</option><option>On-site</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Required Skills (comma-separated)</label>
                  <input className="input" value={jdForm.skills}
                    onChange={e => setJdForm(p => ({ ...p, skills: e.target.value }))}
                    placeholder="Java, Spring Boot, Microservices, Docker" />
                </div>
                <div>
                  <label className="label">Full JD Content *</label>
                  <textarea required className="input h-40 resize-none" value={jdForm.content}
                    onChange={e => setJdForm(p => ({ ...p, content: e.target.value }))}
                    placeholder="Paste the complete job description here…" />
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowJdForm(false)} className="btn-secondary text-sm">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save JD'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {jds.map(jd => (
                <div key={jd.id} className={`card ${!jd.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{jd.title}</h3>
                        <span className={`badge ${jd.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {jd.isActive ? 'Active' : 'Closed'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{jd.company} · {jd.location} · {jd.experienceRequired} yrs</p>
                      {jd.skills && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {jd.skills.split(',').slice(0, 6).map(s => (
                            <span key={s} className="badge bg-indigo-50 text-indigo-600">{s.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedJdFilter(String(jd.id)); setTab('candidates') }}
                        className="text-xs btn-secondary py-1">
                        View Candidates
                      </button>
                      {jd.isActive && (
                        <button onClick={() => handleDeactivate(jd.id)}
                          className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Candidates Tab */}
        {tab === 'candidates' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Candidates ({filteredCandidates.length})</h2>
              <div className="flex gap-2">
                <select value={selectedJdFilter}
                  onChange={e => setSelectedJdFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400">
                  <option value="all">All Positions</option>
                  {jds.map(j => <option key={j.id} value={String(j.id)}>{j.title}</option>)}
                </select>
                <button onClick={() => setSortOrder(p => p === 'desc' ? 'asc' : 'desc')}
                  className="text-sm btn-secondary py-1.5">
                  Match% {sortOrder === 'desc' ? '↓' : '↑'}
                </button>
              </div>
            </div>

            {filteredCandidates.length === 0 ? (
              <div className="card text-center text-gray-500 py-12">No candidates yet.</div>
            ) : (
              <div className="space-y-3">
                {filteredCandidates.map((c, i) => (
                  <div key={c.id} className="card cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedCandidate(selectedCandidate?.id === c.id ? null : c)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.email} · {c.experienceYears ?? '?'} yrs exp</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          {c.matchScore != null ? (
                            <>
                              <span className={`text-lg font-black ${MATCH_COLORS(c.matchScore)}`}>{c.matchScore}%</span>
                              <div className="w-20 bg-gray-100 rounded-full h-1.5 mt-1">
                                <div className={`h-1.5 rounded-full ${MATCH_BAR_COLOR(c.matchScore)}`}
                                  style={{ width: `${c.matchScore}%` }} />
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">No resume</span>
                          )}
                        </div>
                        <span className="text-gray-300">▾</span>
                      </div>
                    </div>

                    {selectedCandidate?.id === c.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        {c.extractedSkills && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1.5">Extracted Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {c.extractedSkills.split(',').map(s => (
                                <span key={s} className="badge bg-blue-50 text-blue-600">{s.trim()}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {c.matchedSkillsJson && parseJson(c.matchedSkillsJson).length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-700 mb-1.5">✓ Matched Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {parseJson(c.matchedSkillsJson).map(s => (
                                <span key={s} className="badge bg-green-100 text-green-700">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {c.matchExplanation && (
                          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">{c.matchExplanation}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
