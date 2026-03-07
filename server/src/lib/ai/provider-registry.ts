import { GeminiAdapter } from './providers/gemini.js';
import { GroqAdapter } from './providers/groq.js';
import { AIProviderAdapter } from './types.js';

const registry: Record<string, AIProviderAdapter> = {
  gemini: new GeminiAdapter(),
  groq: new GroqAdapter(),
};

export function getProviderAdapter(providerName: string): AIProviderAdapter {
  const adapter = registry[providerName];
  if (!adapter) {
    throw new Error(`Провайдер "${providerName}" пока не поддерживается runtime`);
  }
  return adapter;
}
