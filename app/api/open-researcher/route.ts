import { NextRequest, NextResponse } from 'next/server'
import { performResearchWithStreaming, setAgentConfig, type LLMProvider } from '@/lib/open-researcher-agent'
import logger, { generateRequestId } from '@/lib/logger'

// Route segment configuration for Next.js 15+
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for long-running research

export async function POST(req: NextRequest) {
  const requestId = generateRequestId()
  const timer = logger.startTimer('research-request')
  
  try {
    const { query } = await req.json()

    if (!query) {
      logger.api.warn('Missing query parameter', { requestId })
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    logger.api.info('Research request received', { 
      requestId, 
      data: { queryLength: query.length } 
    })

    // Get configuration from headers
    const llmProvider = (req.headers.get('X-LLM-Provider') || 'anthropic') as LLMProvider
    const selectedModel = req.headers.get('X-LLM-Model') || 'claude-opus-4-5-20251101'
    const openRouterApiKey = req.headers.get('X-OpenRouter-API-Key') || process.env.OPENROUTER_API_KEY
    const firecrawlBaseUrl = req.headers.get('X-Firecrawl-Base-URL') || process.env.FIRECRAWL_BASE_URL

    logger.api.debug('Request configuration', { 
      requestId,
      data: { 
        llmProvider, 
        selectedModel,
        hasOpenRouterKey: !!openRouterApiKey,
        firecrawlBaseUrl: firecrawlBaseUrl || 'default'
      } 
    })

    // Check for required API keys based on provider
    if (llmProvider === 'anthropic') {
      if (!process.env.ANTHROPIC_API_KEY) {
        logger.api.error('Anthropic API key not configured', { requestId })
        return NextResponse.json(
          { error: 'ANTHROPIC_API_KEY is not configured. Please add it to your Vercel environment variables.' },
          { status: 500 }
        )
      }
    } else if (llmProvider === 'openrouter') {
      if (!openRouterApiKey) {
        logger.api.error('OpenRouter API key not configured', { requestId })
        return NextResponse.json(
          { error: 'OpenRouter API key is not configured. Please add it via the Admin Panel or environment variables.' },
          { status: 500 }
        )
      }
    }

    // Get Firecrawl API key from headers first, then fall back to environment variables
    const rawFirecrawlApiKey = req.headers.get('X-Firecrawl-API-Key') || process.env.FIRECRAWL_API_KEY

    if (!rawFirecrawlApiKey) {
      logger.api.error('Firecrawl API key not configured', { requestId })
      return NextResponse.json(
        { error: 'FIRECRAWL_API_KEY is not configured. Please add it via the interface.' },
        { status: 500 }
      )
    }

    // Trim whitespace from API key (common copy-paste issue)
    const firecrawlApiKey = rawFirecrawlApiKey.trim()

    if (!firecrawlApiKey) {
      return NextResponse.json(
        { error: 'Firecrawl API key is empty. Please provide a valid API key.' },
        { status: 400 }
      )
    }

    // For cloud Firecrawl, validate API key format
    const isSelfHosted = firecrawlBaseUrl && !firecrawlBaseUrl.includes('api.firecrawl.dev')
    if (!isSelfHosted && !firecrawlApiKey.startsWith('fc-')) {
      logger.api.warn('Invalid Firecrawl API key format', { requestId })
      return NextResponse.json(
        { error: 'Invalid Firecrawl API key format. Keys should start with "fc-". Please check your API key.' },
        { status: 400 }
      )
    }

    // Set Firecrawl API key as environment variable for the agent to use
    process.env.FIRECRAWL_API_KEY = firecrawlApiKey
    if (firecrawlBaseUrl) {
      process.env.FIRECRAWL_BASE_URL = firecrawlBaseUrl
    }

    // Configure the agent
    setAgentConfig({
      provider: llmProvider,
      model: selectedModel,
      openRouterApiKey: openRouterApiKey || undefined,
      firecrawlBaseUrl: firecrawlBaseUrl || undefined,
    })

    logger.api.info('Starting research stream', { requestId })

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Perform research with streaming events
          const finalResponse = await performResearchWithStreaming(query, (event) => {
            // Add timestamp and request ID to events
            const eventWithMetadata = { 
              ...event, 
              timestamp: Date.now(),
              requestId 
            }
            
            // Send event as SSE
            const data = `data: ${JSON.stringify({ type: 'event', event: eventWithMetadata })}\n\n`
            controller.enqueue(encoder.encode(data))
          })

          // Send final response
          if (finalResponse) {
            const responseData = `data: ${JSON.stringify({ type: 'response', content: finalResponse })}\n\n`
            controller.enqueue(encoder.encode(responseData))
          }

          // Send done event
          const doneData = `data: ${JSON.stringify({ type: 'done', requestId })}\n\n`
          controller.enqueue(encoder.encode(doneData))
          
          const duration = timer()
          logger.api.info('Research stream completed', { requestId, duration })
          
          controller.close()
        } catch (error) {
          const duration = timer()
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          const errorDetails = error instanceof Error && error.stack ? error.stack : ''
          
          logger.api.error('Research stream failed', { 
            requestId, 
            duration,
            error: error instanceof Error ? error : String(error)
          })
          
          // More user-friendly error messages
          let userFriendlyError = errorMessage
          if (errorMessage.includes('Model error')) {
            userFriendlyError = `The ${selectedModel} model is not available. This might be due to regional restrictions or API tier limitations.`
          } else if (errorMessage.includes('Beta feature error')) {
            userFriendlyError = 'The interleaved thinking feature is not enabled for your Anthropic API key. This is a beta feature that may require special access.'
          } else if (errorMessage.includes('Authentication error')) {
            userFriendlyError = `Invalid ${llmProvider === 'anthropic' ? 'Anthropic' : 'OpenRouter'} API key. Please check your configuration.`
          } else if (errorMessage.includes('OpenRouter')) {
            userFriendlyError = `OpenRouter error: ${errorMessage}`
          }
          
          const errorData = `data: ${JSON.stringify({ 
            type: 'error', 
            error: userFriendlyError,
            originalError: errorMessage,
            requestId,
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
          })}\n\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Request-Id': requestId,
      },
    })
  } catch (error) {
    const duration = timer()
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.api.error('API route error', { 
      requestId, 
      duration,
      error: error instanceof Error ? error : String(error)
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        requestId,
        hint: 'Check the Vercel function logs for more details'
      },
      { status: 500 }
    )
  }
}
