import Razorpay from 'razorpay';
import crypto from 'crypto';

// Lazy initialization — only create the client when keys are present
// This prevents a crash on startup when RAZORPAY_KEY_ID is not set
function getRazorpay(): Razorpay {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set to use billing features.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export const PLANS = {
  candidate_pro: {
    name: 'Candidate Pro',
    amount: 99900,       // INR 999/month in paise
    currency: 'INR',
    period: 'monthly',
    features: ['Unlimited ATS scans', 'Unlimited mock interviews', 'Full career bot', 'Reputation score'],
  },
  recruiter_starter: {
    name: 'Recruiter Starter',
    amount: 799900,      // INR 7999/month
    currency: 'INR',
    period: 'monthly',
    features: ['5 active job postings', 'AI resume scoring', 'Basic analytics', '1 seat'],
  },
  recruiter_scale: {
    name: 'Recruiter Scale',
    amount: 2499900,     // INR 24999/month
    currency: 'INR',
    period: 'monthly',
    features: ['Unlimited job postings', 'Advanced analytics', '5 seats', 'Priority support'],
  },
};

export async function createOrder(planKey: string, userId: string) {
  const plan = PLANS[planKey as keyof typeof PLANS];
  if (!plan) throw new Error('Invalid plan');

  const rzp = getRazorpay();
  const order = await rzp.orders.create({
    amount: plan.amount,
    currency: plan.currency,
    receipt: `order_${userId}_${Date.now()}`,
    notes: { userId, planKey },
  });

  return order;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_SECRET is not set');
  }
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}
