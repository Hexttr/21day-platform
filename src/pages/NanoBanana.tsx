import { ImageGenerator } from '@/components/ImageGenerator';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function NanoBanana() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(248deg 100% 94.56%)' }}>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-3 px-4 h-16">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-soft">
              <span className="text-xl">🍌</span>
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold text-foreground leading-none">
                NanoBanana 3 Pro
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Генерация изображений с помощью ИИ
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto">
            <ImageGenerator />
          </div>
        </div>
      </div>
    </div>
  );
}
