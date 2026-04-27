import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Check, Zap, Star, Infinity, Shield } from 'lucide-react';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')
).replace(/\/$/, '');

type Plan = {
  key: string;
  name: string;
  price: number;
  currency: string;
  badge?: string;
  tagline: string;
  features: Array<{ text: string; highlight?: boolean }>;
  popular?: boolean;
  cta: string;
};

const CANDIDATE_PLANS: Plan[] = [
  {
    key: 'candidate_free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    tagline: 'Get started with the basics',
    cta: 'Current Plan',
    features: [
      { text: '3 ATS resume scans/month' },
      { text: '1 mock interview/month' },
      { text: 'Browse job board' },
      { text: 'Basic AI chat' },
      { text: 'Resume builder (1 template)' },
    ],
  },
  {
    key: 'candidate_plus',
    name: 'Plus',
    price: 499,
    currency: 'INR',
    tagline: '100 requests per month',
    cta: 'Get Plus',
    features: [
      { text: '100 ATS resume scans/month', highlight: true },
      { text: '100 mock interviews/month', highlight: true },
      { text: 'Full AI career bot' },
      { text: 'Resume builder (all 4 templates)' },
      { text: 'Skill assessments' },
      { text: 'Course finder' },
      { text: 'Web search integration' },
    ],
  },
  {
    key: 'candidate_pro',
    name: 'Pro',
    price: 999,
    currency: 'INR',
    tagline: 'Unlimited everything',
    badge: 'Most Popular',
    cta: 'Get Pro',
    popular: true,
    features: [
      { text: 'Unlimited ATS scans', highlight: true },
      { text: 'Unlimited mock interviews', highlight: true },
      { text: 'Full AI career bot' },
      { text: 'Resume builder (all 4 templates)' },
      { text: 'Skill assessments + badges' },
      { text: 'Reputation score' },
      { text: 'Course finder' },
      { text: 'Web search integration' },
      { text: 'Priority support' },
    ],
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStatus = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.firebaseUser.getIdToken();
      const res = await fetch(`${API_BASE}/billing/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStatus(await res.json());
    } catch {}
  }, [user]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setSuccess('Payment successful! Your subscription is now active.');
      window.history.replaceState({}, '', '/billing');
      loadStatus();
    }
  }, [loadStatus]);

  const handleSubscribe = async (plan: Plan) => {
    if (!plan.key || plan.price === 0) return;
    setError('');
    setLoadingPlan(plan.key);
    try {
      const token = await user!.firebaseUser.getIdToken();
      const orderRes = await fetch(`${API_BASE}/billing/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planKey: plan.key }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }
      const { orderId, amount, currency, keyId } = await orderRes.json();

      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay'));
          document.body.appendChild(script);
        });
      }

      const rzp = new (window as any).Razorpay({
        key: keyId, amount, currency,
        name: 'JobFlow AI',
        description: `${plan.name} Plan`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            setLoading(true);
            const verifyToken = await user!.firebaseUser.getIdToken();
            const verifyRes = await fetch(`${API_BASE}/billing/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${verifyToken}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planKey: plan.key,
              }),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            setSuccess(`You are now on the ${plan.name} plan!`);
            loadStatus();
          } catch (e: any) {
            setError(e.message || 'Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        prefill: { email: user?.email || '' },
        theme: { color: '#6366f1' },
      });
      rzp.open();
    } catch (e: any) {
      setError(e.message || 'Failed to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  const currentTier = status?.subscription_tier || 'free';

  const getPlanStatus = (plan: Plan) => {
    if (plan.price === 0) return currentTier === 'free' || currentTier === 'candidate_free';
    return currentTier === plan.key;
  };

  return (
    <div className="page-container" style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ede9fe', color: '#6366f1', borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
          <CreditCard size={13} /> Billing & Plans
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          Choose your plan
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>
          Start free, upgrade when you need more. Cancel anytime.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, marginBottom: 20, fontSize: 14, color: '#dc2626' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, marginBottom: 20, fontSize: 14, color: '#059669' }}>
          {success}
        </div>
      )}

      {/* Current plan indicator */}
      {currentTier !== 'free' && currentTier !== 'candidate_free' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px',
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 10, marginBottom: 28,
        }}>
          <Star size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            You are on the <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{currentTier.replace('candidate_', '')} plan</strong>
          </span>
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
        {CANDIDATE_PLANS.map((plan) => {
          const isCurrent = getPlanStatus(plan);
          const isProcessing = loadingPlan === plan.key;

          return (
            <div
              key={plan.key}
              style={{
                position: 'relative',
                background: plan.popular ? 'linear-gradient(145deg, #6366f1, #8b5cf6)' : 'var(--bg-card)',
                border: plan.popular ? 'none' : '1.5px solid var(--border-primary)',
                borderRadius: 16, padding: 28,
                display: 'flex', flexDirection: 'column',
                boxShadow: plan.popular ? '0 12px 40px rgba(99,102,241,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                transform: plan.popular ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 0.2s',
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#fff', color: '#6366f1', fontSize: 11, fontWeight: 700,
                  padding: '4px 14px', borderRadius: 999, whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {plan.price === 0 && <Zap size={16} style={{ color: plan.popular ? 'rgba(255,255,255,0.8)' : 'var(--accent-primary)' }} />}
                {plan.key === 'candidate_plus' && <Shield size={16} style={{ color: plan.popular ? 'rgba(255,255,255,0.8)' : 'var(--accent-primary)' }} />}
                {plan.key === 'candidate_pro' && <Infinity size={16} style={{ color: '#fff' }} />}
                <span style={{ fontSize: 16, fontWeight: 700, color: plan.popular ? '#fff' : 'var(--text-primary)' }}>
                  {plan.name}
                </span>
              </div>

              {/* Tagline */}
              <p style={{ fontSize: 12, color: plan.popular ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)', margin: '0 0 16px' }}>
                {plan.tagline}
              </p>

              {/* Price */}
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: plan.popular ? '#fff' : 'var(--text-primary)', lineHeight: 1 }}>
                  {plan.price === 0 ? '₹0' : `₹${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span style={{ fontSize: 13, color: plan.popular ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginLeft: 4 }}>
                    /month
                  </span>
                )}
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {plan.features.map((f) => (
                  <li key={f.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                    <Check
                      size={14}
                      style={{
                        color: plan.popular ? '#fff' : '#10b981',
                        flexShrink: 0, marginTop: 2,
                      }}
                    />
                    <span style={{
                      color: plan.popular ? (f.highlight ? '#fff' : 'rgba(255,255,255,0.85)') : (f.highlight ? 'var(--text-primary)' : 'var(--text-secondary)'),
                      fontWeight: f.highlight ? 600 : 400,
                    }}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrent || isProcessing || loading || plan.price === 0}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                  cursor: isCurrent || plan.price === 0 ? 'default' : 'pointer',
                  fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                  background: plan.popular
                    ? (isCurrent ? 'rgba(255,255,255,0.2)' : '#fff')
                    : (isCurrent ? 'var(--bg-glass)' : '#6366f1'),
                  color: plan.popular
                    ? (isCurrent ? 'rgba(255,255,255,0.7)' : '#6366f1')
                    : (isCurrent ? 'var(--text-muted)' : '#fff'),
                  transition: 'all 0.15s',
                  opacity: isProcessing ? 0.7 : 1,
                }}
              >
                {isProcessing ? 'Processing...' : isCurrent ? 'Current Plan' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature comparison note */}
      <div style={{
        background: 'var(--bg-glass)', border: '1px solid var(--border-primary)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Shield size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          All plans include access to the job board, profile builder, and application tracking. Paid plans unlock AI-powered tools with higher usage limits.
        </p>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
        Payments processed securely via Razorpay. Cancel anytime from Settings.
      </p>
    </div>
  );
}
