/**
 * Seed billing tables: AI providers, models, and platform settings.
 * Run: cd server && npx tsx src/db/seed-billing.ts
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

import { eq } from 'drizzle-orm';
import { db } from './index.js';
import { aiProviders, aiModels, platformSettings } from './schema.js';

async function seedBilling() {
  // Seed Gemini provider
  const existingProviders = await db.select().from(aiProviders);
  let geminiProvider = existingProviders.find(p => p.name === 'gemini');

  if (!geminiProvider) {
    const [row] = await db.insert(aiProviders).values({
      name: 'gemini',
      displayName: 'Google Gemini',
      apiKeyEnv: 'GEMINI_API_KEY',
      isActive: true,
    }).returning();
    geminiProvider = row;
    console.log('Created Gemini provider');
  } else {
    console.log('Gemini provider already exists');
  }

  // Seed models (prices in RUB, approximate based on Google pricing * markup)
  const existingModels = await db.select().from(aiModels);
  const modelSeeds = [
    // Text models
    {
      modelKey: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      modelType: 'text' as const,
      supportsStreaming: true,
      supportsImageInput: false,
      supportsImageOutput: false,
      supportsSystemPrompt: true,
      inputPricePer1k: '0.005',    // ~0.005 RUB per 1K input tokens
      outputPricePer1k: '0.020',   // ~0.020 RUB per 1K output tokens
      fixedPrice: '0',
      sortOrder: 1,
      isActive: true,
    },
    {
      modelKey: 'gemini-2.5-pro',
      displayName: 'Gemini 2.5 Pro',
      modelType: 'text' as const,
      supportsStreaming: true,
      supportsImageInput: false,
      supportsImageOutput: false,
      supportsSystemPrompt: true,
      inputPricePer1k: '0.020',
      outputPricePer1k: '0.080',
      fixedPrice: '0',
      sortOrder: 2,
      isActive: true,
    },
    {
      modelKey: 'gemini-2.5-flash-lite',
      displayName: 'Gemini 2.5 Flash Lite',
      modelType: 'text' as const,
      supportsStreaming: true,
      supportsImageInput: false,
      supportsImageOutput: false,
      supportsSystemPrompt: true,
      inputPricePer1k: '0.002',
      outputPricePer1k: '0.008',
      fixedPrice: '0',
      sortOrder: 3,
      isActive: true,
    },
    {
      modelKey: 'gemini-2.0-flash',
      displayName: 'Gemini 2.0 Flash',
      modelType: 'text' as const,
      supportsStreaming: true,
      supportsImageInput: false,
      supportsImageOutput: false,
      supportsSystemPrompt: true,
      inputPricePer1k: '0.003',
      outputPricePer1k: '0.012',
      fixedPrice: '0',
      sortOrder: 4,
      isActive: true,
    },
    {
      modelKey: 'gemini-1.5-flash',
      displayName: 'Gemini 1.5 Flash',
      modelType: 'text' as const,
      supportsStreaming: true,
      supportsImageInput: false,
      supportsImageOutput: false,
      supportsSystemPrompt: true,
      inputPricePer1k: '0.002',
      outputPricePer1k: '0.008',
      fixedPrice: '0',
      sortOrder: 99,
      isActive: false,
    },
    // Image models (Gemini Image first = default, NanoBanana stays available)
    {
      modelKey: 'gemini-2.5-flash-image',
      displayName: 'Gemini 2.5 Flash Image',
      modelType: 'image' as const,
      supportsStreaming: false,
      supportsImageInput: true,
      supportsImageOutput: true,
      supportsSystemPrompt: false,
      inputPricePer1k: '0',
      outputPricePer1k: '0',
      fixedPrice: '2.00',
      sortOrder: 10,
      isActive: true,
    },
    {
      modelKey: 'gemini-3-pro-image-preview',
      displayName: 'NanoBanana Pro',
      modelType: 'image' as const,
      supportsStreaming: false,
      supportsImageInput: true,
      supportsImageOutput: true,
      supportsSystemPrompt: false,
      inputPricePer1k: '0',
      outputPricePer1k: '0',
      fixedPrice: '3.00',
      sortOrder: 11,
      isActive: true,
    },
  ];

  // Fix NanoBanana Pro modelKey (was nano-banana-pro-preview, correct is gemini-3-pro-image-preview)
  const oldNanoBanana = existingModels.find(m => m.modelKey === 'nano-banana-pro-preview');
  if (oldNanoBanana) {
    await db.update(aiModels).set({ modelKey: 'gemini-3-pro-image-preview', updatedAt: new Date() }).where(eq(aiModels.id, oldNanoBanana.id));
    console.log('Updated NanoBanana Pro modelKey to gemini-3-pro-image-preview');
  }

  // Make Gemini 2.5 Flash Image default (sortOrder 10), NanoBanana secondary (11)
  const allImageModels = await db.select().from(aiModels).where(eq(aiModels.modelType, 'image'));
  const nanoPro = allImageModels.find(m => m.modelKey === 'gemini-3-pro-image-preview');
  const geminiImg = allImageModels.find(m => m.modelKey === 'gemini-2.5-flash-image');
  if (geminiImg && geminiImg.sortOrder !== 10) {
    await db.update(aiModels).set({ sortOrder: 10, updatedAt: new Date() }).where(eq(aiModels.id, geminiImg.id));
    console.log('Set Gemini 2.5 Flash Image as default (sortOrder 10)');
  }
  if (nanoPro && nanoPro.sortOrder !== 11) {
    await db.update(aiModels).set({ sortOrder: 11, updatedAt: new Date() }).where(eq(aiModels.id, nanoPro.id));
  }

  let modelsCreated = 0;
  for (const seed of modelSeeds) {
    const exists = existingModels.find(m =>
      m.modelKey === seed.modelKey || (seed.modelKey === 'gemini-3-pro-image-preview' && m.modelKey === 'nano-banana-pro-preview')
    );
    if (!exists) {
      await db.insert(aiModels).values({
        providerId: geminiProvider!.id,
        ...seed,
      });
      modelsCreated++;
    } else {
      await db.update(aiModels).set({
        displayName: seed.displayName,
        modelType: seed.modelType,
        supportsStreaming: seed.supportsStreaming,
        supportsImageInput: seed.supportsImageInput,
        supportsImageOutput: seed.supportsImageOutput,
        supportsSystemPrompt: seed.supportsSystemPrompt,
        inputPricePer1k: seed.inputPricePer1k,
        outputPricePer1k: seed.outputPricePer1k,
        fixedPrice: seed.fixedPrice,
        sortOrder: seed.sortOrder,
        isActive: seed.isActive,
        updatedAt: new Date(),
      }).where(eq(aiModels.id, exists.id));
    }
  }
  console.log(`Created ${modelsCreated} new models (${existingModels.length} already existed)`);

  // Seed platform settings
  const settingsSeeds = [
    { key: 'markup_percent', value: '50', description: 'Наценка в % от базовой стоимости AI-запросов' },
    { key: 'daily_free_requests', value: '10', description: 'Количество бесплатных AI-запросов в день' },
    { key: 'min_topup_amount', value: '100', description: 'Минимальная сумма пополнения (RUB)' },
    { key: 'max_topup_amount', value: '10000', description: 'Максимальная сумма пополнения (RUB)' },
    { key: 'free_for_admins', value: '1', description: 'Бесплатно для администраторов (1=да, 0=нет)' },
  ];

  for (const s of settingsSeeds) {
    await db.insert(platformSettings).values(s).onConflictDoNothing();
  }
  console.log('Platform settings seeded');
}

seedBilling()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
