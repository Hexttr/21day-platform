ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified_at" timestamp with time zone;
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_idx" ON "users" ("phone");

CREATE TABLE IF NOT EXISTS "courses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "duration_days" integer NOT NULL,
  "granted_lessons" integer NOT NULL,
  "price_rub" numeric(12, 2) NOT NULL DEFAULT '0',
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "course_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "source_course_id" uuid REFERENCES "courses"("id") ON DELETE SET NULL,
  "order_type" text NOT NULL DEFAULT 'purchase',
  "status" text NOT NULL DEFAULT 'pending',
  "expected_amount_rub" numeric(12, 2) NOT NULL,
  "paid_amount_rub" numeric(12, 2),
  "paid_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "course_access" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "granted_lessons" integer NOT NULL,
  "source" text NOT NULL DEFAULT 'purchase',
  "status" text NOT NULL DEFAULT 'active',
  "order_id" uuid REFERENCES "course_orders"("id") ON DELETE SET NULL,
  "granted_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "course_access_user_id_idx" ON "course_access" ("user_id");

CREATE TABLE IF NOT EXISTS "referral_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code" text NOT NULL UNIQUE,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "referral_codes_owner_user_idx" ON "referral_codes" ("owner_user_id");

CREATE TABLE IF NOT EXISTS "referral_attributions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "referral_code_id" uuid NOT NULL REFERENCES "referral_codes"("id") ON DELETE CASCADE,
  "referrer_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "referee_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'pending_phone_verification',
  "signup_reward_granted_at" timestamp with time zone,
  "purchase_reward_granted_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "referral_attributions_referee_user_idx" ON "referral_attributions" ("referee_user_id");

CREATE TABLE IF NOT EXISTS "referral_rewards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "attribution_id" uuid NOT NULL REFERENCES "referral_attributions"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "reward_type" text NOT NULL,
  "amount_rub" numeric(12, 2) NOT NULL,
  "amount_tokens" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'granted',
  "reference_id" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "referral_rewards_unique_idx" ON "referral_rewards" ("attribution_id", "user_id", "reward_type");

CREATE TABLE IF NOT EXISTS "phone_verifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "phone" text NOT NULL,
  "purpose" text NOT NULL DEFAULT 'referral_unlock',
  "code_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "sent_at" timestamp with time zone NOT NULL DEFAULT now(),
  "last_attempt_at" timestamp with time zone,
  "attempts" integer NOT NULL DEFAULT 0,
  "request_count" integer NOT NULL DEFAULT 1,
  "request_window_started_at" timestamp with time zone NOT NULL DEFAULT now(),
  "verified_at" timestamp with time zone,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "phone_verifications_user_purpose_idx" ON "phone_verifications" ("user_id", "purpose");

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "paid_amount" numeric(12, 2);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payment_type" text NOT NULL DEFAULT 'topup';
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "course_order_id" uuid REFERENCES "course_orders"("id") ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "payments_inv_id_idx" ON "payments" ("inv_id");

INSERT INTO "courses" ("code", "title", "description", "duration_days", "granted_lessons", "price_rub", "sort_order", "is_active")
VALUES
  ('course_14', 'Базовый курс — 14 дней', 'Первые две недели курса 21DAY', 14, 14, 10500.00, 1, true),
  ('course_21', 'Продвинутый курс — 21 день', 'Полный курс 21DAY на 21 день', 21, 21, 14500.00, 2, true)
ON CONFLICT ("code") DO UPDATE
SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "duration_days" = EXCLUDED."duration_days",
  "granted_lessons" = EXCLUDED."granted_lessons",
  "price_rub" = EXCLUDED."price_rub",
  "sort_order" = EXCLUDED."sort_order",
  "is_active" = EXCLUDED."is_active",
  "updated_at" = now();

INSERT INTO "platform_settings" ("key", "value", "description")
VALUES
  ('referral_signup_bonus_tokens', '500', 'Бонус обоим пользователям после подтверждения телефона приглашённого'),
  ('referral_course_purchase_bonus_tokens', '5000', 'Бонус пригласившему после покупки курса приглашённым'),
  ('token_exchange_rate_rub_to_tokens', '10', 'Сколько токенов отображать за 1 рубль'),
  ('course_14_price_rub', '10500', 'Цена базового курса на 14 дней'),
  ('course_21_price_rub', '14500', 'Цена полного курса на 21 день'),
  ('course_21_upgrade_price_rub', '4000', 'Цена апгрейда с 14 до 21 дня'),
  ('phone_verification_required_for_referrals', '1', 'Требовать подтверждение телефона для реферальной программы')
ON CONFLICT ("key") DO NOTHING;
