import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import logger from '@/lib/logger';

// Route segment configuration for Next.js 15+
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ApiError extends Error {
  status?: number;
}

interface FirecrawlConfig {
  apiKey: string;
  apiUrl?: string;
}

export async function POST(request: NextRequest) {
  const requestId = `validate-${Date.now()}`;
  const timer = logger.startTimer('validate-key');
  
  logger.auth.info('Key validation request received', { requestId });

  try {
    const body = await request.json();
    const { apiKey: rawApiKey, baseUrl, selfHosted } = body;

    if (!rawApiKey) {
      logger.auth.warn('No API key provided for validation', { requestId });
      return NextResponse.json({
        valid: false,
        error: 'API key is required'
      }, { status: 400 });
    }

    // Trim whitespace
    const apiKey = rawApiKey.trim();

    if (!apiKey) {
      return NextResponse.json({
        valid: false,
        error: 'API key is empty after trimming whitespace'
      }, { status: 400 });
    }

    // For cloud Firecrawl, validate format
    const isSelfHosted = selfHosted || (baseUrl && !baseUrl.includes('api.firecrawl.dev'));
    if (!isSelfHosted && !apiKey.startsWith('fc-')) {
      logger.auth.warn('Invalid API key format for cloud Firecrawl', { requestId });
      return NextResponse.json({
        valid: false,
        error: 'Invalid API key format. Cloud Firecrawl keys should start with "fc-"'
      }, { status: 400 });
    }

    logger.auth.debug('Validating API key', { 
      requestId,
      data: { 
        keyPrefix: apiKey.substring(0, 8) + '...',
        baseUrl: baseUrl || 'default',
        isSelfHosted
      }
    });

    // Build Firecrawl config
    const config: FirecrawlConfig = { apiKey };
    if (baseUrl) {
      config.apiUrl = baseUrl;
    }

    // Test the API key with a simple search
    const app = new FirecrawlApp(config);

    // Use a minimal search to test the key
    const result = await app.search('test', { limit: 1 });

    if (result && 'success' in result && result.success === false) {
      logger.auth.warn('API key validation failed', { requestId });
      return NextResponse.json({
        valid: false,
        error: 'API key validation failed. Please check your key.'
      }, { status: 401 });
    }

    const duration = timer();
    logger.auth.info('API key validated successfully', { requestId, duration });

    return NextResponse.json({
      valid: true,
      message: isSelfHosted ? 'Self-hosted Firecrawl API key is valid' : 'Firecrawl API key is valid'
    });

  } catch (error: unknown) {
    const duration = timer();
    const err = error as ApiError;
    const errorMessage = err.message || 'Unknown error';

    logger.auth.error('API key validation failed', { 
      requestId, 
      duration,
      error: error instanceof Error ? error : String(error)
    });

    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid token')) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid API key. Please check your Firecrawl API key and try again.'
      }, { status: 401 });
    }

    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      return NextResponse.json({
        valid: false,
        error: 'Could not connect to Firecrawl server. Please check the URL is correct and the server is running.'
      }, { status: 503 });
    }

    return NextResponse.json({
      valid: false,
      error: `Validation error: ${errorMessage}`
    }, { status: 500 });
  }
}
