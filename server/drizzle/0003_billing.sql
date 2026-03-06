-- AI Providers
CREATE TABLE IF NOT EXISTS "ai_providers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL UNIQUE,
  "display_name" text NOT NULL,
  "api_key_env" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- AI Models
CREATE TABLE IF NOT EXISTS "ai_models" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid NOT NULL REFERENCES "ai_providers"("id") ON DELETE CASCADE,
  "model_key" text NOT NULL,
  "display_name" text NOT NULL,
  "model_type" text NOT NULL,
  "input_price_per_1k" numeric(10,6) DEFAULT '0',
  "output_price_per_1k" numeric(10,6) DEFAULT '0',
  "fixed_price" numeric(10,4) DEFAULT '0',
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- User Balances
CREATE TABLE IF NOT EXISTS "user_balances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "balance" numeric(12,2) NOT NULL DEFAULT '0',
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Balance Transactions
CREATE TABLE IF NOT EXISTS "balance_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "amount" numeric(12,2) NOT NULL,
  "type" text NOT NULL,
  "description" text,
  "reference_id" text,
  "balance_after" numeric(12,2) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- AI Usage Log
CREATE TABLE IF NOT EXISTS "ai_usage_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "model_id" uuid REFERENCES "ai_models"("id"),
  "request_type" text NOT NULL,
  "input_tokens" integer DEFAULT 0,
  "output_tokens" integer DEFAULT 0,
  "base_cost" numeric(10,6) DEFAULT '0',
  "final_cost" numeric(10,6) DEFAULT '0',
  "is_free" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "inv_id" serial NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "robokassa_signature" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at" timestamp with time zone
);

-- Platform Settings
CREATE TABLE IF NOT EXISTS "platform_settings" (
  "key" text PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "description" text,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Default platform settings
INSERT INTO "platform_settings" ("key", "value", "description") VALUES
  ('markup_percent', '50', 'Наценка в % от базовой стоимости AI-запросов'),
  ('daily_free_requests', '10', 'Количество бесплатных AI-запросов в день'),
  ('min_topup_amount', '100', 'Минимальная сумма пополнения (RUB)'),
  ('max_topup_amount', '10000', 'Максимальная сумма пополнения (RUB)')
ON CONFLICT ("key") DO NOTHING;
