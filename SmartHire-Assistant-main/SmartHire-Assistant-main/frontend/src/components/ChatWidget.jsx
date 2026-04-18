import { useState, useEffect, useRef } from 'react'
import { chatApi, jdApi } from '../services/api'
import { getStoredUser } from '../hooks/useAuth'

function generateSessionId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

const BOT_GREETING = `Hi! I'm SmartHire Assistant powered by Claude AI. 👋

I can answer your questions about the role, required skills, team culture, and Wissen Technology.

I can also recommend courses and career tips for this position.

**What would you like to know?**`

export default function ChatWidget({ preselectedJdId }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [jds, setJds] = useState([])
  const [selectedJdId, setSelectedJdId] = useState(preselectedJdId || null)
  const [sessionId] = useState(generateSessionId)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const user = getStoredUser()

  useEffect(() => {
    jdApi.getActive().then(res => {
      setJds(res.data)
      if (!selectedJdId && res.data.length > 0) {
        setSelectedJdId(res.data[0].id)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: BOT_GREETING }])
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const sendMessage = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || !selectedJdId || loading) return

    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await chatApi.send({
        jdId: selectedJdId,
        sessionId,
        message: text,
        userName: user?.name || 'Guest',
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble connecting. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl z-50 transition-all hover:scale-110"
          title="Chat with SmartHire AI">
          💬
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-navy-900 to-primary-800 text-white rounded-t-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center text-navy-900 font-bold text-sm">
                AI
              </div>
              <div>
                <p className="font-semibold text-sm">SmartHire Assistant</p>
                <p className="text-xs text-gray-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  Powered by Claude
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="text-gray-300 hover:text-white text-xl leading-none w-7 h-7 flex items-center justify-center rounded">
              ✕
            </button>
          </div>

          {/* JD Selector */}
          {jds.length > 1 && (
            <div className="px-3 py-2 border-b bg-gray-50">
              <select
                value={selectedJdId || ''}
                onChange={e => setSelectedJdId(Number(e.target.value))}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option value="" disabled>Select a position to ask about…</option>
                {jds.map(jd => (
                  <option key={jd.id} value={jd.id}>{jd.title} — {jd.location}</option>
                ))}
              </select>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs mr-2 mt-0.5 shrink-0">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs mr-2 mt-0.5 shrink-0">AI</div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t bg-gray-50 rounded-b-2xl">
            {!selectedJdId && (
              <p className="text-xs text-amber-600 mb-2 px-1">⚠ Select a position above to start chatting</p>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={selectedJdId ? "Ask about the role…" : "Select a position first"}
                disabled={!selectedJdId || loading}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || !selectedJdId || loading}
                className="w-9 h-9 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.903 6.557H13.5a.75.75 0 010 1.5H4.182l-1.903 6.557a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
