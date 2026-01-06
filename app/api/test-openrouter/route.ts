import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

// Route segment configuration for Next.js 15+
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

interface OpenRouterModelsResponse {
  data: Array<{
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    pricing?: {
      prompt: string;
      completion: string;
    };
  }>;
}

export async function POST(request: NextRequest) {
  const requestId = `or-${Date.now()}`;
  const timer = logger.startTimer('openrouter-test');

  logger.openrouter.info('Testing OpenRouter connection', { requestId });

  try {
    const body = await request.json();
    const { apiKey, model } = body;

    // Get API key from request body or environment
    const effectiveApiKey = apiKey || process.env.OPENROUTER_API_KEY;

    if (!effectiveApiKey) {
      logger.openrouter.warn('No OpenRouter API key provided', { requestId });
      return NextResponse.json({
        success: false,
        error: 'OpenRouter API key is required. Please provide it in the settings.',
      }, { status: 400 });
    }

    // Test the connection by fetching available models
    logger.openrouter.debug('Fetching OpenRouter models', { requestId });
    
    const modelsResponse = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${effectiveApiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Open Researcher',
      },
    });

    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      logger.openrouter.error('OpenRouter API error', { 
        requestId, 
        data: { status: modelsResponse.status, error: errorText } 
      });
      
      if (modelsResponse.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'Invalid OpenRouter API key. Please check your key and try again.',
        }, { status: 401 });
      }
      
      return NextResponse.json({
        success: false,
        error: `OpenRouter API error: ${errorText}`,
      }, { status: modelsResponse.status });
    }

    const modelsData: OpenRouterModelsResponse = await modelsResponse.json();
    const duration = timer();

    logger.openrouter.info('OpenRouter connection successful', { 
      requestId, 
      duration,
      data: { modelsCount: modelsData.data?.length || 0 } 
    });

    // If a specific model was requested, verify it exists
    let modelInfo: OpenRouterModel | null = null;
    if (model && modelsData.data) {
      modelInfo = modelsData.data.find(m => m.id === model) || null;
      if (!modelInfo) {
        logger.openrouter.warn('Requested model not found', { 
          requestId, 
          data: { model } 
        });
      }
    }

    // Return top models for selection
    const popularModels = modelsData.data
      ?.filter(m => 
        m.id.includes('claude') || 
        m.id.includes('gpt-4') || 
        m.id.includes('gemini') ||
        m.id.includes('llama') ||
        m.id.includes('mistral') ||
        m.id.includes('deepseek')
      )
      .slice(0, 20)
      .map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        context_length: m.context_length,
        pricing: m.pricing,
      })) || [];

    return NextResponse.json({
      success: true,
      message: 'OpenRouter connection successful',
      modelsCount: modelsData.data?.length || 0,
      popularModels,
      requestedModel: modelInfo,
    });

  } catch (error) {
    const duration = timer();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.openrouter.error('OpenRouter test failed', { 
      requestId, 
      duration,
      error: error instanceof Error ? error : String(error) 
    });

    return NextResponse.json({
      success: false,
      error: `Failed to connect to OpenRouter: ${errorMessage}`,
    }, { status: 500 });
  }
}

// GET endpoint to check if OpenRouter is configured
export async function GET() {
  const hasEnvKey = !!process.env.OPENROUTER_API_KEY;
  
  logger.openrouter.debug('Checking OpenRouter configuration', {
    data: { hasEnvKey }
  });

  return NextResponse.json({
    configured: hasEnvKey,
    keyPrefix: hasEnvKey 
      ? process.env.OPENROUTER_API_KEY?.substring(0, 8) + '...' 
      : null,
  });
}

