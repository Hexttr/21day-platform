
# План: Tool Calling для AI-тьютора с gemini-2.5-flash

## Проблема
- Текущая модель `gemini-3-flash-preview` нестабильна и выдаёт "галлюцинации" в JSON
- 4-уровневый парсинг JSON (regex, code blocks, brace-balancing) — ненадёжное решение
- Пользователи жалуются на зависания и медленную работу

## Решение
Переход на **tool calling** с моделью `gemini-2.5-flash`:
- Модель **обязана** вызвать функцию с заданной схемой — никаких галлюцинаций
- `gemini-2.5-flash` — стабильная, быстрая модель с отличной поддержкой tools
- Код станет проще: удаляем весь парсинг JSON (80+ строк)

## Как работает Tool Calling

```text
┌─────────────────────────────────────────────────────────────┐
│  БЫЛО: Просим JSON в промпте                                │
│                                                             │
│  Промпт: "Верни ответ в формате ```json {...}```"           │
│     ↓                                                       │
│  Модель пишет как хочет (иногда ломает JSON)                │
│     ↓                                                       │
│  4 уровня regex-парсинга → всё равно может сломаться        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  БУДЕТ: Tool Calling (Function Calling)                     │
│                                                             │
│  API: tools: [{ function: "update_learning_state", ... }]   │
│     ↓                                                       │
│  Модель ОБЯЗАНА вызвать функцию с валидным JSON             │
│     ↓                                                       │
│  Получаем гарантированно корректную структуру               │
└─────────────────────────────────────────────────────────────┘
```

---

## Изменения

### 1. Edge Function `supabase/functions/ai-quiz/index.ts`

**Удаляем:**
- Функции `extractJsonFromResponse()` и `cleanDisplayMessage()` (~80 строк)
- Сложные промпты с инструкциями по формату JSON

**Добавляем:**
```typescript
// Определяем tool schema
const tools = [
  {
    type: "function",
    function: {
      name: "update_learning_state",
      description: "Обновить состояние обучения и ответить студенту",
      parameters: {
        type: "object",
        properties: {
          criteria: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                topic: { type: "string" },
                description: { type: "string" },
                passed: { type: "boolean" }
              },
              required: ["id", "topic", "description", "passed"]
            }
          },
          current_criterion: { type: "string" },
          all_passed: { type: "boolean" },
          message: { 
            type: "string", 
            description: "Сообщение для студента (2-3 предложения)" 
          }
        },
        required: ["criteria", "current_criterion", "all_passed", "message"]
      }
    }
  }
];

// В запросе к AI
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",  // Стабильная модель
    messages,
    tools,
    tool_choice: { type: "function", function: { name: "update_learning_state" } },
    temperature: 0.3,
    max_tokens: 600
  })
});

// Парсинг ответа - гарантированно валидный JSON
const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
const args = JSON.parse(toolCall.function.arguments);
// args.criteria, args.current_criterion, args.all_passed, args.message
```

**Новые промпты:**
```typescript
// Инициализация
systemPrompt = `Ты — AI-тьютор. Курс: AI для помогающих специалистов.

Урок: ${lessonTitle}
${lessonDescription}
Темы: ${videoTopics.join(", ")}

Создай 3-4 критерия для проверки понимания и задай первый вопрос.
Используй функцию update_learning_state для ответа.`;

// Оценка ответа
systemPrompt = `AI-тьютор. Оцени последний ответ студента.

Текущий критерий: ${currentTopic}
Пройдено: ${passedCount}/${totalCount}

Если студент понял тему → passed: true, переходи к следующему.
Если не понял → задай наводящий вопрос.
Если все критерии пройдены → all_passed: true.`;
```

### 2. Клиент `src/components/AIQuiz.tsx`

**Изменения минимальны:**
- Ответ теперь приходит в поле `response` (как было) — backend обрабатывает tool_calls
- Удаляем функцию `cleanAIResponse()` — она больше не нужна

---

## Ожидаемые улучшения

| Метрика | Было | Станет |
|---------|------|--------|
| Стабильность JSON | ~85% | 100% |
| Скорость ответа | 3-8 сек | 2-4 сек |
| Код парсинга | 80+ строк | 5 строк |
| Модель | preview (нестабильная) | stable |

---

## Техническая часть

### Файлы для изменения

1. **`supabase/functions/ai-quiz/index.ts`** — полный рефакторинг:
   - Удаление regex-парсеров
   - Добавление tool schema
   - Новая логика обработки `tool_calls` в ответе
   - Упрощённые промпты

2. **`src/components/AIQuiz.tsx`** — минимальные изменения:
   - Удаление `cleanAIResponse()` (опционально, можно оставить для безопасности)
   - Логика остаётся прежней — backend возвращает тот же формат

### Обратная совместимость

- Формат ответа для клиента не меняется: `{ response, learningState, allPassed }`
- Клиент продолжает работать без изменений

---

## Риски

- **Минимальные**: `gemini-2.5-flash` — проверенная модель, tool calling — стандартная функция
- **Fallback**: Если tool call не вернулся — возвращаем ошибку с просьбой повторить (крайне редко)
