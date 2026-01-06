import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import logger from '@/lib/logger';

// Route segment configuration for Next.js 15+
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for scraping operations

interface ScrapeRequestBody {
  url?: string;
  urls?: string[];
  [key: string]: unknown;
}

interface ScrapeResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

interface ApiError extends Error {
  status?: number;
}

export async function POST(request: NextRequest) {
  const requestId = `scrape-${Date.now()}`;
  const timer = logger.startTimer('scrape-request');
  
  logger.firecrawl.info('Scrape request received', { requestId });

  // Get API key from environment or header
  const rawApiKey = process.env.FIRECRAWL_API_KEY || request.headers.get('X-Firecrawl-API-Key');
  const baseUrl = request.headers.get('X-Firecrawl-Base-URL') || process.env.FIRECRAWL_BASE_URL;

  if (!rawApiKey) {
    logger.firecrawl.warn('No API key provided', { requestId });
    return NextResponse.json({
      success: false,
      error: 'Firecrawl API key is not configured. Please add it via the interface.'
    }, { status: 500 });
  }

  // Trim whitespace from API key (common copy-paste issue)
  const apiKey = rawApiKey.trim();

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'Firecrawl API key is empty. Please provide a valid API key.'
    }, { status: 400 });
  }

  // For cloud Firecrawl, validate API key format
  const isSelfHosted = baseUrl && !baseUrl.includes('api.firecrawl.dev');
  if (!isSelfHosted && !apiKey.startsWith('fc-')) {
    logger.firecrawl.warn('Invalid API key format for cloud Firecrawl', { requestId });
    return NextResponse.json({
      success: false,
      error: 'Invalid Firecrawl API key format. Keys should start with "fc-".'
    }, { status: 400 });
  }

  try {
    interface FirecrawlConfig {
      apiKey: string;
      apiUrl?: string;
    }
    
    const config: FirecrawlConfig = { apiKey };
    if (baseUrl) {
      config.apiUrl = baseUrl;
    }
    
    logger.firecrawl.debug('Creating Firecrawl client', { 
      requestId,
      data: { baseUrl: baseUrl || 'default', isSelfHosted }
    });
    
    const app = new FirecrawlApp(config);
    const body = await request.json() as ScrapeRequestBody;
    const { url, urls, ...params } = body;

    let result: ScrapeResult;

    if (url && typeof url === 'string') {
      logger.firecrawl.info('Scraping single URL', { requestId, data: { url } });
      result = await app.scrape(url, params) as unknown as ScrapeResult;
    } else if (urls && Array.isArray(urls)) {
      logger.firecrawl.info('Batch scraping URLs', { requestId, data: { count: urls.length } });
      result = await app.batchScrape(urls, params) as unknown as ScrapeResult;
    } else {
      logger.firecrawl.warn('Invalid request format', { requestId });
      return NextResponse.json({ success: false, error: 'Invalid request format. Please check your input and try again.' }, { status: 400 });
    }
    
    const duration = timer();
    logger.firecrawl.info('Scrape completed', { requestId, duration });
    
    return NextResponse.json(result);

  } catch (error: unknown) {
    const duration = timer();
    const err = error as ApiError;
    const errorStatus = typeof err.status === 'number' ? err.status : 500;
    const errorMessage = err.message || 'Unknown error';

    logger.firecrawl.error('Scrape failed', { 
      requestId, 
      duration,
      error: error instanceof Error ? error : String(error)
    });

    // Check for specific Firecrawl errors
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid token')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Firecrawl API key. Please check your API key and try again. You can get a key at firecrawl.dev'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: `Firecrawl error: ${errorMessage}`
    }, { status: errorStatus });
  }
} 