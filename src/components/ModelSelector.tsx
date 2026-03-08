import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

export interface AIModel {
  id: string;
  modelKey: string;
  displayName: string;
  modelType: 'text' | 'image';
  providerId: string;
  sortOrder: number;
  inputPricePer1k?: string | null;
  outputPricePer1k?: string | null;
  fixedPrice?: string | null;
  supportsStreaming?: boolean;
  supportsImageInput?: boolean;
  supportsDocumentInput?: boolean;
  supportsImageOutput?: boolean;
  supportsSystemPrompt?: boolean;
}

interface AIProvider {
  id: string;
  name: string;
  displayName: string;
}

interface ModelSelectorProps {
  type: 'text' | 'image';
  selectedModelId: string | null;
  onSelect: (modelId: string) => void;
  onModelChange?: (model: AIModel | null) => void;
  className?: string;
  providerName?: string;
}

let cachedData: { models: AIModel[]; providers: AIProvider[] } | null = null;
let fetchPromise: Promise<{ models: AIModel[]; providers: AIProvider[] }> | null = null;

/** Сбросить кэш (после изменений в админке) */
export function invalidateModelsCache() {
  cachedData = null;
  fetchPromise = null;
}

function fetchModels(): Promise<{ models: AIModel[]; providers: AIProvider[] }> {
  if (cachedData) return Promise.resolve(cachedData);
  if (fetchPromise) return fetchPromise;
  fetchPromise = api<{ models: AIModel[]; providers: AIProvider[] }>('/ai-models')
    .then((data) => { cachedData = data; fetchPromise = null; return data; })
    .catch((e) => { fetchPromise = null; throw e; });
  return fetchPromise;
}

export function ModelSelector({ type, selectedModelId, onSelect, onModelChange, className, providerName }: ModelSelectorProps) {
  const [models, setModels] = useState<AIModel[]>(cachedData?.models || []);
  const [providers, setProviders] = useState<AIProvider[]>(cachedData?.providers || []);
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(!!cachedData);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchModels()
      .then((data) => { setModels(data.models); setProviders(data.providers); setLoaded(true); })
      .catch(console.error);
  }, []);

  const allowedProviderIds = useMemo(() => {
    return providerName
      ? new Set(providers.filter((provider) => provider.name === providerName).map((provider) => provider.id))
      : null;
  }, [providerName, providers]);

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      if (model.modelType !== type) return false;
      if (allowedProviderIds && !allowedProviderIds.has(model.providerId)) return false;
      return true;
    });
  }, [allowedProviderIds, models, type]);
  const selected = filteredModels.find(m => m.id === selectedModelId);

  const selectorTitle = type === 'text' ? 'Выбор текстовой модели' : 'Выбор image-модели';

  const getModelHint = (model: AIModel): string => {
    const key = model.modelKey.toLowerCase();
    const isFree = Number(model.fixedPrice || 0) <= 0 && Number(model.inputPricePer1k || 0) <= 0 && Number(model.outputPricePer1k || 0) <= 0;
    if (isFree) return 'Бесплатно';
    if (model.supportsDocumentInput && model.supportsImageInput) return 'Документы и изображения';
    if (model.supportsDocumentInput) return 'Анализ документов';
    if (key.includes('flash-lite')) return 'Самая дешёвая';
    if (key.includes('flash-image')) return 'По умолчанию';
    if (key.includes('2.5-flash') && model.modelType === 'text') return 'Баланс цены и качества';
    if (key.includes('2.5-pro')) return 'Максимальное качество';
    if (key.includes('2.0-flash')) return 'Быстрая резервная';
    if (key.includes('image-preview') || key.includes('nano')) return 'Творческий режим';
    return model.modelType === 'text' ? 'Текстовая модель' : 'Работа с изображениями';
  };

  const renderOptions = () => (
    <div className="space-y-1.5">
      {filteredModels.map((model) => {
        const provider = providers.find((p) => p.id === model.providerId);
        const isSelected = model.id === selectedModelId;
        return (
          <button
            key={model.id}
            type="button"
            onClick={() => {
              onSelect(model.id);
              setIsOpen(false);
            }}
            className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
              isSelected
                ? 'border-primary/20 bg-primary/10 text-primary shadow-xs'
                : 'border-border/50 bg-background/80 text-foreground hover:border-primary/15 hover:bg-secondary/50'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{model.displayName}</div>
              {isSelected && <span className="text-[11px] font-semibold uppercase tracking-wide">Выбрано</span>}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {provider?.displayName || 'Провайдер'} · {getModelHint(model)}
            </div>
          </button>
        );
      })}
    </div>
  );

  // Auto-select the first available model for this selector scope.
  useEffect(() => {
    if (loaded && filteredModels.length > 0 && !selectedModelId) {
      onSelect(filteredModels[0].id);
    }
  }, [loaded, filteredModels, selectedModelId, onSelect]);

  // If the currently selected model falls outside the current provider/type scope, reset to the first valid option.
  useEffect(() => {
    if (!loaded || filteredModels.length === 0 || !selectedModelId) return;
    const stillAvailable = filteredModels.some((model) => model.id === selectedModelId);
    if (!stillAvailable) {
      onSelect(filteredModels[0].id);
    }
  }, [loaded, filteredModels, selectedModelId, onSelect]);

  useEffect(() => {
    onModelChange?.(selected || filteredModels[0] || null);
  }, [filteredModels, onModelChange, selected]);

  if (!loaded || filteredModels.length === 0) return null;

  const triggerClassName = `flex items-center gap-2 px-3 py-2 rounded-full bg-secondary/45 border border-border/50 hover:border-primary/40 text-sm font-medium text-foreground transition-colors ${className || ''}`;

  if (isMobile) {
    return (
      <>
        <button type="button" onClick={() => setIsOpen(true)} className={triggerClassName}>
          <span className="truncate max-w-[190px]">{selected?.displayName || 'Выбрать модель'}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="rounded-t-[28px] px-4 pb-6 pt-8">
            <SheetHeader className="mb-4">
              <SheetTitle className="font-serif">{selectorTitle}</SheetTitle>
              <SheetDescription>
                Выберите модель для текущего инструмента.
              </SheetDescription>
            </SheetHeader>
            {selected && (
              <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">Текущая модель</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{selected.displayName}</div>
                <div className="mt-1 text-xs text-muted-foreground">{getModelHint(selected)}</div>
              </div>
            )}
            <div className="max-h-[62vh] overflow-y-auto pr-1">
              {renderOptions()}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={triggerClassName}>
          <span className="truncate max-w-[190px]">{selected?.displayName || 'Выбрать модель'}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={10}
        className="w-[300px] rounded-2xl border border-border/50 bg-card p-2 shadow-large"
      >
        <div className="mb-2 px-2 pt-1">
          <div className="text-sm font-semibold text-foreground">{selectorTitle}</div>
          <div className="text-xs text-muted-foreground">Список открывается поверх интерфейса и не сдвигает страницу.</div>
        </div>
        <div className="max-h-[320px] overflow-y-auto pr-1">
          {renderOptions()}
        </div>
      </PopoverContent>
    </Popover>
  );
}
