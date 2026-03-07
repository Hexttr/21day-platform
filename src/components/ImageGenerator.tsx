import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ImageIcon, Loader2, Upload, Download, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ModelSelector } from '@/components/ModelSelector';
import { useBalance } from '@/contexts/BalanceContext';
import { useChatContext } from '@/contexts/ChatContext';
import { resizeImageForUpload, resizeForStorage } from '@/lib/imageUtils';
import { putFullImage, getFullImage } from '@/lib/imageStore';
import { ImageUploadPanel } from '@/components/ImageUploadPanel';

const STORAGE_KEY = 'ai-chat-nanobanana';
const MAX_IMAGES = 14;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];

type ImageMessage = {
  role: 'user';
  content: string;
  sourceImages?: string[];
} | {
  role: 'assistant';
  imageUrl: string;
  fullImageId?: string;
};

/** Превью в localStorage, полное — в IndexedDB */
type StoredMessage = { role: 'user'; content: string } | { role: 'assistant'; imageUrl?: string; fullImageId?: string };

export function ImageGenerator() {
  const [messages, setMessages] = useState<ImageMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { refreshBalance } = useBalance();
  const chatContext = useChatContext();

  const starterPrompts = [
    'Сгенерируй кота на велосипеде в стиле акварели',
    'Сделай кинематографичный портрет девушки',
    'Создай минималистичный логотип для AI-студии',
    'Нарисуй уютную кофейню в японском стиле',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const PLACEHOLDER_SVG =
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23999" font-size="12">изображение</text></svg>';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredMessage[];
        if (Array.isArray(parsed)) {
          const loaded: ImageMessage[] = parsed.map((m) => {
            if (m.role === 'user') return { role: 'user' as const, content: m.content };
            return {
              role: 'assistant' as const,
              imageUrl: m.imageUrl || PLACEHOLDER_SVG,
              ...(m.fullImageId && { fullImageId: m.fullImageId }),
            };
          });
          setMessages(loaded);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved image chat:', e);
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    let cancelled = false;
    const run = async () => {
      const slice = messages.slice(-30);
      const toStore: StoredMessage[] = [];
      let assistantIdx = 0;
      for (const m of slice) {
        if (m.role === 'user') {
          toStore.push({ role: 'user', content: m.content });
          continue;
        }
        if (m.role === 'assistant' && m.imageUrl && !m.imageUrl.includes('<svg')) {
          try {
            const compressed = await resizeForStorage(m.imageUrl);
            const fullImageId = m.fullImageId ?? `img_${assistantIdx}`;
            if (!m.fullImageId) {
              await putFullImage(fullImageId, m.imageUrl);
            }
            toStore.push({ role: 'assistant', imageUrl: compressed, fullImageId });
          } catch {
            toStore.push({ role: 'assistant' });
          }
          assistantIdx++;
        } else {
          toStore.push({ role: 'assistant' });
        }
      }
      if (!cancelled) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
        } catch (e) {
          console.warn('localStorage quota:', e);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [messages]);

  const willUseLastImage =
    sourceImages.length === 0 &&
    (() => {
      const last = [...messages].reverse().find((m) => m.role === 'assistant' && m.imageUrl);
      return Boolean(last);
    })();

  const clearChat = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    setSourceImages([]);
    toast.success('Чат очищен');
  }, []);

  useEffect(() => {
    chatContext?.registerClearHandler('nanobanana', clearChat);
    return () => chatContext?.unregisterClearHandler('nanobanana');
  }, [chatContext, clearChat]);

  const removeSourceImage = (idx?: number) => {
    if (idx !== undefined) {
      setSourceImages((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setSourceImages([]);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim() || isLoading) return;

    const userMsg: ImageMessage = {
      role: 'user',
      content: prompt.trim(),
      ...(sourceImages.length > 0 && { sourceImages: [...sourceImages] }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    let imagesToSend = [...sourceImages];
    removeSourceImage();
    setIsLoading(true);

    // Если пользователь не прикрепил изображений — используем последнее сгенерированное (контекст диалога)
    if (imagesToSend.length === 0) {
      const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && m.imageUrl);
      if (lastAssistant && lastAssistant.role === 'assistant' && lastAssistant.imageUrl) {
        imagesToSend = [lastAssistant.imageUrl];
      }
    }

    try {
      const resized = await Promise.all(imagesToSend.map((url) => resizeImageForUpload(url)));
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api');
      const response = await fetch(`${apiUrl}/ai/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          prompt: userMsg.content,
          images: resized.length > 0 ? resized : undefined,
          modelId: selectedModelId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = typeof data?.error === 'string' ? data.error : data?.error?.message || 'Ошибка генерации';
        throw new Error(errMsg);
      }

      if (data.imageUrl) {
        setMessages((prev) => [...prev, { role: 'assistant', imageUrl: data.imageUrl }]);
        toast.success('Изображение сгенерировано!');
        refreshBalance();
      } else {
        throw new Error('Не удалось получить изображение');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка генерации изображения');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateImage();
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 h-full min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 -mx-1 px-1">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-large overflow-hidden bg-card border border-border/50">
              <img src="/icons/banano.png" alt="" className="w-14 h-14 object-contain" />
            </div>
            <p className="font-serif text-lg font-semibold text-foreground mb-2">Генератор изображений</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Опишите, что хотите создать. Можно прикрепить до {MAX_IMAGES} фото для редактирования или коллажа.
            </p>
            <div className="mt-8 grid gap-3 w-full max-w-md">
              {starterPrompts.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setPrompt(suggestion);
                    textareaRef.current?.focus();
                  }}
                  className="text-left px-4 py-3.5 rounded-xl bg-card border border-border/60 shadow-soft hover:shadow-md hover:border-primary/40 hover:bg-primary/5 text-sm font-medium text-foreground transition-all duration-200 group"
                >
                  <span className="text-primary group-hover:text-primary mr-2">→</span>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft mt-1 overflow-hidden bg-card border border-border/50">
                  <img src="/icons/banano.png" alt="" className="w-5 h-5 object-contain" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'gradient-hero text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border/50 rounded-bl-sm shadow-soft'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="space-y-2">
                    {msg.sourceImages && msg.sourceImages.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {msg.sourceImages.slice(0, 6).map((url, i) => (
                          <img key={i} src={url} alt="" className="w-10 h-10 rounded object-cover border border-white/30" />
                        ))}
                        {msg.sourceImages.length > 6 && <span className="text-xs self-center">+{msg.sourceImages.length - 6}</span>}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  </div>
                ) : msg.imageUrl ? (
                  <div className="relative">
                    <img src={msg.imageUrl} alt="Generated" className="max-w-full rounded-xl max-h-80 object-contain" />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2 rounded-lg gap-1 shadow-md"
                      onClick={async () => {
                        let url = msg.imageUrl;
                        if (msg.fullImageId) {
                          const full = await getFullImage(msg.fullImageId);
                          if (full) url = full;
                        }
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `generated-${Date.now()}.png`;
                        link.click();
                      }}
                    >
                      <Download className="w-3.5 h-3.5" /> Скачать
                    </Button>
                  </div>
                ) : null}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-secondary border border-border/50 flex items-center justify-center flex-shrink-0 shadow-soft mt-1">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft mt-1 overflow-hidden bg-card border border-border/50">
              <img src="/icons/banano.png" alt="" className="w-5 h-5 object-contain" />
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

      {/* Input */}
      <ImageUploadPanel
        images={sourceImages}
        onChange={setSourceImages}
        disabled={isLoading}
        maxImages={MAX_IMAGES}
        maxFileSizeMb={MAX_FILE_SIZE_MB}
        allowedTypes={ALLOWED_TYPES}
        previewSummary={(
          <p className="text-sm text-muted-foreground self-center">
            {sourceImages.length} из {MAX_IMAGES} изображений. Опишите задачу.
          </p>
        )}
        footer={(
          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
            <ModelSelector type="image" selectedModelId={selectedModelId} onSelect={setSelectedModelId} />
            <div className="flex items-center gap-3">
              {willUseLastImage && (
                <span className="text-xs text-primary/80 font-medium">Будет использовано последнее изображение</span>
              )}
              <p className="text-xs text-muted-foreground/60">
                PNG, JPEG, WebP до {MAX_FILE_SIZE_MB}MB. Enter — сгенерировать, drag&drop — загрузить
              </p>
            </div>
          </div>
        )}
      >
        {({ openFilePicker }) => (
          <div className="flex gap-3 items-end">
            <Button
              onClick={openFilePicker}
              variant="outline"
              size="icon"
              className="h-[52px] w-[52px] shrink-0 rounded-xl border-border/50 hover:border-primary/40"
              disabled={isLoading}
              title={`Прикрепить изображения (макс. ${MAX_IMAGES}, до ${MAX_FILE_SIZE_MB}MB)`}
            >
              <Upload className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
            </Button>

            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                sourceImages.length
                  ? 'Опишите изменения или коллаж...'
                  : willUseLastImage
                    ? 'Редактировать последнее изображение (например: добавь Карлссона)...'
                    : 'Опишите, что хотите создать...'
              }
              className="min-h-[52px] max-h-[120px] resize-none rounded-xl bg-secondary/30 border-border/50 focus:border-primary text-sm flex-1"
              disabled={isLoading}
              rows={1}
            />

            <Button
              onClick={generateImage}
              disabled={!prompt.trim() || isLoading}
              size="icon"
              className="h-[52px] w-[52px] min-w-[52px] shrink-0 rounded-xl gradient-hero hover:opacity-90 shadow-glow disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
            </Button>
          </div>
        )}
      </ImageUploadPanel>
    </div>
  );
}
