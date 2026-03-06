import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { ChevronDown } from 'lucide-react';

interface AIModel {
  id: string;
  modelKey: string;
  displayName: string;
  modelType: 'text' | 'image';
  providerId: string;
  sortOrder: number;
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
  className?: string;
}

let cachedModels: AIModel[] | null = null;
let cachedProviders: AIProvider[] | null = null;

export function ModelSelector({ type, selectedModelId, onSelect, className }: ModelSelectorProps) {
  const [models, setModels] = useState<AIModel[]>(cachedModels || []);
  const [providers, setProviders] = useState<AIProvider[]>(cachedProviders || []);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (cachedModels) return;
    api<{ models: AIModel[]; providers: AIProvider[] }>('/ai-models')
      .then((data) => {
        cachedModels = data.models;
        cachedProviders = data.providers;
        setModels(data.models);
        setProviders(data.providers);
        if (!selectedModelId && data.models.length > 0) {
          const defaultModel = data.models.find(m => m.modelType === type);
          if (defaultModel) onSelect(defaultModel.id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      const defaultModel = models.find(m => m.modelType === type);
      if (defaultModel) onSelect(defaultModel.id);
    }
  }, [models, type, selectedModelId, onSelect]);

  const filteredModels = models.filter(m => m.modelType === type);
  const selected = filteredModels.find(m => m.id === selectedModelId);

  if (filteredModels.length <= 1) return null;

  return (
    <div className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 hover:border-primary/40 text-sm font-medium text-foreground transition-colors"
      >
        <span className="truncate max-w-[140px]">{selected?.displayName || 'Выбрать модель'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] bg-card border border-border/50 rounded-xl shadow-large overflow-hidden">
            {filteredModels.map((model) => {
              const provider = providers.find(p => p.id === model.providerId);
              const isSelected = model.id === selectedModelId;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => { onSelect(model.id); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary/50 text-foreground'
                  }`}
                >
                  <div className="font-medium">{model.displayName}</div>
                  {provider && <div className="text-xs text-muted-foreground">{provider.displayName}</div>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
