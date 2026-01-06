import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

// Route segment configuration for Next.js 15+
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface EnvironmentStatus {
  ANTHROPIC_API_KEY: boolean;
  FIRECRAWL_API_KEY: boolean;
  OPENROUTER_API_KEY: boolean;
  FIRECRAWL_BASE_URL: string | null;
  FIRESTARTER_DISABLE_CREATION_DASHBOARD: boolean;
  AUTH_PASSWORD_SET: boolean;
}

export interface EnvCheckResponse {
  environmentStatus: EnvironmentStatus;
  anthropicKeyPrefix?: string;
  firecrawlKeyPrefix?: string;
  openrouterKeyPrefix?: string;
  firecrawlBaseUrl?: string;
  isFirecrawlSelfHosted?: boolean;
  nodeEnv?: string;
}

export async function GET() {
  const requestId = `env-${Date.now()}`;
  
  logger.system.debug('Checking environment configuration', { requestId });

  const environmentStatus: EnvironmentStatus = {
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    FIRECRAWL_API_KEY: !!process.env.FIRECRAWL_API_KEY,
    OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    FIRECRAWL_BASE_URL: process.env.FIRECRAWL_BASE_URL || null,
    FIRESTARTER_DISABLE_CREATION_DASHBOARD: process.env.FIRESTARTER_DISABLE_CREATION_DASHBOARD === 'true',
    AUTH_PASSWORD_SET: !!process.env.AUTH_PASSWORD,
  };

  // Determine if Firecrawl is self-hosted
  const firecrawlBaseUrl = process.env.FIRECRAWL_BASE_URL;
  const isFirecrawlSelfHosted = firecrawlBaseUrl 
    ? !firecrawlBaseUrl.includes('api.firecrawl.dev') 
    : false;

  // Add debug info (only in development)
  const debugInfo = process.env.NODE_ENV === 'development' ? {
    anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY 
      ? process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...' 
      : 'NOT SET',
    firecrawlKeyPrefix: process.env.FIRECRAWL_API_KEY 
      ? process.env.FIRECRAWL_API_KEY.substring(0, 10) + '...' 
      : 'NOT SET',
    openrouterKeyPrefix: process.env.OPENROUTER_API_KEY 
      ? process.env.OPENROUTER_API_KEY.substring(0, 8) + '...' 
      : 'NOT SET',
    firecrawlBaseUrl: firecrawlBaseUrl || 'https://api.firecrawl.dev (default)',
    isFirecrawlSelfHosted,
    nodeEnv: process.env.NODE_ENV
  } : {
    // Always include these for client-side detection
    firecrawlBaseUrl: firecrawlBaseUrl || undefined,
    isFirecrawlSelfHosted,
  };

  logger.system.info('Environment check complete', { 
    requestId,
    data: {
      hasAnthropic: environmentStatus.ANTHROPIC_API_KEY,
      hasFirecrawl: environmentStatus.FIRECRAWL_API_KEY,
      hasOpenRouter: environmentStatus.OPENROUTER_API_KEY,
      isFirecrawlSelfHosted,
    }
  });

  const response: EnvCheckResponse = { 
    environmentStatus,
    ...debugInfo
  };

  return NextResponse.json(response);
}
