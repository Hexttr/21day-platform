# 21day-platform

Платформа курсов — 21-дневный курс по AI для помогающих специалистов (психологи, коучи и др.).

## Стек

- **Frontend:** Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Auth, PostgreSQL, Edge Functions, Storage)
- **AI:** Google Gemini (чат, квиз-тьютор, генерация изображений)

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Копирование переменных окружения
cp .env.example .env
# Заполните .env значениями из Supabase Dashboard

# Запуск dev-сервера
npm run dev
```

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev-сервера (порт 8080) |
| `npm run build` | Сборка для production |
| `npm run preview` | Превью production-сборки |
| `npm run lint` | Проверка ESLint |

## Структура проекта

```
src/
├── api/           # Supabase клиент и сервисы
├── components/    # UI-компоненты
├── contexts/     # React contexts (Auth, Progress, Impersonation)
├── hooks/        # Custom hooks
├── pages/        # Страницы и роуты
├── data/         # Статические данные курса
└── lib/          # Утилиты
```

## Репозиторий

https://github.com/Hexttr/21day-platform
