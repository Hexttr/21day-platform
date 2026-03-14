import { randomBytes } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  referralAttributions,
  referralCodes,
  referralRewards,
  users,
} from '../db/schema.js';
import { creditBalance } from './billing.js';
import { getAllowedPlatformSetting } from './platform-settings.js';

function randomCode(length = 8): string {
  return randomBytes(length).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, length).toUpperCase();
}

export async function getTokenRate(): Promise<number> {
  const raw = await getAllowedPlatformSetting('token_exchange_rate_rub_to_tokens');
  const parsed = Number(raw || '10');
  return parsed > 0 ? parsed : 10;
}

export async function tokensToRub(tokens: number): Promise<number> {
  const rate = await getTokenRate();
  return tokens / rate;
}

export async function ensureReferralCode(userId: string) {
  const [existing] = await db.select().from(referralCodes).where(eq(referralCodes.ownerUserId, userId));
  if (existing) {
    return existing;
  }

  for (let i = 0; i < 5; i += 1) {
    const code = randomCode(8);
    try {
      const [created] = await db.insert(referralCodes).values({
        ownerUserId: userId,
        code,
        isActive: true,
      }).returning();
      return created;
    } catch {
      // Retry on unique collision.
    }
  }

  throw new Error('Не удалось создать реферальный код');
}

export async function createReferralAttribution(params: { referralCode: string; refereeUserId: string }) {
  const normalizedCode = params.referralCode.trim().toUpperCase();
  const [codeRow] = await db.select().from(referralCodes).where(eq(referralCodes.code, normalizedCode));
  if (!codeRow || !codeRow.isActive) {
    return null;
  }

  if (codeRow.ownerUserId === params.refereeUserId) {
    return null;
  }

  const [existing] = await db.select().from(referralAttributions).where(eq(referralAttributions.refereeUserId, params.refereeUserId));
  if (existing) {
    return existing;
  }

  const [attribution] = await db.insert(referralAttributions).values({
    referralCodeId: codeRow.id,
    referrerUserId: codeRow.ownerUserId,
    refereeUserId: params.refereeUserId,
    status: 'pending_phone_verification',
  }).returning();

  return attribution;
}

async function hasVerifiedPhone(userId: string): Promise<boolean> {
  const [user] = await db.select({ phoneVerifiedAt: users.phoneVerifiedAt }).from(users).where(eq(users.id, userId));
  return Boolean(user?.phoneVerifiedAt);
}

export async function grantSignupReferralBonusIfEligible(refereeUserId: string) {
  const [attribution] = await db
    .select()
    .from(referralAttributions)
    .where(eq(referralAttributions.refereeUserId, refereeUserId));

  if (!attribution || attribution.signupRewardGrantedAt) {
    return;
  }

  const [referrerVerified, refereeVerified] = await Promise.all([
    hasVerifiedPhone(attribution.referrerUserId),
    hasVerifiedPhone(attribution.refereeUserId),
  ]);

  if (!referrerVerified || !refereeVerified) {
    return;
  }

  const signupTokensRaw = await getAllowedPlatformSetting('referral_signup_bonus_tokens');
  const signupTokens = Math.max(0, parseInt(signupTokensRaw || '500', 10) || 500);
  const amountRub = await tokensToRub(signupTokens);

  const existingRewards = await db
    .select()
    .from(referralRewards)
    .where(and(eq(referralRewards.attributionId, attribution.id), eq(referralRewards.rewardType, 'signup_bonus')));

  if (existingRewards.length > 0) {
    return;
  }

  await creditBalance(attribution.referrerUserId, amountRub, 'bonus', 'Реферальный бонус за подтверждение телефона', attribution.id);
  await creditBalance(attribution.refereeUserId, amountRub, 'bonus', 'Бонус за регистрацию по реферальной ссылке', attribution.id);

  await db.insert(referralRewards).values([
    {
      attributionId: attribution.id,
      userId: attribution.referrerUserId,
      rewardType: 'signup_bonus',
      amountRub: amountRub.toFixed(2),
      amountTokens: signupTokens,
      status: 'granted',
      referenceId: attribution.id,
    },
    {
      attributionId: attribution.id,
      userId: attribution.refereeUserId,
      rewardType: 'signup_bonus',
      amountRub: amountRub.toFixed(2),
      amountTokens: signupTokens,
      status: 'granted',
      referenceId: attribution.id,
    },
  ]);

  await db.update(referralAttributions).set({
    status: 'signup_bonus_granted',
    signupRewardGrantedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(referralAttributions.id, attribution.id));
}

export async function grantCoursePurchaseReferralBonusIfEligible(refereeUserId: string, referenceId: string) {
  const [attribution] = await db
    .select()
    .from(referralAttributions)
    .where(eq(referralAttributions.refereeUserId, refereeUserId));

  if (!attribution || attribution.purchaseRewardGrantedAt) {
    return;
  }

  const [referrerVerified, refereeVerified] = await Promise.all([
    hasVerifiedPhone(attribution.referrerUserId),
    hasVerifiedPhone(attribution.refereeUserId),
  ]);

  if (!referrerVerified || !refereeVerified) {
    return;
  }

  const purchaseTokensRaw = await getAllowedPlatformSetting('referral_course_purchase_bonus_tokens');
  const purchaseTokens = Math.max(0, parseInt(purchaseTokensRaw || '5000', 10) || 5000);
  const amountRub = await tokensToRub(purchaseTokens);

  const [existingReward] = await db
    .select()
    .from(referralRewards)
    .where(and(eq(referralRewards.attributionId, attribution.id), eq(referralRewards.rewardType, 'course_purchase_bonus')));

  if (existingReward) {
    return;
  }

  await creditBalance(attribution.referrerUserId, amountRub, 'bonus', 'Реферальный бонус за покупку курса', referenceId);
  await db.insert(referralRewards).values({
    attributionId: attribution.id,
    userId: attribution.referrerUserId,
    rewardType: 'course_purchase_bonus',
    amountRub: amountRub.toFixed(2),
    amountTokens: purchaseTokens,
    status: 'granted',
    referenceId,
  });

  await db.update(referralAttributions).set({
    status: 'completed',
    purchaseRewardGrantedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(referralAttributions.id, attribution.id));
}

export async function getReferralOverview(userId: string) {
  const code = await ensureReferralCode(userId);
  const [user] = await db
    .select({ phone: users.phone, phoneVerifiedAt: users.phoneVerifiedAt })
    .from(users)
    .where(eq(users.id, userId));

  const attributions = await db
    .select()
    .from(referralAttributions)
    .where(eq(referralAttributions.referrerUserId, userId));

  const rewards = await db
    .select()
    .from(referralRewards)
    .where(eq(referralRewards.userId, userId));

  return {
    code: code.code,
    phone: user?.phone ?? null,
    phoneVerifiedAt: user?.phoneVerifiedAt ?? null,
    totalReferrals: attributions.length,
    totalRewardsTokens: rewards.reduce((sum, reward) => sum + reward.amountTokens, 0),
  };
}
