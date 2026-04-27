import { useState, useEffect } from 'react';
import AtsUpload from '../components/ats/AtsUpload';
import AtsAnalysisProgress from '../components/ats/AtsAnalysis';
import AtsResults from '../components/ats/AtsResults';
import { useToast } from '../components/ui/Toast';
import type { AtsUploadData } from '../components/ats/types';
import type { AtsAnalysis, KeywordMatch, Recommendation, ScoreBreakdown } from '../components/ats/types';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')
).replace(/\/$/, '');

const ATS_CACHE_KEY = 'jobflow_ats_last_result';

type AtsStage = 'upload' | 'analyzing' | 'results';

export default function AtsResumePage() {
  const [stage, setStage] = useState<AtsStage>('upload');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [analysis, setAnalysis] = useState<AtsAnalysis | null>(null);
  const [isCached, setIsCached] = useState(false);
  const toast = useToast();

  // Load cached result on mount (Task 20.2)
  useEffect(() => {
    try {
      const cached = localStorage.getItem(ATS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Validate required fields before using cached data
        if (
          parsed &&
          typeof parsed.overallScore === 'number' &&
          Array.isArray(parsed.scoreBreakdown) &&
          Array.isArray(parsed.matchedKeywords) &&
          Array.isArray(parsed.missingKeywords) &&
          Array.isArray(parsed.recommendations)
        ) {
          parsed.analyzedAt = new Date(parsed.analyzedAt);
          setAnalysis(parsed);
          setStage('results');
          setIsCached(true);
        } else {
          // Stale/malformed cache — clear it
          localStorage.removeItem(ATS_CACHE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(ATS_CACHE_KEY);
    }
  }, []);

  const handleAnalyze = async (data: AtsUploadData) => {
    setStage('analyzing');
    setAnalysisProgress(0);
    setIsCached(false);

    // Simulate progress stages
    const stages = [
      { progress: 15, message: 'Extracting resume content...' },
      { progress: 35, message: 'Parsing job description...' },
      { progress: 55, message: 'Matching keywords...' },
      { progress: 75, message: 'Analyzing compatibility...' },
      { progress: 90, message: 'Generating recommendations...' },
    ];

    let stageIndex = 0;
    const progressInterval = setInterval(() => {
      if (stageIndex < stages.length) {
        setAnalysisProgress(stages[stageIndex].progress);
        setAnalysisMessage(stages[stageIndex].message);
        stageIndex++;
      }
    }, 600);

    try {
      const res = await fetch(`${API_BASE}/careerbot/analyze-ats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: data.resumeText,
          jobDesc: data.jobDescriptionText,
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const raw = await res.json();
      setAnalysisProgress(100);
      setAnalysisMessage('Analysis complete!');

      // Map backend response to AtsAnalysis type
      const scoreBreakdown: ScoreBreakdown[] = [
        { category: 'Keyword Match', score: Math.round((raw.keyword_score / 30) * 100), maxScore: 100, description: 'How well your resume keywords match the job description', details: `${raw.keyword_score}/30 points` },
        { category: 'Resume Format', score: Math.round((raw.format_score / 20) * 100), maxScore: 100, description: 'ATS-friendliness of your resume format', details: `${raw.format_score}/20 points` },
        { category: 'Content Quality', score: Math.round((raw.content_score / 25) * 100), maxScore: 100, description: 'Quality of your resume content and achievements', details: `${raw.content_score}/25 points` },
        { category: 'Impact & Achievements', score: Math.round((raw.impact_score / 15) * 100), maxScore: 100, description: 'Quantified achievements and measurable impact', details: `${raw.impact_score}/15 points` },
        { category: 'Experience Match', score: Math.round((raw.experience_match / 10) * 100), maxScore: 100, description: 'How well your experience matches the requirements', details: `${raw.experience_match}/10 points` },
      ];

      const matchedKeywords: KeywordMatch[] = (raw.top_skills || []).map((kw: string) => ({
        keyword: kw,
        count: 1,
        isMatched: true,
        importance: 'high' as const,
      }));

      const missingKeywords: KeywordMatch[] = (raw.missing_keywords || []).map((kw: string) => ({
        keyword: kw,
        count: 0,
        isMatched: false,
        importance: 'high' as const,
      }));

      const recommendations: Recommendation[] = (raw.improvements || []).map((imp: string, i: number) => ({
        id: `rec-${i}`,
        type: i === 0 ? 'critical' : i === 1 ? 'important' : 'suggested',
        title: imp.split('.')[0] || imp.slice(0, 60),
        description: imp,
        impact: i === 0 ? 'high' : i === 1 ? 'medium' : 'low',
      } as Recommendation));

      const result: AtsAnalysis = {
        id: `ats-${Date.now()}`,
        userId: 'current',
        overallScore: raw.overall_score,
        scoreBreakdown,
        matchedKeywords,
        missingKeywords,
        recommendations,
        summary: raw.summary || '',
        analyzedAt: new Date(),
        resumeFileName: data.resumeFile?.name,
        jobDescriptionFileName: data.jobDescriptionFile?.name,
      };

      // Cache result (Task 20.1)
      try {
        localStorage.setItem(ATS_CACHE_KEY, JSON.stringify(result));
      } catch {
        // Ignore cache write errors
      }

      setTimeout(() => {
        setAnalysis(result);
        setStage('results');
      }, 500);
    } catch (e: any) {
      clearInterval(progressInterval);
      setStage('upload');
      toast.error(e.message || 'Analysis failed. Please try again.', 'Analysis Error');
    }
  };

  const handleTryAgain = () => {
    // Clear cache (Task 20.4)
    try {
      localStorage.removeItem(ATS_CACHE_KEY);
    } catch {
      // Ignore
    }
    setStage('upload');
    setAnalysis(null);
    setIsCached(false);
  };

  const handleExportReport = () => {
    if (!analysis) return;
    const lines = [
      'ATS RESUME ANALYSIS REPORT',
      '==========================',
      `Overall Score: ${analysis.overallScore}/100`,
      `Date: ${new Date(analysis.analyzedAt).toLocaleString()}`,
      '',
      'SUMMARY',
      '-------',
      analysis.summary,
      '',
      'SCORE BREAKDOWN',
      '---------------',
      ...analysis.scoreBreakdown.map(s => `${s.category}: ${s.score}/100 (${s.details || ''})`),
      '',
      'MATCHED KEYWORDS',
      '----------------',
      ...analysis.matchedKeywords.map(k => `+ ${k.keyword}`),
      '',
      'MISSING KEYWORDS',
      '----------------',
      ...analysis.missingKeywords.map(k => `- ${k.keyword}`),
      '',
      'RECOMMENDATIONS',
      '---------------',
      ...analysis.recommendations.map(r => `[${r.impact.toUpperCase()}] ${r.description}`),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ats-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      {/* Cached result indicator (Task 20.3) */}
      {isCached && stage === 'results' && (
        <div style={{
          maxWidth: 1152, margin: '0 auto 16px', padding: '8px 16px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 8,
          color: 'var(--accent-amber, #d97706)',
          fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>Viewing cached result from your last analysis.</span>
          <button
            onClick={handleTryAgain}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--accent-amber, #d97706)', textDecoration: 'underline',
              fontSize: 14, marginLeft: 16, padding: 0,
            }}
          >
            Run new analysis
          </button>
        </div>
      )}

      {stage === 'upload' && (
        <AtsUpload onAnalyze={handleAnalyze} isAnalyzing={false} />
      )}

      {stage === 'analyzing' && (
        <AtsAnalysisProgress
          stage="analyzing"
          progress={analysisProgress}
          message={analysisMessage}
        />
      )}

      {stage === 'results' && analysis && (
        <AtsResults
          analysis={analysis}
          onTryAgain={handleTryAgain}
          onExportReport={handleExportReport}
        />
      )}
    </div>
  );
}
