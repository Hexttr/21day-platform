import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Video,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface PracticalMaterial {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  sort_order: number;
  is_published: boolean;
}

export function PracticalMaterialsAdmin() {
  const [materials, setMaterials] = useState<PracticalMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const data = await api<Array<{ id: string; title: string; description: string | null; videoUrl: string; sortOrder: number; isPublished: boolean }>>('/admin/materials');
      setMaterials(data.map(m => ({ id: m.id, title: m.title, description: m.description, video_url: m.videoUrl, sort_order: m.sortOrder, is_published: m.isPublished })));
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('Ошибка загрузки материалов');
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = async () => {
    try {
      const maxOrder = materials.length > 0 ? Math.max(...materials.map(m => m.sort_order)) : 0;
      const data = await api<{ id: string; title: string; description: string | null; videoUrl: string; sortOrder: number; isPublished: boolean }>('/admin/materials', {
        method: 'POST',
        body: { title: 'Новый материал', videoUrl: '', sortOrder: maxOrder + 1, isPublished: false }
      });
      setMaterials([...materials, { id: data.id, title: data.title, description: data.description, video_url: data.videoUrl, sort_order: data.sortOrder, is_published: data.isPublished }]);
      toast.success('Материал добавлен');
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error('Ошибка добавления');
    }
  };

  const updateMaterial = (id: string, updates: Partial<PracticalMaterial>) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const saveMaterial = async (material: PracticalMaterial) => {
    setSaving(material.id);
    try {
      await api(`/admin/materials/${material.id}`, {
        method: 'PUT',
        body: { title: material.title, description: material.description, videoUrl: material.video_url, sortOrder: material.sort_order, isPublished: material.is_published }
      });
      toast.success('Сохранено');
    } catch (error) {
      console.error('Error saving material:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(null);
    }
  };

  const deleteMaterial = async (id: string) => {
    if (!confirm('Удалить этот материал?')) return;
    try {
      await api(`/admin/materials/${id}`, { method: 'DELETE' });
      setMaterials(materials.filter(m => m.id !== id));
      toast.success('Материал удалён');
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Ошибка удаления');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {materials.length} {materials.length === 1 ? 'материал' : 'материалов'} · {materials.filter(m => m.is_published).length} опубликовано
          </p>
        </div>
        <Button onClick={addMaterial} className="rounded-xl gradient-hero hover:opacity-90 shadow-glow gap-2">
          <Plus className="w-4 h-4" />
          Добавить материал
        </Button>
      </div>

      {materials.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
            <Video className="w-8 h-8 text-accent" />
          </div>
          <p className="font-serif text-lg font-semibold text-foreground mb-2">Нет материалов</p>
          <p className="text-sm text-muted-foreground mb-5">Добавьте первый практический видео-материал</p>
          <Button onClick={addMaterial} variant="outline" className="rounded-xl gap-2">
            <Plus className="w-4 h-4" />
            Добавить первый материал
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {materials.map((material, index) => (
            <div key={material.id} className="bg-card rounded-2xl border border-border/50 shadow-soft overflow-hidden animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
              {/* Card header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-border/50 bg-secondary/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Video className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
                    {material.title || 'Без названия'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${
                    material.is_published ? 'text-success' : 'text-muted-foreground'
                  }`}>
                    {material.is_published ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {material.is_published ? 'Опубликован' : 'Скрыт'}
                    </span>
                  </div>
                  <Switch
                    checked={material.is_published}
                    onCheckedChange={(checked) => updateMaterial(material.id, { is_published: checked })}
                  />
                </div>
              </div>

              {/* Card content */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Название</Label>
                    <Input
                      value={material.title}
                      onChange={(e) => updateMaterial(material.id, { title: e.target.value })}
                      placeholder="Название материала"
                      className="rounded-xl bg-secondary/30 border-border/50 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Video className="w-3.5 h-3.5 text-accent" />
                      Ссылка на видео
                    </Label>
                    <Input
                      value={material.video_url}
                      onChange={(e) => updateMaterial(material.id, { video_url: e.target.value })}
                      placeholder="https://youtube.com/... или vimeo.com/..."
                      className="rounded-xl bg-secondary/30 border-border/50 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Описание (необязательно)</Label>
                  <Textarea
                    value={material.description || ''}
                    onChange={(e) => updateMaterial(material.id, { description: e.target.value || null })}
                    placeholder="Краткое описание материала..."
                    className="min-h-[60px] rounded-xl bg-secondary/30 border-border/50 focus:border-primary resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    onClick={() => saveMaterial(material)}
                    disabled={saving === material.id}
                    size="sm"
                    className="rounded-xl gradient-hero hover:opacity-90 shadow-glow gap-1.5"
                  >
                    {saving === material.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Сохранить
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMaterial(material.id)}
                    className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
