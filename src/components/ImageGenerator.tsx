import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ImageIcon, Loader2, Upload, X, Download, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ModelSelector } from '@/components/ModelSelector';
import { useBalance } from '@/contexts/BalanceContext';
import { useChatContext } from '@/contexts/ChatContext';

const STORAGE_KEY = 'ai-chat-nanobanana';
const MAX_STORED_MESSAGES = 20;

type ImageMessage = {
  role: 'user';
  content: string;
  sourceImage?: string;
} | {
  role: 'assistant';
  imageUrl: string;
};

export function ImageGenerator() {
  const [messages, setMessages] = useState<ImageMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { refreshBalance } = useBalance();
  const chatContext = useChatContext();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch (e) {
      console.warn('Failed to parse saved image chat:', e);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const toStore = messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    setSourceImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Чат очищен');
  }, []);

  useEffect(() => {
    chatContext?.registerClearHandler('nanobanana', clearChat);
    return () => chatContext?.unregisterClearHandler('nanobanana');
  }, [chatContext, clearChat]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Изображение слишком большое (макс. 10MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setSourceImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeSourceImage = () => {
    setSourceImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateImage = async () => {
    if (!prompt.trim() || isLoading) return;

    const userMsg: ImageMessage = { role: 'user', content: prompt.trim(), ...(sourceImage && { sourceImage }) };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    removeSourceImage();
    setIsLoading(true);

    try {
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
          image: userMsg.role === 'user' && userMsg.sourceImage ? userMsg.sourceImage : undefined,
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
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-2xl border border-border/50">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-large overflow-hidden bg-card border border-border/50">
              <img src="/icons/banano.png" alt="" className="w-14 h-14 object-contain" />
            </div>
            <p className="font-serif text-lg font-semibold text-foreground mb-2">Генератор изображений</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Опишите, что хотите создать. Можно загрузить фото для редактирования.
            </p>
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
                    {msg.sourceImage && (
                      <div className="flex gap-2 items-center">
                        <img src={msg.sourceImage} alt="" className="w-12 h-12 rounded-lg object-cover border border-white/30" />
                        <span className="text-xs opacity-90">Исходное фото</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  <div className="relative">
                    <img src={msg.imageUrl} alt="Generated" className="max-w-full rounded-xl max-h-80 object-contain" />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2 rounded-lg gap-1 shadow-md"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = msg.imageUrl;
                        link.download = `generated-${Date.now()}.png`;
                        link.click();
                      }}
                    >
                      <Download className="w-3.5 h-3.5" /> Скачать
                    </Button>
                  </div>
                )}
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
      <div className="flex-shrink-0 bg-card rounded-2xl border border-border/50 shadow-soft p-4">
        {sourceImage && (
          <div className="mb-3 flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50">
            <div className="relative flex-shrink-0">
              <img src={sourceImage} alt="Source" className="w-14 h-14 rounded-lg object-cover border border-border/50" />
              <button
                onClick={removeSourceImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Исходное фото загружено. Опишите, как его изменить.</p>
          </div>
        )}

        <div className="flex gap-3 items-end">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="icon"
            className="h-[52px] w-[52px] shrink-0 rounded-xl border-border/50 hover:border-primary/40"
            disabled={isLoading}
            title="Загрузить изображение"
          >
            <Upload className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
          </Button>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={sourceImage ? 'Опишите изменения...' : 'Опишите, что хотите создать...'}
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
        <div className="flex items-center justify-between mt-2">
          <ModelSelector type="image" selectedModelId={selectedModelId} onSelect={setSelectedModelId} />
          <p className="text-xs text-muted-foreground/60">
            Enter — сгенерировать, Shift+Enter — новая строка
          </p>
        </div>
      </div>
    </div>
  );
}
