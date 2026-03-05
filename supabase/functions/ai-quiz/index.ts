import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool schema for structured output
const tools = [
  {
    type: "function",
    function: {
      name: "update_learning_state",
      description: "Обновить состояние обучения и ответить студенту. ВСЕГДА используй эту функцию для ответа.",
      parameters: {
        type: "object",
        properties: {
          criteria: {
            type: "array",
            description: "Список критериев обучения (3-4 критерия)",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Уникальный ID критерия (c1, c2, c3...)" },
                topic: { type: "string", description: "Краткое название темы (2-3 слова)" },
                description: { type: "string", description: "Что проверяем (1 предложение)" },
                passed: { type: "boolean", description: "true если студент понял тему" }
              },
              required: ["id", "topic", "description", "passed"]
            }
          },
          current_criterion: { 
            type: "string", 
            description: "ID текущего проверяемого критерия" 
          },
          all_passed: { 
            type: "boolean", 
            description: "true только когда ВСЕ критерии passed: true" 
          },
          message: { 
            type: "string", 
            description: "Сообщение для студента: приветствие/вопрос/оценка (2-4 предложения). Используй markdown." 
          }
        },
        required: ["criteria", "current_criterion", "all_passed", "message"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      lessonTitle, 
      lessonDescription, 
      videoTopics, 
      userAnswer, 
      conversationHistory, 
      customPrompt,
      learningState
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isInitialization = !conversationHistory || conversationHistory.length === 0;

    let systemPrompt: string;

    if (isInitialization) {
      systemPrompt = `Ты — AI-тьютор. Курс: AI для помогающих специалистов.

## Урок: ${lessonTitle}
${lessonDescription}
Темы из видео: ${videoTopics.join(", ")}
${customPrompt ? `\nДополнительные инструкции: ${customPrompt}` : ""}

## ТВОЯ ЗАДАЧА:
1. Создай 3-4 критерия для проверки понимания урока (по ключевым темам из видео)
2. Поприветствуй студента и задай первый вопрос по критерию c1

## ПРАВИЛА:
- Критерии должны быть конкретными и проверяемыми
- Вопросы должны быть открытыми (не да/нет)
- Все критерии начинаются с passed: false
- current_criterion: "c1"
- all_passed: false`;
    } else {
      // Find current criterion details
      const currentCrit = learningState?.criteria?.find((c: any) => c.id === learningState.current_criterion);
      const currentTopic = currentCrit?.topic || "текущая тема";
      const currentDesc = currentCrit?.description || "";
      const passedCriteria = learningState?.criteria?.filter((c: any) => c.passed) || [];
      const remainingCriteria = learningState?.criteria?.filter((c: any) => !c.passed) || [];
      
      systemPrompt = `Ты — AI-тьютор. Оцени последний ответ студента.

## Урок: ${lessonTitle}
${customPrompt ? `Инструкции: ${customPrompt}` : ""}

## ТЕКУЩИЙ КРИТЕРИЙ: ${learningState?.current_criterion}
Тема: "${currentTopic}"
Проверяем: ${currentDesc}

## ПРОГРЕСС: ${passedCriteria.length}/${learningState?.criteria?.length || 0} критериев пройдено
Пройдены: ${passedCriteria.map((c: any) => c.id).join(", ") || "нет"}
Осталось: ${remainingCriteria.map((c: any) => c.id).join(", ")}

## ПРАВИЛА ОЦЕНКИ:
1. Если ответ показывает понимание темы → passed: true для текущего критерия
2. После прохождения критерия → current_criterion = следующий непройденный
3. Если НЕ понял → задай уточняющий вопрос, passed остаётся false
4. Когда ВСЕ критерии passed: true → all_passed: true

## ТЕКУЩЕЕ СОСТОЯНИЕ (изменяй только нужные поля):
${JSON.stringify(learningState, null, 2)}`;
    }

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt }
    ];

    // Add conversation history
    console.log(`[ai-quiz] Server history received: ${conversationHistory?.length || 0} messages`);
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // For initialization, add a start message
    if (isInitialization) {
      messages.push({ role: "user", content: "Начни обучающую сессию." });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    // Use gemini-2.5-flash with tool calling
    const model = "google/gemini-2.5-flash";
    console.log(`[ai-quiz] Using model: ${model} with tool calling, isInit: ${isInitialization}`);
    
    const startTime = Date.now();

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          tools,
          tool_choice: { type: "function", function: { name: "update_learning_state" } },
          temperature: 0.3,
          max_tokens: 600,
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("[ai-quiz] Request timed out after 25 seconds");
        return new Response(
          JSON.stringify({ error: "Превышено время ожидания ответа AI. Попробуйте ещё раз." }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ai-quiz] Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Слишком много запросов. Попробуйте через минуту." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Требуется пополнение баланса AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const elapsed = Date.now() - startTime;
    console.log(`[ai-quiz] Response received in ${elapsed}ms`);

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "update_learning_state") {
      console.error("[ai-quiz] No tool call in response:", JSON.stringify(data.choices?.[0]?.message));
      
      // Fallback: try to use previous state if available
      if (learningState) {
        return new Response(
          JSON.stringify({ 
            response: "Произошла ошибка обработки. Попробуйте повторить ваш ответ.",
            learningState,
            allPassed: false
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI не вернул структурированный ответ");
    }

    // Parse tool call arguments
    let args;
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("[ai-quiz] Failed to parse tool arguments:", toolCall.function.arguments);
      throw new Error("Ошибка парсинга ответа AI");
    }

    console.log(`[ai-quiz] Tool call parsed successfully. Criteria: ${args.criteria?.length}, current: ${args.current_criterion}, allPassed: ${args.all_passed}`);

    // Validate response structure
    if (!args.criteria || !Array.isArray(args.criteria) || !args.message) {
      console.error("[ai-quiz] Invalid tool call structure:", args);
      throw new Error("Некорректная структура ответа AI");
    }

    const newLearningState = {
      criteria: args.criteria,
      current_criterion: args.current_criterion,
      all_passed: args.all_passed
    };

    const passedCount = args.criteria.filter((c: any) => c.passed).length;
    console.log(`[ai-quiz] Final state: ${passedCount}/${args.criteria.length} passed, allPassed: ${args.all_passed}`);

    return new Response(
      JSON.stringify({ 
        response: args.message,
        learningState: newLearningState,
        allPassed: args.all_passed === true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ai-quiz] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
