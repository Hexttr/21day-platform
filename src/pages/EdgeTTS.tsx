import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Pause, Play, Square, Volume2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getAIToolBadge } from '@/lib/ai-tools';

const RATES = [
  { id: '0.9', label: 'Медленнее' },
  { id: '1', label: 'Нормально' },
  { id: '1.1', label: 'Быстрее' },
] as const;

export default function EdgeTTS() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('');
  const [rate, setRate] = useState<(typeof RATES)[number]['id']>('1');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const preferredVoices = useMemo(() => {
    const russianVoices = availableVoices.filter((item) => item.lang.toLowerCase().startsWith('ru'));
    const pool = russianVoices.length > 0 ? russianVoices : availableVoices;
    return [...pool].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [availableVoices]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      setVoice((current) => {
        if (current || voices.length === 0) return current;
        const russianVoice = voices.find((item) => item.lang.toLowerCase().startsWith('ru'));
        return (russianVoice || voices[0]).voiceURI;
      });
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const startSpeech = () => {
    if (!isSupported) {
      toast.error('Ваш браузер не поддерживает Web Speech API');
      return;
    }

    if (!text.trim()) return;

    const synthesis = window.speechSynthesis;
    synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text.trim());
    const selectedVoice = preferredVoices.find((item) => item.voiceURI === voice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'ru-RU';
    }
    utterance.rate = Number(rate);

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onpause = () => setIsPaused(true);
    utterance.onresume = () => setIsPaused(false);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
      toast.error('Браузер не смог озвучить этот текст');
    };

    utteranceRef.current = utterance;
    synthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const resumeSpeech = () => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const starterSuggestions = [
    'Привет! Сегодня мы разберём, как использовать искусственный интеллект в работе специалиста.',
    'Сделай тёплую озвучку для короткого приветствия в Telegram-канале.',
    'Прочитай этот текст спокойно и уверенно, как ведущий подкаста.',
  ];

  return (
    <div className="h-full min-h-0 min-[0px]:min-h-[100dvh] md:min-h-0" style={{ backgroundColor: 'hsl(248deg 100% 94.56%)' }}>
      <div className="flex h-full min-h-0 flex-col">
        <header className="md:hidden sticky top-0 z-10 flex-shrink-0 border-b border-border/50 bg-card/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-3">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-soft bg-card border border-border/50">
                <Mic className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-semibold text-foreground leading-none">Озвучка в браузере</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">Web Speech API без сервера</p>
                  <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getAIToolBadge('free')}`}>
                    free
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl min-[1920px]:max-w-[78%] px-3 py-4 space-y-4 md:px-4 md:py-5 md:space-y-5">
            <div className="flex flex-col items-center justify-center pt-1 text-center animate-fade-in-up md:pt-3">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-3xl border border-border/50 bg-card shadow-large md:mb-4 md:h-16 md:w-16">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <h2 className="mb-2 font-serif text-2xl font-semibold text-foreground md:text-[28px]">Озвучьте текст бесплатно</h2>
              <div className="mb-2 flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${getAIToolBadge('free')}`}>
                  Бесплатно
                </span>
              </div>
              <p className="max-w-md text-sm leading-6 text-muted-foreground md:leading-7">
                Озвучка идёт прямо в вашем браузере через Web Speech API. Голоса и качество зависят от браузера и операционной системы.
              </p>
              <div className="mt-5 grid w-full max-w-lg gap-2 md:mt-6 md:gap-2.5">
                {starterSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setText(suggestion)}
                    className="group rounded-xl border border-border/60 bg-card px-4 py-3 text-left text-sm font-medium text-foreground shadow-soft transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
                  >
                    <span className="text-primary group-hover:text-primary mr-2">→</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-4 shadow-soft md:p-5">
              {!isSupported && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
                  Этот браузер не поддерживает озвучку через Web Speech API. Лучше всего работает в современных Chrome и Edge.
                </div>
              )}

              <div className="grid gap-3 md:gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Голос</p>
                  <Select value={voice} onValueChange={(value) => setVoice(value as typeof voice)}>
                    <SelectTrigger className="rounded-xl border-border/50 bg-secondary/30" disabled={preferredVoices.length === 0}>
                      <SelectValue placeholder="Выберите голос" />
                    </SelectTrigger>
                    <SelectContent>
                      {preferredVoices.map((item) => (
                        <SelectItem key={item.voiceURI} value={item.voiceURI}>
                          {item.name} · {item.lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground/70">
                    Если русских голосов нет, браузер покажет доступные системные голоса.
                  </p>
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
                  className="min-h-[112px] rounded-2xl bg-secondary/30 border-border/50 focus:border-primary text-sm leading-6 md:min-h-[132px]"
                />
                <p className="text-xs text-muted-foreground/70">
                  Текст не уходит на сервер. Нажатие запускает локальную озвучку в вашем браузере.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
                <Button
                  onClick={startSpeech}
                  disabled={!text.trim() || !isSupported}
                  className="rounded-xl gradient-hero hover:opacity-90 shadow-glow"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Озвучить
                </Button>
                {isSpeaking && !isPaused && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-border/50"
                    onClick={pauseSpeech}
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Пауза
                  </Button>
                )}
                {isSpeaking && isPaused && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-border/50"
                    onClick={resumeSpeech}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Продолжить
                  </Button>
                )}
                {isSpeaking && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-border/50"
                    onClick={stopSpeech}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Стоп
                  </Button>
                )}
              </div>
            </div>

            {isSpeaking && (
              <div className="space-y-3 rounded-2xl border border-border/50 bg-card p-4 shadow-soft md:p-5">
                <p className="text-sm font-medium text-foreground">Статус</p>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Volume2 className="w-4 h-4" />
                  {isPaused ? 'Озвучка на паузе' : 'Браузер сейчас озвучивает текст'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
