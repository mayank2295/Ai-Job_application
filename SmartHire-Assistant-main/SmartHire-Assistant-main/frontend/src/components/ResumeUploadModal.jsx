import { useState, useRef } from 'react'
import { resumeApi } from '../services/api'
import { MATCH_COLORS, MATCH_BAR_COLOR } from '../utils/constants'

export default function ResumeUploadModal({ candidateId, jdId, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return setError('Please select a PDF file')

    setLoading(true)
    setError('')
    try {
      const res = await resumeApi.upload(file, candidateId, jdId)
      setResult(res.data)
      onSuccess?.(res.data)
    } catch (err) {
      setError(err.response?.data || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">Upload Your Resume</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-gray-300 hover:border-primary-500 rounded-xl p-8 text-center cursor-pointer transition-colors">
              <div className="text-4xl mb-3">📄</div>
              {file ? (
                <p className="font-medium text-gray-800">{file.name}</p>
              ) : (
                <>
                  <p className="font-medium text-gray-700">Click to select PDF</p>
                  <p className="text-sm text-gray-400 mt-1">Max 10MB · PDF only</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                onChange={e => setFile(e.target.files[0])} />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 btn-secondary">Cancel</button>
              <button type="submit" disabled={!file || loading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Analyzing…
                  </span>
                ) : 'Analyze Resume'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            {/* Match Score */}
            <div className="text-center py-4">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-3xl font-black ${MATCH_COLORS(result.matchPercentage)}`}>
                {result.matchPercentage}%
              </div>
              <p className="text-gray-500 text-sm mt-2">Overall Match Score</p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className={`h-3 rounded-full transition-all ${MATCH_BAR_COLOR(result.matchPercentage)}`}
                style={{ width: `${result.matchPercentage}%` }} />
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              {[
                { label: 'Skills', val: result.skillsScore, max: 50 },
                { label: 'Experience', val: result.experienceScore, max: 30 },
                { label: 'Education', val: result.educationScore, max: 20 },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-2">
                  <div className="font-bold text-gray-800">{s.val}/{s.max}</div>
                  <div className="text-gray-500 text-xs">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Matched skills */}
            {result.matchedSkills?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1.5">✓ Matched Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedSkills.slice(0, 10).map(s => (
                    <span key={s} className="badge bg-green-100 text-green-700">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing skills */}
            {result.missingSkills?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700 mb-1.5">✗ Missing Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingSkills.slice(0, 8).map(s => (
                    <span key={s} className="badge bg-red-100 text-red-700">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {result.explanation && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">{result.explanation}</p>
            )}

            <button onClick={onClose} className="w-full btn-primary mt-2">Done</button>
          </div>
        )}
      </div>
    </div>
  )
}
