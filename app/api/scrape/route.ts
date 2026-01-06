import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';

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
  // Get API key from environment or header
  const rawApiKey = process.env.FIRECRAWL_API_KEY || request.headers.get('X-Firecrawl-API-Key');

  if (!rawApiKey) {
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

  // Validate API key format
  if (!apiKey.startsWith('fc-')) {
    return NextResponse.json({
      success: false,
      error: 'Invalid Firecrawl API key format. Keys should start with "fc-".'
    }, { status: 400 });
  }

  try {
    const app = new FirecrawlApp({ apiKey });
    const body = await request.json() as ScrapeRequestBody;
    const { url, urls, ...params } = body;

    let result: ScrapeResult;

    if (url && typeof url === 'string') {
      result = await app.scrape(url, params) as unknown as ScrapeResult;
    } else if (urls && Array.isArray(urls)) {
      result = await app.batchScrape(urls, params) as unknown as ScrapeResult;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid request format. Please check your input and try again.' }, { status: 400 });
    }
    
    return NextResponse.json(result);

  } catch (error: unknown) {
    const err = error as ApiError;
    const errorStatus = typeof err.status === 'number' ? err.status : 500;
    const errorMessage = err.message || 'Unknown error';

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