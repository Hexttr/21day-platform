import { FastifyInstance } from 'fastify';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { payments, balanceTransactions, aiUsageLog, userBalances } from '../db/schema.js';
import { getAuthFromRequest } from '../lib/auth.js';
import { getBalance, ensureBalanceRow, creditBalance, getSetting } from '../lib/billing.js';
import { generatePaymentUrl, verifyResultSignature, verifySuccessSignature } from '../lib/robokassa.js';

export async function billingRoutes(app: FastifyInstance) {
  // Get my balance
  app.get('/balance', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload) return reply.status(401).send({ error: 'Не авторизован' });
    await ensureBalanceRow(payload.userId);
    const balance = await getBalance(payload.userId);
    return reply.send({ balance });
  });

  // Get my transactions
  app.get<{ Querystring: { limit?: string; offset?: string } }>('/balance/transactions', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload) return reply.status(401).send({ error: 'Не авторизован' });
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const offset = parseInt(req.query.offset || '0', 10);
    const rows = await db.select().from(balanceTransactions)
      .where(eq(balanceTransactions.userId, payload.userId))
      .orderBy(desc(balanceTransactions.createdAt))
      .limit(limit).offset(offset);
    return reply.send(rows);
  });

  // Get my usage stats
  app.get('/balance/usage', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload) return reply.status(401).send({ error: 'Не авторизован' });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const rows = await db.select().from(aiUsageLog)
      .where(eq(aiUsageLog.userId, payload.userId))
      .orderBy(desc(aiUsageLog.createdAt))
      .limit(50);

    const [todayStats] = await db
      .select({
        totalRequests: sql<number>`count(*)::int`,
        freeRequests: sql<number>`count(*) filter (where is_free)::int`,
        totalCost: sql<string>`coalesce(sum(final_cost::numeric), 0)::text`,
      })
      .from(aiUsageLog)
      .where(sql`user_id = ${payload.userId} AND created_at >= ${todayStart}`);

    return reply.send({ usage: rows, todayStats });
  });

  // Create payment (redirect to Robokassa)
  app.post<{ Body: { amount: number } }>('/payments/create', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload) return reply.status(401).send({ error: 'Не авторизован' });

    const { amount } = req.body || {};
    const minAmount = parseFloat(await getSetting('min_topup_amount') || '100');
    const maxAmount = parseFloat(await getSetting('max_topup_amount') || '10000');

    if (!amount || amount < minAmount || amount > maxAmount) {
      return reply.status(400).send({ error: `Сумма должна быть от ${minAmount} до ${maxAmount} руб.` });
    }

    const [payment] = await db.insert(payments).values({
      userId: payload.userId,
      amount: amount.toFixed(2),
      status: 'pending',
    }).returning();

    const paymentUrl = generatePaymentUrl(amount, payment.invId, `Пополнение баланса 21day.club`);
    return reply.send({ paymentUrl, invId: payment.invId });
  });

  // ── Robokassa ResultURL (GET — called by Robokassa server-to-server) ──
  // URL: https://21day.club/api/payments/result?OutSum=X&InvId=Y&SignatureValue=Z
  app.get<{ Querystring: { OutSum?: string; InvId?: string; SignatureValue?: string } }>(
    '/payments/result',
    async (req, reply) => {
      const { OutSum, InvId, SignatureValue } = req.query || {};
      if (!OutSum || !InvId || !SignatureValue) {
        return reply.status(400).send('Bad request: missing params');
      }

      if (!verifyResultSignature(OutSum, InvId, SignatureValue)) {
        console.error(`[Robokassa] Invalid ResultURL signature for InvId=${InvId}`);
        return reply.status(403).send('Invalid signature');
      }

      const invId = parseInt(InvId, 10);
      const [payment] = await db.select().from(payments).where(eq(payments.invId, invId));
      if (!payment) return reply.status(404).send('Payment not found');

      if (payment.status === 'completed') {
        return reply.send(`OK${InvId}`);
      }

      const amount = parseFloat(OutSum);
      await db.update(payments).set({
        status: 'completed',
        robokassaSignature: SignatureValue,
        completedAt: new Date(),
      }).where(eq(payments.id, payment.id));

      await creditBalance(payment.userId, amount, 'topup', `Пополнение через Робокассу #${InvId}`, payment.id);
      console.log(`[Robokassa] Payment #${InvId} completed: ${amount} RUB for user ${payment.userId}`);

      return reply.send(`OK${InvId}`);
    }
  );

  // ── Robokassa SuccessURL (GET — user is redirected here after successful payment) ──
  // URL: https://21day.club/api/payments/success?OutSum=X&InvId=Y&SignatureValue=Z
  app.get<{ Querystring: { OutSum?: string; InvId?: string; SignatureValue?: string } }>(
    '/payments/success',
    async (req, reply) => {
      const { OutSum, InvId, SignatureValue } = req.query || {};
      const siteUrl = process.env.SITE_URL || 'https://21day.club';

      if (!OutSum || !InvId || !SignatureValue || !verifySuccessSignature(OutSum, InvId, SignatureValue)) {
        return reply.redirect(`${siteUrl}/topup?status=error`);
      }

      // Credit balance if ResultURL hasn't been processed yet
      const invId = parseInt(InvId, 10);
      const [payment] = await db.select().from(payments).where(eq(payments.invId, invId));
      if (payment && payment.status !== 'completed') {
        const amount = parseFloat(OutSum);
        await db.update(payments).set({ status: 'completed', robokassaSignature: SignatureValue, completedAt: new Date() }).where(eq(payments.id, payment.id));
        await creditBalance(payment.userId, amount, 'topup', `Пополнение через Робокассу #${InvId}`, payment.id);
      }

      return reply.redirect(`${siteUrl}/topup?status=success&amount=${OutSum}`);
    }
  );

  // ── Robokassa FailURL (GET — user is redirected here if payment failed/cancelled) ──
  // URL: https://21day.club/api/payments/fail?OutSum=X&InvId=Y
  app.get<{ Querystring: { OutSum?: string; InvId?: string } }>(
    '/payments/fail',
    async (req, reply) => {
      const { InvId } = req.query || {};
      const siteUrl = process.env.SITE_URL || 'https://21day.club';

      if (InvId) {
        const invId = parseInt(InvId, 10);
        await db.update(payments).set({ status: 'failed' }).where(eq(payments.invId, invId));
      }

      return reply.redirect(`${siteUrl}/topup?status=failed`);
    }
  );

  // Admin: list all payments
  app.get('/admin/payments', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload || payload.role !== 'admin') return reply.status(403).send({ error: 'Forbidden' });
    const rows = await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(200);
    return reply.send(rows);
  });

  // Admin: view usage logs
  app.get('/admin/usage', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload || payload.role !== 'admin') return reply.status(403).send({ error: 'Forbidden' });
    const rows = await db.select().from(aiUsageLog).orderBy(desc(aiUsageLog.createdAt)).limit(200);
    return reply.send(rows);
  });

  // Admin: list all balances
  app.get('/admin/balances', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload || payload.role !== 'admin') return reply.status(403).send({ error: 'Forbidden' });
    const rows = await db.select().from(userBalances);
    return reply.send(rows);
  });

  // Admin: manually credit a user's balance
  app.post<{ Body: { userId: string; amount: number; description?: string } }>('/admin/balance/credit', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload || payload.role !== 'admin') return reply.status(403).send({ error: 'Forbidden' });
    const { userId, amount, description } = req.body || {};
    if (!userId || !amount || amount <= 0) return reply.status(400).send({ error: 'userId and positive amount required' });
    const newBalance = await creditBalance(userId, amount, 'bonus', description || 'Бонус от администратора');
    return reply.send({ balance: newBalance });
  });
}
