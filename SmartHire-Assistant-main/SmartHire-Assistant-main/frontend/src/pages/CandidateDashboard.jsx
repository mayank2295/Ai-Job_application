import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import ChatWidget from '../components/ChatWidget'
import ResumeUploadModal from '../components/ResumeUploadModal'
import DashboardCard from '../components/DashboardCard'
import { jdApi, candidateApi } from '../services/api'
import { getStoredUser } from '../hooks/useAuth'
import { MATCH_COLORS, MATCH_BAR_COLOR } from '../utils/constants'

export default function CandidateDashboard() {
  const user = getStoredUser()
  const [jds, setJds] = useState([])
  const [loading, setLoading] = useState(true)
  const [interestState, setInterestState] = useState({})
  const [showUpload, setShowUpload] = useState(null)
  const [matchResults, setMatchResults] = useState({})
  const [selectedJd, setSelectedJd] = useState(null)

  useEffect(() => {
    jdApi.getActive()
      .then(res => setJds(res.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user?.email) return
    jds.forEach(jd => {
      candidateApi.checkInterest(user.email, jd.id)
        .then(res => {
          if (res.data.exists) {
            setInterestState(p => ({ ...p, [jd.id]: res.data }))
            if (res.data.matchScore > 0) {
              setMatchResults(p => ({ ...p, [jd.id]: res.data.matchScore }))
            }
          }
        }).catch(() => {})
    })
  }, [jds])

  const handleInterest = async (jd) => {
    if (!user?.email) return
    try {
      const res = await candidateApi.registerInterest({
        name: user.name,
        email: user.email,
        jobDescriptionId: jd.id,
      })
      setInterestState(p => ({
        ...p,
        [jd.id]: { exists: true, candidateId: res.data.id, isInterested: true, hasResume: false, matchScore: 0 }
      }))
    } catch (err) {
      console.error(err)
    }
  }

  const interestedCount = Object.values(interestState).filter(s => s?.isInterested).length
  const avgMatch = Object.values(matchResults).length > 0
    ? (Object.values(matchResults).reduce((a, b) => a + b, 0) / Object.values(matchResults).length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-navy-900 to-primary-800 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-2xl font-bold mb-1">Welcome, {user?.name}! 👋</h1>
          <p className="text-gray-300 text-sm">
            Explore open positions, chat with our AI assistant, and upload your resume to get matched instantly.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <DashboardCard title="Open Positions" value={jds.length} icon="💼" color="indigo" />
          <DashboardCard title="Positions Applied" value={interestedCount} icon="✅" color="green" />
          <DashboardCard title="Best Match" value={avgMatch ? `${avgMatch}%` : '—'} icon="🎯" color="amber" sub="Upload resume to see" />
        </div>

        {/* Job listings */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Open Positions</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">Loading positions…</div>
          ) : jds.length === 0 ? (
            <div className="card text-center text-gray-500 py-12">No active positions right now.</div>
          ) : (
            <div className="space-y-4">
              {jds.map(jd => {
                const state = interestState[jd.id]
                const matchScore = matchResults[jd.id]

                return (
                  <div key={jd.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{jd.title}</h3>
                            <p className="text-sm text-gray-500">{jd.company} · {jd.location} · {jd.modeOfWork}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="badge bg-indigo-100 text-indigo-700">📅 {jd.experienceRequired} yrs exp</span>
                          <span className="badge bg-gray-100 text-gray-700">🏢 {jd.modeOfWork}</span>
                        </div>
                        {jd.skills && (
                          <div className="flex flex-wrap gap-1.5">
                            {jd.skills.split(',').slice(0, 7).map(s => (
                              <span key={s} className="badge bg-gray-100 text-gray-600">{s.trim()}</span>
                            ))}
                            {jd.skills.split(',').length > 7 && (
                              <span className="badge bg-gray-100 text-gray-500">+{jd.skills.split(',').length - 7} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 min-w-[160px]">
                        {matchScore > 0 && (
                          <div className="text-center mb-1">
                            <div className={`text-2xl font-black ${MATCH_COLORS(matchScore)}`}>{matchScore}%</div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                              <div className={`h-1.5 rounded-full ${MATCH_BAR_COLOR(matchScore)}`}
                                style={{ width: `${matchScore}%` }} />
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Match Score</p>
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedJd(selectedJd?.id === jd.id ? null : jd)}
                          className="text-xs btn-secondary py-1.5 px-3">
                          {selectedJd?.id === jd.id ? 'Hide Details' : 'View JD'}
                        </button>

                        {state?.isInterested ? (
                          <>
                            <span className="text-xs text-center text-green-600 font-medium">✓ Interested</span>
                            {!state.hasResume ? (
                              <button onClick={() => setShowUpload({ candidateId: state.candidateId, jdId: jd.id })}
                                className="text-xs btn-primary py-1.5 px-3">
                                Upload Resume
                              </button>
                            ) : (
                              <span className="text-xs text-center text-blue-600 font-medium">✓ Resume uploaded</span>
                            )}
                          </>
                        ) : (
                          <button onClick={() => handleInterest(jd)}
                            className="text-sm btn-primary py-2">
                            I'm Interested 🙋
                          </button>
                        )}
                      </div>
                    </div>

                    {/* JD detail */}
                    {selectedJd?.id === jd.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                          {jd.content}
                        </pre>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Resume Upload Modal */}
      {showUpload && (
        <ResumeUploadModal
          candidateId={showUpload.candidateId}
          jdId={showUpload.jdId}
          onClose={() => setShowUpload(null)}
          onSuccess={(result) => {
            setMatchResults(p => ({ ...p, [showUpload.jdId]: result.matchPercentage }))
            setInterestState(p => ({
              ...p,
              [showUpload.jdId]: { ...p[showUpload.jdId], hasResume: true }
            }))
            setShowUpload(null)
          }}
        />
      )}

      <ChatWidget />
    </div>
  )
}
