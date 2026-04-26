import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Check, Zap, Star, Building2 } from 'lucide-react';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')
).replace(/\/$/, '');

type Plan = {
  key: string;
  name: string;
  price: number;
  currency: string;
  target: 'candidate' | 'recruiter';
  features: string[];
  popular?: boolean;
};

const CANDIDATE_PLANS: Plan[] = [
  {
    key: 'candidate_free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    target: 'candidate',
    features: ['3 ATS scans/month', 'Browse jobs', 'Basic AI chat', '1 mock interview/month'],
  },
  {
    key: 'candidate_pro',
    name: 'Candidate Pro',
    price: 999,
    currency: 'INR',
    target: 'candidate',
    features: ['Unlimited ATS scans', 'Unlimited mock interviews', 'Full AI career bot', 'Reputation score', 'Priority support'],
    popular: true,
  },
];

const RECRUITER_PLANS: Plan[] = [
  {
    key: 'recruiter_starter',
    name: 'Recruiter Starter',
    price: 7999,
    currency: 'INR',
    target: 'recruiter',
    features: ['5 active job postings', 'AI resume scoring', 'Basic analytics', '1 recruiter seat'],
  },
  {
    key: 'recruiter_scale',
    name: 'Recruiter Scale',
    price: 24999,
    currency: 'INR',
    target: 'recruiter',
    features: ['Unlimited job postings', 'AI video interviews', 'Advanced analytics', '5 recruiter seats', 'Priority support'],
    popular: true,
  },
];

export default function BillingPage() {
  const { user, isAdmin } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const plans = isAdmin ? RECRUITER_PLANS : CANDIDATE_PLANS;

  const loadStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/billing/status`);
      if (res.ok) setStatus(await res.json());
    } catch {}
  }, [user]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Check for success redirect from Razorpay
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
      const orderRes = await fetch(`${API_BASE}/billing/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey: plan.key }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }
      const { orderId, amount, currency, keyId } = await orderRes.json();

      // Load Razorpay script dynamically
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
        key: keyId,
        amount,
        currency,
        name: 'JobFlow AI',
        description: plan.name,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            setLoading(true);
            const verifyRes = await fetch(`${API_BASE}/billing/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planKey: plan.key,
              }),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            setSuccess(`Successfully subscribed to ${plan.name}!`);
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

  return (
    <div className="page-container">
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <CreditCard size={24} style={{ color: 'var(--accent-primary)' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Billing &amp; Plans
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          {isAdmin ? 'Choose a recruiter plan to unlock more job postings and features.' : 'Upgrade to unlock unlimited AI tools and career features.'}
        </p>
      </div>

      {error && (
        <div className="card" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 20, padding: '12px 16px' }}>
          <p style={{ color: 'var(--accent-rose)', margin: 0, fontSize: 14 }}>{error}</p>
        </div>
      )}
      {success && (
        <div className="card" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', marginBottom: 20, padding: '12px 16px' }}>
          <p style={{ color: 'var(--accent-emerald)', margin: 0, fontSize: 14 }}>{success}</p>
        </div>
      )}

      {/* Current plan banner */}
      {currentTier !== 'free' && (
        <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
          <Star size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Current plan: </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {currentTier.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 32 }}>
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.key || (plan.price === 0 && currentTier === 'free');
          const isLoading = loadingPlan === plan.key;
          return (
            <div
              key={plan.key}
              className="card"
              style={{
                position: 'relative',
                border: plan.popular ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                padding: 24,
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--accent-primary)', color: '#fff', fontSize: 11,
                  padding: '3px 14px', borderRadius: 999, fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                  Most Popular
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {plan.target === 'recruiter'
                  ? <Building2 size={18} style={{ color: 'var(--accent-primary)' }} />
                  : <Zap size={18} style={{ color: 'var(--accent-primary)' }} />
                }
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{plan.name}</h3>
              </div>

              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
                </span>
                {plan.price > 0 && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>/month</span>
                )}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Check size={14} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`btn ${isCurrent ? 'btn-secondary' : plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%' }}
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrent || isLoading || loading || plan.price === 0}
              >
                {isLoading ? 'Processing...' : isCurrent ? 'Current Plan' : plan.price === 0 ? 'Free Plan' : 'Subscribe'}
              </button>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Payments are processed securely via Razorpay. Cancel anytime from your account settings.
      </p>
    </div>
  );
}
