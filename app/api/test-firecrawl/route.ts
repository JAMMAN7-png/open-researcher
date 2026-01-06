import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import logger from '@/lib/logger';

// Route segment configuration for Next.js 15+
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FirecrawlClientConfig {
  apiKey: string;
  apiUrl?: string;
}

export async function GET(request: NextRequest) {
  const requestId = `fc-get-${Date.now()}`;
  const timer = logger.startTimer('firecrawl-test-get');
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || 'AI breakthroughs 2025';
  
  // Get API key and base URL
  const apiKey = request.headers.get('X-Firecrawl-API-Key') || process.env.FIRECRAWL_API_KEY;
  const baseUrl = request.headers.get('X-Firecrawl-Base-URL') || process.env.FIRECRAWL_BASE_URL;
  
  logger.firecrawl.info('Testing Firecrawl connection (GET)', { 
    requestId, 
    data: { 
      query,
      hasApiKey: !!apiKey,
      baseUrl: baseUrl || 'default (api.firecrawl.dev)'
    } 
  });
  
  if (!apiKey) {
    logger.firecrawl.warn('No Firecrawl API key provided', { requestId });
    return NextResponse.json({ 
      success: false,
      error: 'No Firecrawl API key configured',
      hint: 'Set FIRECRAWL_API_KEY in .env.local or pass X-Firecrawl-API-Key header'
    }, { status: 400 });
  }

  try {
    logger.firecrawl.debug('Creating Firecrawl client', { 
      requestId, 
      data: { apiKeyPrefix: apiKey.substring(0, 10) + '...', baseUrl } 
    });
    
    const clientConfig: FirecrawlClientConfig = { apiKey: apiKey.trim() };
    if (baseUrl) {
      clientConfig.apiUrl = baseUrl;
    }
    
    const firecrawl = new FirecrawlApp(clientConfig);
    
    logger.firecrawl.debug('Executing search', { requestId, data: { query } });
    
    // Try the search
    const searchResult = await firecrawl.search(query, {
      limit: 3,
      lang: 'en',
      country: 'us'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    
    const duration = timer();
    
    // Determine result count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultData = (searchResult as any)?.data || (searchResult as any)?.web || searchResult;
    const resultCount = Array.isArray(resultData) ? resultData.length : 0;
    
    logger.firecrawl.info('Firecrawl test successful', { 
      requestId, 
      duration,
      data: { resultCount } 
    });
    
    return NextResponse.json({
      success: true,
      query,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      baseUrl: baseUrl || 'https://api.firecrawl.dev',
      isSelfHosted: !!baseUrl && !baseUrl.includes('api.firecrawl.dev'),
      resultType: typeof searchResult,
      resultCount,
      result: searchResult
    });
  } catch (error) {
    const duration = timer();
    
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: (error as any)?.response?.status || (error as any)?.status || null
    };
    
    logger.firecrawl.error('Firecrawl test failed', { 
      requestId, 
      duration,
      error: error instanceof Error ? error : String(error),
      data: errorDetails
    });
    
    return NextResponse.json({
      success: false,
      query,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      baseUrl: baseUrl || 'https://api.firecrawl.dev',
      error: errorDetails
    }, { status: 500 });
  }
}

// POST endpoint for testing connection with custom settings
export async function POST(request: NextRequest) {
  const requestId = `fc-post-${Date.now()}`;
  const timer = logger.startTimer('firecrawl-test-post');

  try {
    const body = await request.json();
    const { apiKey, baseUrl, selfHosted } = body;
    
    // Get effective API key and base URL
    const effectiveApiKey = apiKey || process.env.FIRECRAWL_API_KEY;
    const effectiveBaseUrl = selfHosted && baseUrl 
      ? baseUrl 
      : (process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev');
    
    logger.firecrawl.info('Testing Firecrawl connection (POST)', { 
      requestId, 
      data: { 
        hasApiKey: !!effectiveApiKey,
        baseUrl: effectiveBaseUrl,
        isSelfHosted: selfHosted
      } 
    });

    if (!effectiveApiKey) {
      logger.firecrawl.warn('No Firecrawl API key provided', { requestId });
      return NextResponse.json({
        success: false,
        error: 'Firecrawl API key is required.',
      }, { status: 400 });
    }

    // For self-hosted, the API key format might differ
    if (!selfHosted && !effectiveApiKey.startsWith('fc-')) {
      logger.firecrawl.warn('Invalid API key format for cloud Firecrawl', { requestId });
      return NextResponse.json({
        success: false,
        error: 'Cloud Firecrawl API keys should start with "fc-". For self-hosted, enable the self-hosted option.',
      }, { status: 400 });
    }

    logger.firecrawl.debug('Creating Firecrawl client', { 
      requestId, 
      data: { apiKeyPrefix: effectiveApiKey.substring(0, 10) + '...', baseUrl: effectiveBaseUrl } 
    });

    const clientConfig: FirecrawlClientConfig = { apiKey: effectiveApiKey.trim() };
    if (effectiveBaseUrl && effectiveBaseUrl !== 'https://api.firecrawl.dev') {
      clientConfig.apiUrl = effectiveBaseUrl;
    }

    const firecrawl = new FirecrawlApp(clientConfig);

    // Test with a simple scrape to verify connection
    logger.firecrawl.debug('Testing with scrape request', { requestId });
    
    const testResult = await firecrawl.scrape('https://example.com', {
      formats: ['markdown']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const duration = timer();
    
    // Check if scrape was successful
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const success = (testResult as any)?.success !== false;
    
    if (success) {
      logger.firecrawl.info('Firecrawl connection test passed', { 
        requestId, 
        duration,
        data: { 
          baseUrl: effectiveBaseUrl,
          isSelfHosted: selfHosted 
        } 
      });

      return NextResponse.json({
        success: true,
        message: selfHosted 
          ? 'Self-hosted Firecrawl connection successful' 
          : 'Firecrawl cloud connection successful',
        baseUrl: effectiveBaseUrl,
        isSelfHosted: selfHosted,
        apiKeyPrefix: effectiveApiKey.substring(0, Math.min(10, effectiveApiKey.length)) + '...',
      });
    } else {
      logger.firecrawl.warn('Firecrawl test returned unsuccessful', { 
        requestId, 
        duration,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { result: testResult as any } 
      });

      return NextResponse.json({
        success: false,
        error: 'Firecrawl connection test failed. Please check your settings.',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details: (testResult as any)?.error,
      }, { status: 500 });
    }

  } catch (error) {
    const duration = timer();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.firecrawl.error('Firecrawl test failed', { 
      requestId, 
      duration,
      error: error instanceof Error ? error : String(error)
    });

    // Check for specific error types
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid token') || errorMessage.includes('401')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid API key. Please check your Firecrawl API key.',
      }, { status: 401 });
    }

    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      return NextResponse.json({
        success: false,
        error: 'Could not connect to Firecrawl server. Please check the URL is correct and the server is running.',
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      error: `Firecrawl connection failed: ${errorMessage}`,
    }, { status: 500 });
  }
}
