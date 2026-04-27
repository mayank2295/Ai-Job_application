import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InterviewSetup from '../components/interview/InterviewSetup';
import InterviewSession from '../components/interview/InterviewSession';
import InterviewResults from '../components/interview/InterviewResults';
import { useToast } from '../components/ui/Toast';
import type {
  InterviewStage,
  InterviewSetupData,
  InterviewSession as InterviewSessionType,
  InterviewResult,
  Question,
  Answer,
} from '../components/interview/types';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')
).replace(/\/$/, '');

const SESSION_STORAGE_KEY = 'interview_session_state';

async function postJSON(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export default function InterviewPage() {
  const { jobId = '' } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [stage, setStage] = useState<InterviewStage>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [session, setSession] = useState<InterviewSessionType | null>(null);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | undefined>(undefined);

  // Restore session from sessionStorage on mount (Task 19.2)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.stage === 'session' && parsed.session) {
          // Restore dates
          parsed.session.startTime = new Date(parsed.session.startTime);
          parsed.session.questions = parsed.session.questions.map((q: any) => ({
            ...q,
            timestamp: new Date(q.timestamp),
          }));
          parsed.session.answers = parsed.session.answers.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp),
          }));
          setSession(parsed.session);
          setStage('session');
        }
      }
    } catch {
      // Ignore restore errors
    }
  }, []);

  // Save session to sessionStorage after each answer (Task 19.1)
  const saveSessionToStorage = useCallback((sess: InterviewSessionType) => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ stage: 'session', session: sess }));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Clear sessionStorage when done (Task 19.3)
  const clearSessionStorage = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Warn before leaving during active interview (Task 19.5)
  useEffect(() => {
    if (stage !== 'session') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [stage]);

  const handleStart = async (setupData: InterviewSetupData) => {
    setIsLoading(true);
    try {
      const data = await postJSON('/ai/interview/start', {
        jobId: jobId || undefined,
        resumeText: setupData.resumeText,
        candidateId: user?.id || user?.firebaseUser?.uid,
      });

      const firstQuestion: Question = {
        id: `q-${Date.now()}`,
        text: data.question,
        timestamp: new Date(),
      };

      const newSession: InterviewSessionType = {
        id: data.sessionId,
        userId: user?.id || user?.firebaseUser?.uid || 'anonymous',
        setupData,
        questions: [firstQuestion],
        answers: [],
        startTime: new Date(),
        status: 'active',
      };

      setSession(newSession);
      setCurrentQuestion(firstQuestion);
      setStage('session');
      saveSessionToStorage(newSession);
    } catch (e: any) {
      toast.error(e?.message || 'Could not start interview. Please try again.', 'Interview Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (answerText: string) => {
    if (!session) return;
    setIsGenerating(true);

    const answer: Answer = {
      id: `a-${Date.now()}`,
      questionId: currentQuestion?.id || '',
      text: answerText,
      timestamp: new Date(),
    };

    const updatedSession: InterviewSessionType = {
      ...session,
      answers: [...session.answers, answer],
    };
    setSession(updatedSession);
    setCurrentQuestion(undefined);

    try {
      const conversationHistory = [
        ...session.questions.map((q, i) => {
          const ans = session.answers[i];
          return [
            { role: 'assistant', content: q.text },
            ...(ans ? [{ role: 'user', content: ans.text }] : []),
          ];
        }).flat(),
        { role: 'assistant', content: currentQuestion?.text || '' },
        { role: 'user', content: answerText },
      ];

      const data = await postJSON('/ai/interview/answer', {
        sessionId: session.id,
        answer: answerText,
        conversationHistory,
      });

      if (data.complete) {
        // Interview finished
        const interviewResult: InterviewResult = {
          sessionId: session.id,
          overallScore: data.score ?? 0,
          detailedFeedback: data.feedback || '',
          strengths: data.strengths || [],
          improvements: data.improvements || [],
          cvEnhancements: data.cvEnhancements || [],
          scores: [],
          completedAt: new Date(),
        };

        const completedSession: InterviewSessionType = {
          ...updatedSession,
          status: 'completed',
          endTime: new Date(),
        };
        setSession(completedSession);
        setResult(interviewResult);
        setStage('results');
        clearSessionStorage();
      } else {
        // Next question
        const nextQ: Question = {
          id: `q-${Date.now()}`,
          text: data.nextQuestion,
          timestamp: new Date(),
        };

        const sessionWithQuestion: InterviewSessionType = {
          ...updatedSession,
          questions: [...updatedSession.questions, nextQ],
        };

        // Add inline feedback to the answer if provided
        if (data.questionFeedback) {
          const answersWithFeedback = sessionWithQuestion.answers.map(a =>
            a.id === answer.id ? { ...a, feedback: data.questionFeedback } : a
          );
          sessionWithQuestion.answers = answersWithFeedback;
        }

        setSession(sessionWithQuestion);
        setCurrentQuestion(nextQ);
        saveSessionToStorage(sessionWithQuestion);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Could not submit answer. Please try again.', 'Submission Error');
      // Revert answer on error
      setSession(session);
      setCurrentQuestion(currentQuestion);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEndInterview = () => {
    if (!session) return;
    const terminated: InterviewSessionType = { ...session, status: 'terminated', endTime: new Date() };
    setSession(terminated);
    clearSessionStorage();
    // Go back to setup
    setStage('setup');
    setSession(null);
    setCurrentQuestion(undefined);
  };

  const handleStartNew = () => {
    setStage('setup');
    setSession(null);
    setResult(null);
    setCurrentQuestion(undefined);
    clearSessionStorage();
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const content = [
      'INTERVIEW REPORT',
      '================',
      `Score: ${result.overallScore}/100`,
      `Date: ${new Date(result.completedAt).toLocaleString()}`,
      '',
      'FEEDBACK',
      '--------',
      result.detailedFeedback,
      '',
      'STRENGTHS',
      '---------',
      ...result.strengths.map(s => `- ${s}`),
      '',
      'AREAS FOR IMPROVEMENT',
      '---------------------',
      ...result.improvements.map(i => `- ${i}`),
      '',
      'CV ENHANCEMENT SUGGESTIONS',
      '--------------------------',
      ...result.cvEnhancements.map(c => `- ${c}`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      {stage === 'setup' && (
        <InterviewSetup onStart={handleStart} isLoading={isLoading} />
      )}

      {stage === 'session' && session && (
        <InterviewSession
          session={session}
          onAnswer={handleAnswer}
          onEndInterview={handleEndInterview}
          isGenerating={isGenerating}
          currentQuestion={currentQuestion}
        />
      )}

      {stage === 'results' && result && (
        <InterviewResults
          result={result}
          onStartNew={handleStartNew}
          onDownloadReport={handleDownloadReport}
        />
      )}
    </div>
  );
}
