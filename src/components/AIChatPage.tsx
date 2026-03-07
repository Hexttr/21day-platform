import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Send, Loader2, Sparkles, Trash2, Bot, MessageSquare, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useChatContext } from '@/contexts/ChatContext';
import { AIModel, ModelSelector } from '@/components/ModelSelector';
import { useBalance } from '@/contexts/BalanceContext';
import { BalanceWidget } from '@/components/BalanceWidget';
import { ChatAttachment, ChatAttachmentPanel } from '@/components/ChatAttachmentPanel';
import { getAIToolBadge, getAIToolByProvider, getAIToolByTitle } from '@/lib/ai-tools';

type Message = {
  role: 'user';
  content: string;
  sourceImages?: string[];
  sourceAttachments?: ChatAttachment[];
} | {
  role: 'assistant';
  content: string;
  contextImages?: string[];
  contextAttachments?: ChatAttachment[];
};

type StoredMessage = {
  role: 'user';
  content: string;
  sourceAttachments?: ChatAttachment[];
} | {
  role: 'assistant';
  content: string;
  contextAttachments?: ChatAttachment[];
};

interface AIChatPageProps {
  modelName: string;
  modelIcon: string;
  modelColor: string;
  providerName?: string;
  starterPrompts?: string[];
}

const getChatStorageKey = (modelName: string) => `ai-chat-${modelName.toLowerCase()}`;

const getModelPath = (modelName: string) => modelName.toLowerCase();

const getModelIconPath = (modelName: string) => {
  const name = modelName.toLowerCase();
  if (name.includes('chatgpt')) return '/icons/chatgpt.png';
  if (name.includes('claude')) return '/icons/claude.png';
  if (name.includes('gemini')) return '/icons/gemini.png';
  return null;
};

export function AIChatPage({ modelName, modelIcon, modelColor, providerName, starterPrompts }: AIChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [sourceAttachments, setSourceAttachments] = useState<ChatAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContext = useChatContext();
  const { refreshBalance } = useBalance();
  const canAttachImages = Boolean(selectedModel?.supportsImageInput);
  const canAttachDocuments = Boolean(selectedModel?.supportsDocumentInput);
  const toolConfig = getAIToolByProvider(providerName) || getAIToolByTitle(modelName);
  const initialPrompts = starterPrompts || [
    'Как использовать ИИ в моей работе?',
    'Объясни мне промпт-инжиниринг',
    'Помоги написать промпт',
  ];

  useEffect(() => {
    if (!canAttachImages && sourceImages.length > 0) {
      setSourceImages([]);
    }
  }, [canAttachImages, sourceImages.length]);

  useEffect(() => {
    if (!canAttachDocuments && sourceAttachments.length > 0) {
      setSourceAttachments([]);
    }
  }, [canAttachDocuments, sourceAttachments.length]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const storageKey = getChatStorageKey(modelName);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as StoredMessage[];
        if (Array.isArray(parsed)) setMessages(parsed);
      } catch (e) {
        console.warn('Failed to parse saved chat:', e);
      }
    }
  }, [modelName]);

  useEffect(() => {
    if (messages.length > 0) {
      const storageKey = getChatStorageKey(modelName);
      localStorage.setItem(storageKey, JSON.stringify(messages.map((message) => {
        if (message.role === 'user') {
          return {
            role: message.role,
            content: message.content,
            sourceAttachments: message.sourceAttachments,
          };
        }
        return {
          role: message.role,
          content: message.content,
          contextAttachments: message.contextAttachments,
        };
      })));
    }
  }, [messages, modelName]);

  const clearChat = useCallback(() => {
    const storageKey = getChatStorageKey(modelName);
    localStorage.removeItem(storageKey);
    setMessages([]);
    setSourceImages([]);
    setSourceAttachments([]);
    toast.success('Чат очищен');
  }, [modelName]);

  useEffect(() => {
    const modelPath = getModelPath(modelName);
    chatContext?.registerClearHandler(modelPath, clearChat);
    return () => chatContext?.unregisterClearHandler(modelPath);
  }, [chatContext, modelName, clearChat]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      ...(sourceImages.length > 0 && { sourceImages: [...sourceImages] }),
      ...(sourceAttachments.length > 0 && { sourceAttachments: [...sourceAttachments] }),
    };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setSourceImages([]);
    setSourceAttachments([]);
    setIsLoading(true);

    let assistantContent = '';

    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api');
      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          modelId: selectedModelId,
          messages: newMessages.map((message) => ({
            role: message.role,
            content: message.content,
            images: message.role === 'user' ? message.sourceImages : undefined,
            attachmentIds: message.role === 'user' ? message.sourceAttachments?.map((attachment) => attachment.id) : undefined,
          })),
        }),
      });

      if (response.status === 429) { toast.error('Превышен лимит запросов. Попробуйте позже.'); setIsLoading(false); return; }
      if (response.status === 402) { toast.error('Необходимо пополнить баланс.'); setIsLoading(false); return; }
      if (response.status === 401) { toast.error('Войдите в аккаунт для использования чата'); setIsLoading(false); return; }
      if (response.status === 404) { toast.error('Сервер не найден. Убедитесь, что backend запущен.'); setIsLoading(false); return; }

      if (!response.ok || !response.body) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = typeof errData?.error === 'string' ? errData.error : errData?.error?.message || `Ошибка ${response.status}`;
        toast.error(errMsg);
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      setMessages([...newMessages, {
        role: 'assistant',
        content: '',
        contextImages: userMessage.sourceImages,
        contextAttachments: userMessage.sourceAttachments,
      }]);

      let streamDone = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage?.role === 'assistant') {
                  return [...prev.slice(0, -1), { ...lastMessage, content: assistantContent }];
                }
                return prev;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
        if (streamDone) break;
      }
      setTimeout(() => refreshBalance(), 500);
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Ошибка при отправке сообщения');
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'hsl(248deg 100% 94.56%)' }}>
      {/* Header (mobile only) */}
      <header className="md:hidden flex-shrink-0 bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-soft overflow-hidden bg-card border border-border/50">
              {getModelIconPath(modelName) ? (
                <img src={getModelIconPath(modelName)!} alt="" className="w-7 h-7 object-contain" />
              ) : (
                <span className="text-xl">{modelIcon}</span>
              )}
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold text-foreground leading-none">
                {modelName}
              </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">
                    Чат с искусственным интеллектом
                  </p>
                  {canAttachDocuments && (
                    <span className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                      docs
                    </span>
                  )}
                  {canAttachImages && (
                    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      image
                    </span>
                  )}
                  {toolConfig && (
                    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getAIToolBadge(toolConfig.access)}`}>
                      {toolConfig.access === 'free' ? 'free' : 'paid'}
                    </span>
                  )}
                </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BalanceWidget compact />
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Очистить</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto min-[1920px]:max-w-[80%] px-4 py-6 space-y-6 pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[55vh] text-center animate-fade-in-up">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-large overflow-hidden bg-card border border-border/50">
                {getModelIconPath(modelName) ? (
                  <img src={getModelIconPath(modelName)!} alt="" className="w-14 h-14 object-contain" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${modelColor} flex items-center justify-center`}>
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
                Начните диалог с {modelName}
              </h2>
              <div className="flex items-center gap-2 mb-3">
                {toolConfig && (
                  <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${getAIToolBadge(toolConfig.access)}`}>
                    {toolConfig.access === 'free' ? 'Бесплатно' : 'Платно'}
                  </span>
                )}
                {canAttachDocuments && (
                  <span className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                    Документы
                  </span>
                )}
                {canAttachImages && (
                  <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Multimodal
                  </span>
                )}
              </div>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                {canAttachImages && canAttachDocuments
                  ? 'Задайте вопрос, приложите скрин, PDF, таблицу или другой документ и попросите модель проанализировать материалы.'
                  : canAttachDocuments
                    ? 'Задайте вопрос и приложите документ, таблицу или презентацию для анализа.'
                    : canAttachImages
                  ? 'Задайте вопрос, приложите скрин или фото и попросите модель разобрать, сравнить или объяснить изображение.'
                  : 'Задайте любой вопрос, попросите помочь с задачей или обсудите тему урока'}
              </p>
              <div className="mt-8 grid gap-3 w-full max-w-sm">
                {initialPrompts.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                    className="text-left px-4 py-3.5 rounded-xl bg-card border border-border/60 shadow-soft hover:shadow-md hover:border-primary/40 hover:bg-primary/5 text-sm font-medium text-foreground transition-all duration-200 group"
                  >
                    <span className="text-primary group-hover:text-primary mr-2">→</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 animate-fade-in-up ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                style={{ animationDelay: '0ms' }}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft mt-1 overflow-hidden bg-card border border-border/50">
                    {getModelIconPath(modelName) ? (
                      <img src={getModelIconPath(modelName)!} alt="" className="w-5 h-5 object-contain" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${modelColor} flex items-center justify-center`}>
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[82%] md:max-w-[75%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'gradient-hero text-primary-foreground rounded-br-sm'
                      : 'bg-card border border-border/50 rounded-bl-sm shadow-soft'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="space-y-2">
                      {message.contextImages && message.contextImages.length > 0 && (
                        <div className="rounded-xl border border-border/50 bg-secondary/30 p-2">
                          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Анализируемые изображения
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            {message.contextImages.slice(0, 6).map((url, imageIndex) => (
                              <img key={`${url}-${imageIndex}`} src={url} alt="" className="w-12 h-12 rounded object-cover border border-border/50" />
                            ))}
                            {message.contextImages.length > 6 && <span className="text-xs self-center">+{message.contextImages.length - 6}</span>}
                          </div>
                        </div>
                      )}
                      {message.contextAttachments && message.contextAttachments.length > 0 && (
                        <div className="rounded-xl border border-border/50 bg-secondary/30 p-2">
                          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Анализируемые документы
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {message.contextAttachments.map((attachment) => (
                              <div key={attachment.id} className="inline-flex max-w-full items-start gap-2 rounded-lg border border-border/50 bg-background px-3 py-2">
                                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-medium">{attachment.originalName}</div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {attachment.pageCount ? `${attachment.pageCount} стр.` : ''}
                                    {attachment.sheetCount ? `${attachment.sheetCount} лист.` : ''}
                                    {attachment.slideCount ? `${attachment.slideCount} слайд.` : ''}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:font-serif prose-headings:text-base prose-pre:text-xs prose-code:text-xs prose-code:bg-secondary/50 prose-code:px-1 prose-code:rounded">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {message.sourceImages && message.sourceImages.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {message.sourceImages.slice(0, 6).map((url, imageIndex) => (
                            <img key={`${url}-${imageIndex}`} src={url} alt="" className="w-11 h-11 rounded object-cover border border-white/30" />
                          ))}
                          {message.sourceImages.length > 6 && <span className="text-xs self-center">+{message.sourceImages.length - 6}</span>}
                        </div>
                      )}
                      {message.sourceAttachments && message.sourceAttachments.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {message.sourceAttachments.map((attachment) => (
                            <div key={attachment.id} className="inline-flex max-w-full items-start gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2">
                              <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                              <div className="min-w-0">
                                <div className="truncate text-xs font-medium">{attachment.originalName}</div>
                                <div className="text-[11px] opacity-80">
                                  {Math.max(1, Math.round(attachment.fileSize / 1024))} KB
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-secondary border border-border/50 flex items-center justify-center flex-shrink-0 shadow-soft mt-1">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft mt-1 overflow-hidden bg-card border border-border/50">
                {getModelIconPath(modelName) ? (
                  <img src={getModelIconPath(modelName)!} alt="" className="w-5 h-5 object-contain" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${modelColor} flex items-center justify-center`}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-soft">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto min-[1920px]:max-w-[80%] px-4 py-4">
          {canAttachImages || canAttachDocuments ? (
            <ChatAttachmentPanel
              images={sourceImages}
              onImagesChange={setSourceImages}
              attachments={sourceAttachments}
              onAttachmentsChange={setSourceAttachments}
              canAttachImages={canAttachImages}
              canAttachDocuments={canAttachDocuments}
              disabled={isLoading}
              footer={(
                <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                  <ModelSelector
                    type="text"
                    selectedModelId={selectedModelId}
                    onSelect={setSelectedModelId}
                    onModelChange={setSelectedModel}
                    providerName={providerName}
                  />
                  <p className="text-xs text-muted-foreground/60">
                    Enter — отправить, Shift+Enter — новая строка, drag&drop — вложить файл
                  </p>
                </div>
              )}
              className="p-3"
            >
              {({ openFilePicker, isUploadingDocuments }) => (
                <div className="flex gap-3 items-end">
                  <Button
                    onClick={openFilePicker}
                    variant="outline"
                    size="icon"
                    className="h-[52px] w-[52px] shrink-0 rounded-xl border-border/50 hover:border-primary/40"
                    disabled={isLoading || isUploadingDocuments}
                    title="Прикрепить файл"
                  >
                    <Upload className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
                  </Button>
                  <div className="flex-1 relative chat-input-wrap">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={handleInput}
                      onKeyDown={handleKeyDown}
                      placeholder={`Написать ${modelName}...`}
                      rows={1}
                      className="w-full resize-none rounded-2xl border border-border/50 bg-secondary/30 focus:bg-background px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all min-h-[52px] max-h-40 leading-relaxed overflow-y-auto"
                      disabled={isLoading || isUploadingDocuments}
                      autoComplete="off"
                      style={{ height: '52px' }}
                    />
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading || isUploadingDocuments}
                    size="icon"
                    className="h-[52px] w-[52px] min-w-[52px] shrink-0 rounded-2xl gradient-hero hover:opacity-90 shadow-glow transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              )}
            </ChatAttachmentPanel>
          ) : (
            <>
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative chat-input-wrap">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={`Написать ${modelName}...`}
                    rows={1}
                    className="w-full resize-none rounded-2xl border border-border/50 bg-secondary/30 focus:bg-background px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all min-h-[52px] max-h-40 leading-relaxed overflow-y-auto"
                    disabled={isLoading}
                    autoComplete="off"
                    style={{ height: '52px' }}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-[52px] w-[52px] min-w-[52px] shrink-0 rounded-2xl gradient-hero hover:opacity-90 shadow-glow transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <ModelSelector
                  type="text"
                  selectedModelId={selectedModelId}
                  onSelect={setSelectedModelId}
                  onModelChange={setSelectedModel}
                  providerName={providerName}
                />
                <p className="text-xs text-muted-foreground/60">
                  Enter — отправить, Shift+Enter — новая строка
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
