import { ImageGenerator } from '@/components/ImageGenerator';
import { ImageIcon } from 'lucide-react';

export default function NanoBanana() {
  return (
    <div className="min-h-screen bg-background mesh-bg">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border/50 bg-card/80 backdrop-blur-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <span className="text-xl">🍌</span>
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-foreground">
                NanoBanana 3 Pro
              </h1>
              <p className="text-sm text-muted-foreground">
                Генерация изображений с помощью ИИ
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 p-4">
          <ImageGenerator />
        </div>
      </div>
    </div>
  );
}
