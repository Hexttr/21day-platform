import { ImageGenerator } from '@/components/ImageGenerator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';
import { getAIToolBadge } from '@/lib/ai-tools';

export default function NanoBanana() {
  const chatContext = useChatContext();

  return (
    <div className="h-full min-h-0 min-[0px]:min-h-[100dvh] md:min-h-0" style={{ backgroundColor: 'hsl(248deg 100% 94.56%)' }}>
      <div className="flex h-full min-h-0 flex-col">
        {/* Header (mobile only) */}
        <header className="md:hidden sticky top-0 z-10 flex-shrink-0 border-b border-border/50 bg-card/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-3">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-soft overflow-hidden bg-card border border-border/50">
                <img src="/icons/banano.png" alt="" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-semibold text-foreground leading-none">
                  NanoBanana 3 Pro
                </h1>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Генерация изображений</p>
                  <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getAIToolBadge('paid')}`}>
                    paid
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => chatContext?.clearChat('nanobanana')}
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Очистить чат"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col px-3 py-3 md:p-4">
          <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col min-[1920px]:max-w-[80%]">
            <ImageGenerator />
          </div>
        </div>
      </div>
    </div>
  );
}
