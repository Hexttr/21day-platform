CREATE TABLE IF NOT EXISTS "testimonials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "role_or_subtitle" text NOT NULL DEFAULT '',
  "text" text NOT NULL,
  "avatar_variant" text NOT NULL DEFAULT 'male',
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_published" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

INSERT INTO "testimonials" ("name", "role_or_subtitle", "text", "avatar_variant", "sort_order", "is_published")
SELECT seed.name, seed.role_or_subtitle, seed.text, seed.avatar_variant, seed.sort_order, seed.is_published
FROM (
  VALUES
    ('Анна', 'Психолог', 'Курс помог быстро встроить ИИ в ежедневную практику. Я стала тратить меньше времени на рутину и быстрее готовить материалы для клиентов.', 'female', 1, true),
    ('Максим', 'Маркетолог', 'Нравится, что внутри есть и обучение, и рабочие AI-инструменты. Можно сразу изучить подход и тут же применить его на своих задачах.', 'male', 2, true),
    ('Елена', 'Коуч', 'За пару недель перестала бояться нейросетей и начала использовать их в контенте, анализе заметок и подготовке к сессиям.', 'female', 3, true),
    ('Игорь', 'Методолог', 'Понравился формат: короткие уроки, понятный прогресс и живые инструменты для текста, документов и изображений в одном месте.', 'male', 4, true)
) AS seed(name, role_or_subtitle, text, avatar_variant, sort_order, is_published)
WHERE NOT EXISTS (SELECT 1 FROM "testimonials");
