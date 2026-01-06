import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OpenRouterModel {
  id: string;
  name: string;
  created?: number;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
  architecture?: {
    modality: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
  };
}

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  maxOutput: number;
  inputCost: number; // per 1M tokens
  outputCost: number; // per 1M tokens
  modality: string;
}

// Static Anthropic models (these are well-known)
const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    contextLength: 200000,
    maxOutput: 32000,
    inputCost: 15,
    outputCost: 75,
    modality: 'text+image→text',
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    contextLength: 200000,
    maxOutput: 64000,
    inputCost: 3,
    outputCost: 15,
    modality: 'text+image→text',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextLength: 200000,
    maxOutput: 8192,
    inputCost: 3,
    outputCost: 15,
    modality: 'text+image→text',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    contextLength: 200000,
    maxOutput: 8192,
    inputCost: 0.8,
    outputCost: 4,
    modality: 'text+image→text',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    contextLength: 200000,
    maxOutput: 4096,
    inputCost: 15,
    outputCost: 75,
    modality: 'text+image→text',
  },
];

export async function GET(request: NextRequest) {
  const requestId = `models-${Date.now()}`;
  logger.api.info('Fetching available models', { requestId });

  const searchParams = request.nextUrl.searchParams;
  const provider = searchParams.get('provider') || 'all';
  const apiKey = request.headers.get('X-OpenRouter-API-Key') || process.env.OPENROUTER_API_KEY;

  const results: {
    anthropic: ModelInfo[];
    openrouter: ModelInfo[];
    error?: string;
  } = {
    anthropic: [],
    openrouter: [],
  };

  // Always include Anthropic models
  if (provider === 'all' || provider === 'anthropic') {
    results.anthropic = ANTHROPIC_MODELS;
    logger.api.debug(`Added ${ANTHROPIC_MODELS.length} Anthropic models`, { requestId });
  }

  // Fetch OpenRouter models if requested
  if (provider === 'all' || provider === 'openrouter') {
    try {
      logger.api.debug('Fetching OpenRouter models from API', { requestId });
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers,
        // Cache for 5 minutes
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        results.openrouter = data.data
          .filter((model: OpenRouterModel) => {
            // Filter to only text-capable models
            const modality = model.architecture?.modality || '';
            return modality.includes('text');
          })
          .map((model: OpenRouterModel): ModelInfo => ({
            id: model.id,
            name: model.name || model.id,
            provider: model.id.split('/')[0] || 'Unknown',
            contextLength: model.context_length || model.top_provider?.context_length || 4096,
            maxOutput: model.top_provider?.max_completion_tokens || 4096,
            inputCost: parseFloat(model.pricing?.prompt || '0') * 1000000,
            outputCost: parseFloat(model.pricing?.completion || '0') * 1000000,
            modality: model.architecture?.modality || 'text→text',
          }))
          .sort((a: ModelInfo, b: ModelInfo) => {
            // Sort by provider, then by name
            if (a.provider !== b.provider) {
              return a.provider.localeCompare(b.provider);
            }
            return a.name.localeCompare(b.name);
          });

        logger.api.info(`Fetched ${results.openrouter.length} OpenRouter models`, { requestId });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.api.error('Failed to fetch OpenRouter models', { requestId, error: errorMessage });
      results.error = `Failed to fetch OpenRouter models: ${errorMessage}`;
    }
  }

  return NextResponse.json(results);
}

