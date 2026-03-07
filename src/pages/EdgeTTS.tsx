import { useState } from 'react';
import { Download, Loader2, Mic, Sparkles } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { BalanceWidget } from '@/components/BalanceWidget';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/api/client';
import { toast } from 'sonner';

const VOICES = [
  { id: 'ru-RU-SvetlanaNeural', label: 'Женский голос', hint: 'Светлана' },
  { id: 'ru-RU-DmitryNeural', label: 'Мужской голос', hint: 'Дмитрий' },
] as const;

const RATES = [
  { id: '-10%', label: 'Медленнее' },
  { id: '+0%', label: 'Нормально' },
  { id: '+10%', label: 'Быстрее' },
] as const;

export default function EdgeTTS() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState<(typeof VOICES)[number]['id']>('ru-RU-SvetlanaNeural');
  const [rate, setRate] = useState<(typeof RATES)[number]['id']>('+0%');
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateSpeech = async () => {
    if (!text.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await api<{ audioDataUrl: string }>('/ai/tts', {
        method: 'POST',
        body: { text, voice, rate },
      });
      setAudioDataUrl(result.audioDataUrl);
      toast.success('Озвучка готова');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось создать озвучку');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(248deg 100% 94.56%)' }}>
      <div className="h-screen flex flex-col">
        <header className="md:hidden flex-shrink-0 border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-soft bg-card border border-border/50">
                <Mic className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-semibold text-foreground leading-none">Edge TTS</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Бесплатная озвучка текста</p>
              </div>
            </div>
            <BalanceWidget compact />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto min-[1920px]:max-w-[80%] px-4 py-6 space-y-6">
            <div className="flex flex-col items-center justify-center text-center animate-fade-in-up pt-6">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-large bg-card border border-border/50">
                <Mic className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">Озвучьте текст бесплатно</h2>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                Два быстрых русских голоса через Edge TTS. Хорошо подходит для коротких озвучек, анонсов и черновых аудио.
              </p>
              <div className="mt-8 grid gap-3 w-full max-w-lg">
                {[
                  'Привет! Сегодня мы разберём, как использовать искусственный интеллект в работе специалиста.',
                  'Сделай тёплую озвучку для короткого приветствия в Telegram-канале.',
                  'Прочитай этот текст спокойно и уверенно, как ведущий подкаста.',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setText(suggestion)}
                    className="text-left px-4 py-3.5 rounded-xl bg-card border border-border/60 shadow-soft hover:shadow-md hover:border-primary/40 hover:bg-primary/5 text-sm font-medium text-foreground transition-all duration-200 group"
                  >
                    <span className="text-primary group-hover:text-primary mr-2">→</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Голос</p>
                  <Select value={voice} onValueChange={(value) => setVoice(value as typeof voice)}>
                    <SelectTrigger className="rounded-xl border-border/50 bg-secondary/30">
                      <SelectValue placeholder="Выберите голос" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICES.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label} · {item.hint}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Скорость</p>
                  <Select value={rate} onValueChange={(value) => setRate(value as typeof rate)}>
                    <SelectTrigger className="rounded-xl border-border/50 bg-secondary/30">
                      <SelectValue placeholder="Выберите скорость" />
                    </SelectTrigger>
                    <SelectContent>
                      {RATES.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Текст</p>
                <Textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Введите текст для озвучки..."
                  className="min-h-[180px] rounded-2xl bg-secondary/30 border-border/50 focus:border-primary text-sm"
                />
                <p className="text-xs text-muted-foreground/70">
                  До 2000 символов за запрос. Инструмент бесплатный и не списывает баланс.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={generateSpeech}
                  disabled={!text.trim() || isLoading}
                  className="rounded-xl gradient-hero hover:opacity-90 shadow-glow"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Сгенерировать озвучку
                </Button>
                {audioDataUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-border/50"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = audioDataUrl;
                      link.download = `edge-tts-${Date.now()}.webm`;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Скачать
                  </Button>
                )}
              </div>
            </div>

            {audioDataUrl && (
              <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-5 space-y-3">
                <p className="text-sm font-medium text-foreground">Предпрослушивание</p>
                <audio controls src={audioDataUrl} className="w-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
