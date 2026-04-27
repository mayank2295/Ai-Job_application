import { useState, useEffect } from 'react';
import { CreditCard, Users, TriangleAlert, CircleCheck, Clock, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

type SubscriptionUser = {
  id: string;
  name: string;
  email: string;
  photo_url: string;
  subscription_tier: string;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
};

type Stats = {
  paid_users: string;
  free_users: string;
  expired: string;
  expiring_soon: string;
};

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  candidate_plus: 'Candidate Plus',
  candidate_pro: 'Candidate Pro',
  recruiter_starter: 'Recruiter Starter',
  recruiter_scale: 'Recruiter Scale',
};

const TIER_COLORS: Record<string, string> = {
  free: 'var(--text-muted)',
  candidate_plus: '#06b6d4',
  candidate_pro: 'var(--accent-primary)',
  recruiter_starter: 'var(--accent-emerald)',
  recruiter_scale: 'var(--accent-amber)',
};

function fmt(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function getExpiryStatus(expiresAt: string | null, tier: string): { label: string; color: string } {
  if (tier === 'free' || !expiresAt) return { label: 'No subscription', color: 'var(--text-muted)' };
  const now = new Date();
  const exp = new Date(expiresAt);
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: 'Expired', color: 'var(--accent-rose)' };
  if (daysLeft <= 7) return { label: `Expires in ${daysLeft}d`, color: 'var(--accent-amber)' };
  return { label: `${daysLeft} days left`, color: 'var(--accent-emerald)' };
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubscriptionUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'free' | 'expiring'>('all');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [subsData, statsData] = await Promise.all([
        api.getAdminSubscriptions(),
        api.getAdminSubscriptionStats(),
      ]);
      setSubs(subsData.subscriptions || []);
      setStats(statsData.stats || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = subs.filter((u) => {
    if (filter === 'paid') return u.subscription_tier !== 'free';
    if (filter === 'free') return u.subscription_tier === 'free';
    if (filter === 'expiring') {
      if (!u.subscription_expires_at) return false;
      const daysLeft = Math.ceil((new Date(u.subscription_expires_at).getTime() - Date.now()) / 86400000);
      return daysLeft >= 0 && daysLeft <= 7;
    }
    return true;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CreditCard size={24} style={{ color: 'var(--accent-primary)' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Subscriptions
            </h1>
          </div>
          <button className="btn btn-secondary" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Monitor all user subscription plans, start dates, and expiry.
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard icon={<Users size={18} />} label="Paid Users" value={stats.paid_users} color="var(--accent-primary)" />
          <StatCard icon={<CircleCheck size={18} />} label="Free Users" value={stats.free_users} color="var(--accent-emerald)" />
          <StatCard icon={<TriangleAlert size={18} />} label="Expiring Soon" value={stats.expiring_soon} color="var(--accent-amber)" />
          <StatCard icon={<Clock size={18} />} label="Expired" value={stats.expired} color="var(--accent-rose)" />
        </div>
      )}

      {/* filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'paid', 'free', 'expiring'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: 12, padding: '6px 14px', textTransform: 'capitalize' }}
          >
            {f === 'expiring' ? 'Expiring Soon' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="card" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 20, padding: '12px 16px' }}>
          <p style={{ color: 'var(--accent-rose)', margin: 0, fontSize: 14 }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <span className="loading-text">Loading subscriptions...</span>
        </div>
      ) : (
        <div className="table-container">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CreditCard /></div>
              <div className="empty-state-title">No users found</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Started</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Payment ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const expiry = getExpiryStatus(u.subscription_expires_at, u.subscription_tier);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {u.photo_url ? (
                            <img src={u.photo_url} alt="" loading="lazy" decoding="async"
                              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'var(--gradient-accent)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontWeight: 700, fontSize: 13,
                            }}>
                              {(u.name || u.email || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                              {u.name || 'Anonymous'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: TIER_COLORS[u.subscription_tier] || 'var(--text-secondary)',
                          background: `${TIER_COLORS[u.subscription_tier] || 'var(--text-muted)'}18`,
                          padding: '3px 10px', borderRadius: 999,
                        }}>
                          {TIER_LABELS[u.subscription_tier] || u.subscription_tier}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {u.subscription_started_at ? fmt(u.subscription_started_at) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Never subscribed</span>
                        )}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {u.subscription_expires_at ? fmt(u.subscription_expires_at) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No active subscription</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, color: expiry.color }}>
                          {expiry.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {u.razorpay_payment_id
                          ? u.razorpay_payment_id.substring(0, 16) + '...'
                          : <span style={{ fontStyle: 'italic' }}>-</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{value ?? '0'}</div>
    </div>
  );
}
