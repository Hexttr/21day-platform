import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Loader2, ChevronLeft, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PracticalMaterial {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
}

export function PracticalMaterials() {
  const { isSessionReady } = useAuth();
  const [materials, setMaterials] = useState<PracticalMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<PracticalMaterial | null>(null);

  useEffect(() => {
    if (!isSessionReady) return;
    loadMaterials();
  }, [isSessionReady]);

  const loadMaterials = async () => {
    try {
      const data = await api<Array<{ id: string; title: string; description: string | null; videoUrl: string }>>('/materials');
      setMaterials((data || []).map(m => ({ ...m, video_url: m.videoUrl })));
    } catch (error: unknown) {
      console.error('[PracticalMaterials] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
          <Play className="w-8 h-8 text-accent" />
        </div>
        <p className="text-foreground font-medium mb-1">Материалы скоро появятся</p>
        <p className="text-sm text-muted-foreground">Администратор добавит практические видео</p>
      </div>
    );
  }

  if (selectedMaterial) {
    return (
      <div className="animate-fade-in-up space-y-5">
        <button
          onClick={() => setSelectedMaterial(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors focus-ring rounded-lg px-2 py-1 -ml-2 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">К списку материалов</span>
        </button>

        <div className="bg-card rounded-2xl sm:rounded-3xl border border-border/50 shadow-soft overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Play className="w-4 h-4 text-accent" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-foreground">
                {selectedMaterial.title}
              </h2>
            </div>
            {selectedMaterial.description && (
              <p className="text-muted-foreground mt-3 leading-relaxed pl-12">
                {selectedMaterial.description}
              </p>
            )}
          </div>
          <div className="p-6 sm:p-8">
            <div className="aspect-video rounded-2xl overflow-hidden border border-border/50 bg-muted">
              <iframe
                src={getEmbedUrl(selectedMaterial.video_url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {materials.map((material, index) => (
        <button
          key={material.id}
          onClick={() => setSelectedMaterial(material)}
          className="group text-left p-5 rounded-2xl bg-card border border-border/50 shadow-soft hover:shadow-medium hover:border-accent/30 transition-all duration-300 animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center flex-shrink-0 transition-colors">
              <Play className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-accent transition-colors line-clamp-2">
                {material.title}
              </h3>
              {material.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {material.description}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-3">
                <ExternalLink className="w-3.5 h-3.5 text-accent/70" />
                <span className="text-xs font-medium text-accent/80">Смотреть видео</span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
