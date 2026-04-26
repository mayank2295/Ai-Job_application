import { Router, Request, Response } from 'express';
import { get, run } from '../database/db';
import { createOrder, verifyPaymentSignature, PLANS } from '../services/razorpayService';
import { requireAuth, optionalAuth } from '../middleware/firebaseAuth';

const router = Router();

// GET /api/billing/plans — public, no auth needed
router.get('/plans', (_req: Request, res: Response) => {
  res.json({ plans: PLANS });
});

// GET /api/billing/status — optionalAuth: returns real data if logged in, free tier if not
router.get('/status', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = (req as any).user?.uid;
    if (!uid) {
      res.json({ subscription_tier: 'free', monthly_ats_scans: 0 });
      return;
    }
    const user = await get<any>(
      'SELECT subscription_tier, monthly_ats_scans, monthly_scans_reset_at, subscription_started_at, subscription_expires_at FROM users WHERE firebase_uid = $1',
      [uid]
    );
    res.json(user || { subscription_tier: 'free' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/create-order — requireAuth: must be logged in
router.post('/create-order', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { planKey } = req.body;
    const uid = (req as any).user?.uid;

    if (!planKey) {
      res.status(400).json({ error: 'planKey is required' });
      return;
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[billing] Razorpay keys not configured');
      res.status(503).json({ error: 'Payment service is not configured. Please contact support.' });
      return;
    }

    const user = await get<any>('SELECT id FROM users WHERE firebase_uid = $1', [uid]);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const order = await createOrder(planKey, user.id);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    // Log full error details for debugging
    console.error('[billing] create-order error:', err?.error || err?.message || err);
    const message = err?.error?.description || err?.message || 'Failed to create order';
    res.status(500).json({ error: message });
  }
});

// POST /api/billing/verify — requireAuth: must be logged in
router.post('/verify', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planKey } = req.body;
    const uid = (req as any).user?.uid;

    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      res.status(400).json({ error: 'Payment verification failed. Please contact support.' });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day subscription

    // Atomic update: tier + payment ID + subscription dates
    await run(
      `UPDATE users
       SET subscription_tier = $1,
           razorpay_payment_id = $2,
           subscription_started_at = $3,
           subscription_expires_at = $4,
           updated_at = NOW()
       WHERE firebase_uid = $5`,
      [planKey, razorpay_payment_id, now.toISOString(), expiresAt.toISOString(), uid]
    );

    // Create in-app notification for the user
    const user = await get<any>('SELECT id FROM users WHERE firebase_uid = $1', [uid]);
    if (user?.id) {
      const planName = PLANS[planKey as keyof typeof PLANS]?.name || planKey;
      const expiryStr = expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      run(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, 'success', 'Subscription Activated', $2)`,
        [user.id, `Your ${planName} subscription is active until ${expiryStr}. Enjoy all premium features!`]
      ).catch(() => {});
    }

    res.json({ success: true, message: 'Subscription activated successfully!', expiresAt: expiresAt.toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
