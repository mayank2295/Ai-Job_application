import { all, get, run } from '../database/db';
import { notifyUser } from './socketService';

interface ReputationBreakdown {
  verified_skills: number;       // 0-30: 5pts per skill, max 30
  ats_scores: number;            // 0-25: avg ATS score / 4
  interview_performance: number; // 0-25: avg interview score / 4
  application_quality: number;   // 0-10: cover letter quality
  profile_completeness: number;  // 0-10: all fields filled
}

export async function recalculateReputation(userId: string): Promise<number> {
  const [user, applications, interviews] = await Promise.all([
    get<any>('SELECT * FROM users WHERE id = $1', [userId]),
    all<any>(
      `SELECT ai_score, cover_letter FROM applications
       WHERE user_id = (SELECT firebase_uid FROM users WHERE id = $1)
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    ),
    all<any>(
      'SELECT score FROM interview_sessions WHERE candidate_id = $1 AND score IS NOT NULL ORDER BY created_at DESC LIMIT 10',
      [userId]
    ),
  ]);

  const u = user;
  if (!u) return 0;

  const breakdown: ReputationBreakdown = {
    verified_skills: 0,
    ats_scores: 0,
    interview_performance: 0,
    application_quality: 0,
    profile_completeness: 0,
  };

  // Verified skills (max 30)
  const verifiedSkills = Array.isArray(u.verified_skills) ? u.verified_skills.length : 0;
  breakdown.verified_skills = Math.min(30, verifiedSkills * 5);

  // ATS scores (max 25)
  const scored = applications.filter((a: any) => a.ai_score != null);
  if (scored.length > 0) {
    const avg = scored.reduce((s: number, a: any) => s + a.ai_score, 0) / scored.length;
    breakdown.ats_scores = Math.round(avg / 4);
  }

  // Interview performance (max 25)
  if (interviews.length > 0) {
    const avg = interviews.reduce((s: number, i: any) => s + i.score, 0) / interviews.length;
    breakdown.interview_performance = Math.round(avg / 4);
  }

  // Application quality (max 10)
  const withCL = applications.filter((a: any) => a.cover_letter && a.cover_letter.length > 100);
  breakdown.application_quality = Math.round((withCL.length / Math.max(applications.length, 1)) * 10);

  // Profile completeness (max 10)
  const fields = [u.name, u.phone, u.headline, u.skills, u.photo_url];
  breakdown.profile_completeness = Math.round((fields.filter(Boolean).length / fields.length) * 10);

  const total = Math.min(100, Object.values(breakdown).reduce((s, v) => s + v, 0));

  await run(
    `UPDATE users SET
       reputation_score = $1,
       reputation_breakdown = $2::jsonb,
       total_applications = $3,
       avg_ats_score = $4,
       verified_skills_count = $5,
       updated_at = NOW()
     WHERE id = $6`,
    [total, JSON.stringify(breakdown), applications.length, breakdown.ats_scores * 4, verifiedSkills, userId]
  );

  // Notify user in real-time via WebSocket
  if (u.firebase_uid) {
    notifyUser(u.firebase_uid, 'reputation_updated', { score: total, breakdown });
  }

  return total;
}
