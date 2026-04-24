import { useState } from 'react';
import { Search, Users, Globe, ExternalLink, Loader2 } from 'lucide-react';
import { webSearch, scrapeProfiles } from '../lib/careerbot-api';

export default function WebSearchTab() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const run = async () => {
    if (!query.trim() || loading) return;
    setLoading(true); setResults([]); setAnswer('');
    try {
      const d = await webSearch(query);
      setAnswer(d.answer || '');
      setResults(d.results || []);
    } catch (e: any) { setAnswer('Error: ' + e.message); }
    finally { setLoading(false); }
  };

  const suggestions = ['Latest AI breakthroughs', 'How to learn Rust in 2025', 'Current job market trends in tech', 'Best remote work companies'];

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto' }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Global Web Search</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Ask anything. Get real-time answers powered by AI deep search.</p>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 10 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="Search for news, tutorials, market data, or anything else..."
          style={{ flex: 1, padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 15, outline: 'none' }} />
        <button onClick={run} disabled={!query.trim() || loading} className="btn btn-primary" style={{ padding: '10px 20px' }}>
          {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
        </button>
      </div>

      {/* Suggestions */}
      {!results.length && !loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => setQuery(s)}
              style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 14 }}>
          <Loader2 size={18} className="spin" /> Searching the web…
        </div>
      )}

      {/* Answer */}
      {answer && (
        <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Answer</div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{answer}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{results.length} RESULTS</div>
          {results.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', textDecoration: 'none', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-primary)')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{r.name || r.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{(r.snippet || r.content || '').slice(0, 200)}...</div>
                </div>
                <ExternalLink size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
