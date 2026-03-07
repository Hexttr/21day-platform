ALTER TABLE "ai_models"
  ADD COLUMN IF NOT EXISTS "supports_document_input" boolean NOT NULL DEFAULT false;

UPDATE "ai_models"
SET "supports_document_input" = CASE
  WHEN "model_type" = 'text' THEN true
  ELSE "supports_document_input"
END;

CREATE TABLE IF NOT EXISTS "ai_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "kind" text NOT NULL DEFAULT 'document',
  "original_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "file_size" integer NOT NULL,
  "storage_path" text NOT NULL,
  "status" text NOT NULL DEFAULT 'ready',
  "extracted_text" text,
  "extracted_preview" text,
  "page_count" integer,
  "sheet_count" integer,
  "slide_count" integer,
  "error_message" text,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
