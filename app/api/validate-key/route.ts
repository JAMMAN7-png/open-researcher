import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';

// Route segment configuration for Next.js 15+
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ApiError extends Error {
  status?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey: rawApiKey } = await request.json();

    if (!rawApiKey) {
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

    // Validate format
    if (!apiKey.startsWith('fc-')) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid API key format. Firecrawl keys should start with "fc-"'
      }, { status: 400 });
    }

    // Test the API key with a simple search
    const app = new FirecrawlApp({ apiKey });

    // Use a minimal search to test the key
    const result = await app.search('test', { limit: 1 });

    if (result && 'success' in result && result.success === false) {
      return NextResponse.json({
        valid: false,
        error: 'API key validation failed. Please check your key.'
      }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      message: 'API key is valid'
    });

  } catch (error: unknown) {
    const err = error as ApiError;
    const errorMessage = err.message || 'Unknown error';

    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid token')) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid API key. Please check your Firecrawl API key and try again.'
      }, { status: 401 });
    }

    return NextResponse.json({
      valid: false,
      error: `Validation error: ${errorMessage}`
    }, { status: 500 });
  }
}
