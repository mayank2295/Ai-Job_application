import { Router, Request, Response } from 'express';
import { get, run } from '../database/db';
import { createOrder, verifyPaymentSignature, PLANS } from '../services/razorpayService';

const router = Router();

// GET /api/billing/plans
router.get('/plans', (_req: Request, res: Response) => {
  res.json({ plans: PLANS });
});

// GET /api/billing/status
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = (req as any).user?.uid;
    if (!uid) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const user = await get<any>(
      'SELECT subscription_tier, monthly_ats_scans, monthly_scans_reset_at FROM users WHERE firebase_uid = $1',
      [uid]
    );
    res.json(user || { subscription_tier: 'free' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/create-order — create Razorpay order
router.post('/create-order', async (req: Request, res: Response): Promise<void> => {
  try {
    const { planKey } = req.body;
    const uid = (req as any).user?.uid;
    if (!uid) { res.status(401).json({ error: 'Unauthorized' }); return; }

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
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/verify — verify payment and activate subscription
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planKey } = req.body;
    const uid = (req as any).user?.uid;
    if (!uid) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      res.status(400).json({ error: 'Payment verification failed. Please contact support.' });
      return;
    }

    // Activate subscription
    await run(
      `UPDATE users SET subscription_tier = $1, razorpay_payment_id = $2, updated_at = NOW()
       WHERE firebase_uid = $3`,
      [planKey, razorpay_payment_id, uid]
    );

    res.json({ success: true, message: 'Subscription activated successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
