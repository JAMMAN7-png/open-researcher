import Anthropic from '@anthropic-ai/sdk';
import FirecrawlApp from '@mendable/firecrawl-js';
import logger, { generateRequestId } from './logger';

// Type for LLM provider
export type LLMProvider = 'anthropic' | 'openrouter';

// Configuration interface
export interface AgentConfig {
  provider: LLMProvider;
  model: string;
  openRouterApiKey?: string;
  firecrawlBaseUrl?: string;
}

// Default configuration
const defaultConfig: AgentConfig = {
  provider: 'anthropic',
  model: 'claude-opus-4-5-20251101',
};

// Current configuration (can be set per request)
let currentConfig: AgentConfig = { ...defaultConfig };

// Lazy initialization for Vercel deployment
let anthropic: Anthropic | null = null;
let firecrawl: FirecrawlApp | null = null;
let firecrawlApiKeyUsed: string | null = null;
let firecrawlBaseUrlUsed: string | null = null;

export function setAgentConfig(config: Partial<AgentConfig>) {
  currentConfig = { ...currentConfig, ...config };
  logger.agent.info('Agent configuration updated', {
    data: {
      provider: currentConfig.provider,
      model: currentConfig.model,
      hasOpenRouterKey: !!currentConfig.openRouterApiKey,
      firecrawlBaseUrl: currentConfig.firecrawlBaseUrl,
    }
  });
}

export function getAgentConfig(): AgentConfig {
  return { ...currentConfig };
}

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.anthropic.error('ANTHROPIC_API_KEY not set');
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    logger.anthropic.info('Initializing Anthropic client');
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

interface FirecrawlClientConfig {
  apiKey: string;
  apiUrl?: string;
}

function getFirecrawlClient(): FirecrawlApp {
  const rawApiKey = process.env.FIRECRAWL_API_KEY;
  if (!rawApiKey) {
    logger.firecrawl.error('FIRECRAWL_API_KEY not set');
    throw new Error('FIRECRAWL_API_KEY environment variable is not set');
  }

  // Trim whitespace from API key (common copy-paste issue)
  const apiKey = rawApiKey.trim();

  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY is empty after trimming');
  }

  // Get base URL from config or environment
  const baseUrl = currentConfig.firecrawlBaseUrl || process.env.FIRECRAWL_BASE_URL;
  
  // For cloud Firecrawl, validate API key format
  const isSelfHosted = baseUrl && !baseUrl.includes('api.firecrawl.dev');
  if (!isSelfHosted && !apiKey.startsWith('fc-')) {
    throw new Error('Invalid Firecrawl API key format. Keys should start with "fc-"');
  }

  // Recreate client if API key or base URL has changed
  if (!firecrawl || firecrawlApiKeyUsed !== apiKey || firecrawlBaseUrlUsed !== baseUrl) {
    const clientConfig: FirecrawlClientConfig = { apiKey };
    if (baseUrl) {
      clientConfig.apiUrl = baseUrl;
    }
    
    logger.firecrawl.info('Initializing Firecrawl client', {
      data: {
        baseUrl: baseUrl || 'https://api.firecrawl.dev',
        isSelfHosted,
      }
    });
    
    firecrawl = new FirecrawlApp(clientConfig);
    firecrawlApiKeyUsed = apiKey;
    firecrawlBaseUrlUsed = baseUrl || null;
  }
  return firecrawl;
}

// OpenRouter API call helper
interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: string; text?: string; tool_use_id?: string; content?: string }>;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function callOpenRouter(
  messages: OpenRouterMessage[],
  systemPrompt: string,
  tools: ToolDefinition[],
  requestId: string
): Promise<OpenRouterResponse> {
  const apiKey = currentConfig.openRouterApiKey || process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }

  const timer = logger.startTimer('openrouter-call');
  
  logger.openrouter.debug('Making OpenRouter API call', {
    requestId,
    data: {
      model: currentConfig.model,
      messageCount: messages.length,
      toolCount: tools.length,
    }
  });

  // Convert our tool definitions to OpenAI format
  const openaiTools = tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    }
  }));

  // Convert messages to OpenAI format
  const openaiMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.map(m => {
      if (typeof m.content === 'string') {
        return { role: m.role, content: m.content };
      }
      // Handle tool results
      const toolResults = m.content.filter(c => c.type === 'tool_result');
      if (toolResults.length > 0) {
        return {
          role: 'tool' as const,
          tool_call_id: toolResults[0].tool_use_id,
          content: toolResults[0].content || '',
        };
      }
      // Flatten text content
      const textContent = m.content.filter(c => c.type === 'text').map(c => c.text).join('');
      return { role: m.role, content: textContent };
    })
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Open Researcher',
    },
    body: JSON.stringify({
      model: currentConfig.model,
      messages: openaiMessages,
      tools: openaiTools,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.openrouter.error('OpenRouter API error', {
      requestId,
      data: { status: response.status, error: errorText }
    });
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const result: OpenRouterResponse = await response.json();
  const duration = timer();
  
  logger.openrouter.info('OpenRouter call complete', {
    requestId,
    duration,
    data: {
      model: result.model,
      finishReason: result.choices[0]?.finish_reason,
      usage: result.usage,
    }
  });

  return result;
}

// Type definitions
interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface FirecrawlSearchResultItem {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
  links?: string[];
  screenshot?: string;
  position?: number;
  metadata?: {
    title?: string;
    description?: string;
  };
}

interface FirecrawlSearchResult {
  success?: boolean;
  // Old API format
  data?: Array<FirecrawlSearchResultItem>;
  // New API format (v4+)
  web?: Array<FirecrawlSearchResultItem>;
  error?: string;
}

interface FirecrawlScrapeResult {
  success?: boolean;
  data?: {
    url?: string;
    markdown?: string;
    links?: string[];
    screenshot?: string;
    metadata?: {
      title?: string;
      description?: string;
    };
  };
  markdown?: string;
  links?: string[];
  screenshot?: string;
  metadata?: {
    title?: string;
    description?: string;
  };
  error?: string;
  statusCode?: number;
  message?: string;
}

// Define our research tools
const tools: ToolDefinition[] = [
  {
    name: "web_search",
    description: "Search the web and optionally scrape content from results. Supports Google search operators (site:, intitle:, etc.). Set scrape_content=true to extract full content. For listing/counting items, the search results preview is often sufficient.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        limit: {
          type: "number",
          description: "Number of results to return",
          default: 5
        },
        scrape_content: {
          type: "boolean",
          description: "Whether to scrape the content of search results",
          default: false
        },
        tbs: {
          type: "string",
          description: "Time-based search filter (e.g., 'qdr:w' for past week)",
          enum: ["qdr:h", "qdr:d", "qdr:w", "qdr:m", "qdr:y"]
        }
      },
      required: ["query"]
    }
  },
  {
    name: "deep_scrape",
    description: "Scrape a single URL and optionally follow its links for deeper analysis. Best for detailed research or when you need content from multiple linked pages. For simple queries, a single page scrape is usually sufficient.",
    input_schema: {
      type: "object",
      properties: {
        source_url: {
          type: "string",
          description: "The source URL to extract links from"
        },
        link_filter: {
          type: "string",
          description: "Regex pattern to filter which links to scrape (e.g., '/blog/', '/docs/')"
        },
        max_depth: {
          type: "number",
          description: "Maximum depth of links to follow (1 = direct links only)",
          default: 1
        },
        max_links: {
          type: "number",
          description: "Maximum number of links to scrape per level",
          default: 5
        },
        formats: {
          type: "array",
          items: { type: "string" },
          description: "Output formats for scraped content",
          default: ["markdown"]
        }
      },
      required: ["source_url"]
    }
  },
  {
    name: "analyze_content",
    description: "Analyze scraped content to extract specific information, patterns, or insights. Use this to process content you've already fetched rather than fetching more.",
    input_schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Content to analyze"
        },
        analysis_type: {
          type: "string",
          enum: ["sentiment", "key_facts", "trends", "summary", "credibility"],
          description: "Type of analysis to perform"
        },
        context: {
          type: "string",
          description: "Additional context for the analysis"
        }
      },
      required: ["content", "analysis_type"]
    }
  }
];

// Execute Firecrawl search with two-step approach
async function executeWebSearch(
  query: string, 
  limit: number = 5, 
  scrapeContent: boolean = false, 
  tbs?: string,
  requestId?: string
): Promise<{ content: string; screenshots: Array<{ url: string; screenshot?: string }> }> {
  const timer = logger.startTimer('web-search');
  
  logger.firecrawl.info('Executing web search', { 
    requestId,
    data: { query, limit, scrapeContent, tbs }
  });
  
  const screenshots: Array<{ url: string; screenshot?: string }> = [];
  
  try {
    // Convert tbs time filter to query modifier (Firecrawl doesn't support tbs parameter)
    let searchQuery = query;
    let hasTimeFilter = false;
    if (tbs) {
      hasTimeFilter = true;
      const timeModifiers: Record<string, string> = {
        'qdr:h': 'last hour',
        'qdr:d': 'today OR yesterday OR last 24 hours',
        'qdr:w': 'this week OR past week',
        'qdr:m': 'this month OR past month',
        'qdr:y': 'this year OR 2024 OR 2025'
      };
      const modifier = timeModifiers[tbs];
      if (modifier) {
        searchQuery = `${query} ${modifier}`;
      }
    }
    
    // Step 1: First search without scraping to get metadata
    const searchOptions = {
      limit,
      lang: 'en',
      country: 'us'
    };

    logger.firecrawl.debug('Firecrawl search request', { 
      requestId,
      data: { searchQuery, options: searchOptions }
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadataResults = await getFirecrawlClient().search(searchQuery, searchOptions as any) as FirecrawlSearchResult;
    
    logger.firecrawl.debug('Firecrawl search response', { 
      requestId,
      data: { 
        responseType: typeof metadataResults,
        keys: metadataResults ? Object.keys(metadataResults) : null 
      }
    });
    
    // Handle various Firecrawl API response formats
    let searchResults: FirecrawlSearchResultItem[] = [];
    
    if (Array.isArray(metadataResults)) {
      searchResults = metadataResults;
    } else if (metadataResults) {
      searchResults = metadataResults.data || metadataResults.web || 
        (metadataResults as Record<string, unknown>).results as FirecrawlSearchResultItem[] || [];
    }
    
    if (searchResults.length === 0) {
      logger.firecrawl.warn('No search results found', { requestId, data: { query: searchQuery } });
      
      if (metadataResults.error) {
        return { content: `Search failed: ${metadataResults.error}`, screenshots: [] };
      }
      
      return { content: "No search results found.", screenshots: [] };
    }
    
    logger.firecrawl.info('Search results received', { 
      requestId,
      data: { resultCount: searchResults.length }
    });

    let output = `Found ${searchResults.length} results:\n\n`;
    
    // Display all results with metadata
    for (const [index, result] of searchResults.entries()) {
      const title = result.title || result.metadata?.title || 'Untitled';
      const url = result.url || '';
      const description = result.description || result.metadata?.description || 'No description available';
      
      if (url) {
        output += `[${index + 1}] ${title}\n`;
        output += `URL: ${url}\n`;
        output += `Description: ${description}\n`;
        output += '\n';
      }
    }

    // Step 2: If scraping is requested, decide which URLs to scrape based on metadata
    if (scrapeContent) {
      const querySignals = {
        wantsRecent: /latest|recent|newest|new|today|yesterday|this week|this month/i.test(query),
        wantsBlog: /blog|post|article|news|update|announce/i.test(query),
        wantsDocs: /documentation|docs|api|reference|guide|tutorial|how to/i.test(query),
        hasTimeFilter: hasTimeFilter,
        hasSiteFilter: /site:/i.test(query)
      };
      
      const urlsToScrape = searchResults
        .filter((result, index) => {
          const text = `${result.title} ${result.description} ${result.url}`.toLowerCase();
          
          if (!querySignals.wantsRecent && !querySignals.wantsBlog && !querySignals.wantsDocs) {
            return index < Math.min(limit, 5);
          }
          
          if (querySignals.wantsRecent || querySignals.hasTimeFilter) {
            return true;
          }
          
          if (querySignals.wantsBlog || querySignals.wantsDocs) {
            try {
              const url = new URL(result.url!);
              const pathLower = url.pathname.toLowerCase();
              
              if (querySignals.wantsBlog && (pathLower.includes('blog') || pathLower.includes('post') || 
                  pathLower.includes('article') || pathLower.includes('news'))) {
                return true;
              }
              
              if (querySignals.wantsDocs && (pathLower.includes('doc') || pathLower.includes('api') || 
                  pathLower.includes('guide') || pathLower.includes('reference'))) {
                return true;
              }
            } catch { /* ignore URL parsing errors */ }
            
            if (querySignals.wantsBlog && /blog|post|article|published|wrote/i.test(text)) {
              return true;
            }
            
            if (querySignals.wantsDocs && /documentation|api|guide|tutorial|reference/i.test(text)) {
              return true;
            }
          }
          
          return index < 3;
        })
        .map(result => result.url);

      logger.firecrawl.debug('URLs selected for scraping', { 
        requestId,
        data: { count: urlsToScrape.length, urls: urlsToScrape.slice(0, 3) }
      });

      if (urlsToScrape.length > 0) {
        const scrapeSearchOptions = {
          limit,
          lang: 'en',
          country: 'us',
          scrapeOptions: {
            formats: ["markdown"] as const
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scrapedResults = await getFirecrawlClient().search(searchQuery, scrapeSearchOptions as any) as FirecrawlSearchResult;
        
        output += `\n--- SCRAPED CONTENT ---\n\n`;
        
        const scrapedWithMetadata = [];
        
        let scrapedData: FirecrawlSearchResultItem[] = [];
        if (Array.isArray(scrapedResults)) {
          scrapedData = scrapedResults;
        } else if (scrapedResults) {
          scrapedData = scrapedResults.data || scrapedResults.web || 
            (scrapedResults as Record<string, unknown>).results as FirecrawlSearchResultItem[] || [];
        }
        
        for (const [index, result] of scrapedData.entries()) {
          if (result.url && urlsToScrape.includes(result.url) && result.markdown) {
            if (result.screenshot) {
              screenshots.push({ url: result.url, screenshot: result.screenshot });
            }
            
            let dateFound = null;
            if (querySignals.wantsRecent || querySignals.wantsBlog) {
              const datePatterns = [
                /(\w+ \d{1,2}, \d{4})/g,
                /(\d{4}-\d{2}-\d{2})/g,
                /(\d{1,2}\/\d{1,2}\/\d{4})/g,
                /(\d{1,2} \w+ \d{4})/g
              ];
              
              const searchText = [
                result.markdown.substring(0, 1000),
                result.metadata?.description || '',
                result.metadata?.title || ''
              ].join(' ');
              
              for (const pattern of datePatterns) {
                const matches = searchText.match(pattern);
                if (matches && matches.length > 0) {
                  try {
                    const testDate = new Date(matches[0]);
                    if (!isNaN(testDate.getTime()) && testDate.getFullYear() >= 2020) {
                      dateFound = matches[0];
                      break;
                    }
                  } catch { /* ignore date parsing errors */ }
                }
              }
            }
            
            scrapedWithMetadata.push({
              ...result,
              index: index + 1,
              dateFound,
              relevanceScore: index
            });
          }
        }
        
        if (scrapedWithMetadata.length > 0) {
          scrapedWithMetadata.sort((a, b) => {
            if (querySignals.wantsRecent && (a.dateFound || b.dateFound)) {
              if (!a.dateFound && !b.dateFound) return a.relevanceScore - b.relevanceScore;
              if (!a.dateFound) return 1;
              if (!b.dateFound) return -1;
              
              try {
                const dateA = new Date(a.dateFound);
                const dateB = new Date(b.dateFound);
                return dateB.getTime() - dateA.getTime();
              } catch {
                return a.relevanceScore - b.relevanceScore;
              }
            }
            
            return a.relevanceScore - b.relevanceScore;
          });
        }
        
        for (const result of scrapedWithMetadata) {
          output += `[${result.index}] ${result.title} (SCRAPED)\n`;
          output += `URL: ${result.url}\n`;
          if (result.dateFound) {
            output += `Date: ${result.dateFound}\n`;
          }
          
          const preview = result.markdown ? result.markdown.substring(0, 500).replace(/\n+/g, ' ') : '';
          output += `Content preview: ${preview}...\n`;
          
          if (result.links && result.links.length > 0) {
            output += `Links found: ${result.links.length} (first 3: ${result.links.slice(0, 3).join(', ')})\n`;
          }
          
          output += '\n';
        }
      }
    }
    
    const duration = timer();
    logger.firecrawl.info('Web search complete', { 
      requestId, 
      duration,
      data: { resultCount: searchResults.length, screenshotCount: screenshots.length }
    });
    
    return { content: output, screenshots };
  } catch (error) {
    const duration = timer();
    logger.firecrawl.error('Web search failed', { 
      requestId, 
      duration,
      error: error instanceof Error ? error : String(error)
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { 
      content: `Error performing search: ${errorMessage}`,
      screenshots: []
    };
  }
}

// Analyze content with various methods
async function analyzeContent(content: string, analysisType: string, context?: string): Promise<string> {
  logger.agent.debug('Analyzing content', { data: { analysisType, contentLength: content.length } });
  
  switch (analysisType) {
    case 'sentiment':
      const positiveWords = ['success', 'growth', 'improve', 'innovation', 'breakthrough', 'leading', 'advanced'];
      const negativeWords = ['challenge', 'risk', 'concern', 'threat', 'decline', 'issue', 'problem'];
      
      const contentLower = content.toLowerCase();
      const positiveMatches = positiveWords.filter(word => contentLower.includes(word));
      const negativeMatches = negativeWords.filter(word => contentLower.includes(word));
      
      const sentiment = positiveMatches.length > negativeMatches.length ? 'Positive' : 
                       negativeMatches.length > positiveMatches.length ? 'Negative' : 'Neutral';
      
      return `Sentiment Analysis:\n` +
             `- Overall: ${sentiment}\n` +
             `- Positive indicators: ${positiveMatches.join(', ') || 'none'}\n` +
             `- Negative indicators: ${negativeMatches.join(', ') || 'none'}\n` +
             `- Context considered: ${context || 'general analysis'}`;

    case 'key_facts':
      const sentences = content.split(/[.!?]/).filter(s => s.trim());
      const keyFacts = sentences
        .filter(s => /\d+%|\$\d+|\d+ (million|billion)|first|largest|leading/i.test(s))
        .slice(0, 5)
        .map(s => s.trim());
      
      return `Key Facts Extracted:\n${keyFacts.map((fact, i) => `${i + 1}. ${fact}`).join('\n')}`;

    case 'trends':
      const trendPatterns = {
        'Growth': /increas|grow|rise|expand|surge/i,
        'Decline': /decreas|fall|drop|declin|reduc/i,
        'Innovation': /new|innovat|breakthrough|cutting-edge|advanced/i,
        'Adoption': /adopt|implement|deploy|integrat|using/i,
      };
      
      const identifiedTrends: string[] = [];
      for (const [trend, pattern] of Object.entries(trendPatterns)) {
        if (pattern.test(content)) {
          identifiedTrends.push(trend);
        }
      }
      
      return `Trend Analysis:\n` +
             `- Identified trends: ${identifiedTrends.join(', ') || 'No clear trends'}\n` +
             `- Market direction: ${identifiedTrends.includes('Growth') ? 'Positive' : 'Mixed'}\n` +
             `- Innovation signals: ${identifiedTrends.includes('Innovation') ? 'Strong' : 'Limited'}`;

    case 'summary':
      const allSentences = content.split(/[.!?]/).filter(s => s.trim().length > 20);
      const importantSentences = allSentences
        .filter(s => /announc|launch|report|study|research|found|develop/i.test(s))
        .slice(0, 3);
      
      return `Executive Summary:\n${importantSentences.join('. ')}.`;

    case 'credibility':
      const credibilityFactors = {
        'Has citations': /according to|study|research|report|survey/i.test(content),
        'Includes data': /\d+%|\$\d+|statistics|data/i.test(content),
        'Official source': /\.gov|\.edu|official|announce/i.test(content),
        'Recent info': /2024|2025|recent|latest|new/i.test(content),
      };
      
      const credibilityScore = Object.values(credibilityFactors).filter(v => v).length;
      
      return `Credibility Assessment:\n` +
             Object.entries(credibilityFactors).map(([factor, present]) => 
               `- ${factor}: ${present ? '✓' : '✗'}`
             ).join('\n') +
             `\n- Credibility score: ${credibilityScore}/4`;

    default:
      return `Analysis type "${analysisType}" completed.`;
  }
}

// Deep scrape functionality
async function executeDeepScrape(
  sourceUrl: string, 
  linkFilter?: string, 
  maxDepth: number = 1, 
  maxLinks: number = 5,
  formats: string[] = ["markdown"],
  requestId?: string
): Promise<{ content: string; screenshots: Array<{ url: string; screenshot?: string }> }> {
  const timer = logger.startTimer('deep-scrape');
  
  logger.firecrawl.info('Executing deep scrape', { 
    requestId,
    data: { sourceUrl, linkFilter, maxDepth, maxLinks }
  });
  
  const screenshots: Array<{ url: string; screenshot?: string }> = [];
  
  try {
    let sourceResult;
    try {
      const scrapeOptions = {
        formats: ['markdown', 'links', 'screenshot']
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sourceResult = await getFirecrawlClient().scrape(sourceUrl, scrapeOptions as any);
    } catch (scrapeError) {
      logger.firecrawl.error('Scrape failed', { 
        requestId,
        error: scrapeError instanceof Error ? scrapeError : String(scrapeError)
      });
      const errorMessage = scrapeError instanceof Error ? scrapeError.message : 'Unknown error';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorResponse = (scrapeError as any)?.response?.data || (scrapeError as any)?.response || null;
      
      return { 
        content: `Failed to scrape URL: ${errorMessage}${errorResponse ? ` - ${JSON.stringify(errorResponse)}` : ''}`,
        screenshots: []
      };
    }

    const data = (sourceResult as FirecrawlScrapeResult).data || (sourceResult as FirecrawlScrapeResult);
    
    if (!data.markdown) {
      return { 
        content: `Failed to scrape source URL: No content found\n\nTip: Try using web_search with scrape_content=true for better results.`,
        screenshots: []
      };
    }
    
    if (data.screenshot) {
      screenshots.push({ url: sourceUrl, screenshot: data.screenshot });
    }

    let output = `Source page scraped successfully\n`;
    output += `Title: ${data.metadata?.title || 'Unknown'}\n\n`;
    
    if (data.markdown) {
      const contentPreview = data.markdown.length > 3000 ? 
        data.markdown.substring(0, 3000) + '...\n[Content truncated]' : 
        data.markdown;
      output += `Page content:\n${contentPreview}\n\n`;
    }
    
    if (!linkFilter) {
      output += `\nFound ${data.links?.length || 0} links on this page.\n`;
      output += `To follow specific links, use the link_filter parameter (e.g., link_filter: "/blog/[^/]+$" for blog posts).\n`;
      
      const duration = timer();
      logger.firecrawl.info('Deep scrape complete (no link filter)', { requestId, duration });
      
      return { content: output, screenshots };
    }

    const allLinks: string[] = data.links || [];
    let filteredLinks = allLinks;
    
    const filterRegex = new RegExp(linkFilter, 'i');
    filteredLinks = allLinks.filter((link: string) => filterRegex.test(link));
    output += `Filtered to ${filteredLinks.length} links matching pattern "${linkFilter}"\n\n`;

    const linksToScrape = filteredLinks.slice(0, maxLinks);
    
    if (linksToScrape.length === 0) {
      output += "No links to scrape after filtering.\n";
      return { content: output, screenshots };
    }

    output += `Following ${linksToScrape.length} links:\n`;
    
    const scrapePromises = linksToScrape.map(async (link: string) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await getFirecrawlClient().scrape(link, {
          formats: [...formats, 'screenshot']
        } as any);
        
        const resultData = (result as FirecrawlScrapeResult).data || (result as FirecrawlScrapeResult);
        if ((result as FirecrawlScrapeResult).success && resultData.markdown) {
          if (resultData.screenshot) {
            screenshots.push({ url: link, screenshot: resultData.screenshot });
          }
          
          return {
            url: link,
            title: resultData.metadata?.title || 'Unknown',
            description: resultData.metadata?.description || '',
            content: resultData.markdown?.substring(0, 500) || '',
            links: resultData.links?.length || 0,
            hasScreenshot: !!resultData.screenshot
          };
        }
        return null;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(scrapePromises);
    const successfulScrapes = results.filter(r => r !== null);
    
    output += `\nSuccessfully scraped ${successfulScrapes.length} pages:\n\n`;
    
    for (const [index, result] of successfulScrapes.entries()) {
      if (result) {
        output += `[${index + 1}] ${result.title}\n`;
        output += `URL: ${result.url}\n`;
        output += `Description: ${result.description}\n`;
        output += `Content preview: ${result.content}...\n`;
        if (result.hasScreenshot) {
          output += `Screenshot: ✓ Captured\n`;
        }
        if (maxDepth > 1 && result.links > 0) {
          output += `Sub-links available: ${result.links} (depth ${maxDepth - 1} remaining)\n`;
        }
        output += '\n';
      }
    }
    
    const duration = timer();
    logger.firecrawl.info('Deep scrape complete', { 
      requestId, 
      duration,
      data: { pagesScraped: successfulScrapes.length, screenshotCount: screenshots.length }
    });
    
    return { content: output, screenshots };
  } catch (error) {
    const duration = timer();
    logger.firecrawl.error('Deep scrape failed', { 
      requestId, 
      duration,
      error: error instanceof Error ? error : String(error)
    });
    
    return { 
      content: `Error performing deep scrape: ${error instanceof Error ? error.message : 'Unknown error'}`,
      screenshots: []
    };
  }
}

// Execute tool based on name
export async function executeTool(
  toolName: string, 
  input: Record<string, unknown>,
  requestId?: string
): Promise<{ content: string; screenshots?: Array<{ url: string; screenshot?: string }> }> {
  logger.agent.debug('Executing tool', { requestId, data: { toolName, inputKeys: Object.keys(input) } });
  
  switch (toolName) {
    case 'web_search':
      return await executeWebSearch(
        input.query as string, 
        (input.limit as number) || 5, 
        (input.scrape_content as boolean) || false,
        input.tbs as string | undefined,
        requestId
      );
    case 'deep_scrape':
      return await executeDeepScrape(
        input.source_url as string,
        input.link_filter as string | undefined,
        (input.max_depth as number) || 1,
        (input.max_links as number) || 5,
        (input.formats as string[]) || ['markdown'],
        requestId
      );
    case 'analyze_content':
      return { content: await analyzeContent(input.content as string, input.analysis_type as string, input.context as string | undefined) };
    default:
      logger.agent.warn('Unknown tool requested', { requestId, data: { toolName } });
      return { content: `Unknown tool: ${toolName}` };
  }
}

// Streaming version with callback
export async function performResearchWithStreaming(
  query: string, 
  onEvent: (event: { type: string; [key: string]: unknown }) => void,
  config?: Partial<AgentConfig>
): Promise<string> {
  const requestId = generateRequestId();
  const overallTimer = logger.startTimer('research-session');
  
  logger.agent.info('Starting research session', { 
    requestId, 
    data: { query: query.substring(0, 100), provider: config?.provider || currentConfig.provider }
  });

  // Apply config if provided
  if (config) {
    setAgentConfig(config);
  }

  // Send initial event
  onEvent({ type: 'start', query });

  const messages: Array<{ role: string; content: string | Array<{ type: string; [key: string]: unknown }> }> = [{
    role: "user",
    content: query
  }];

  const systemPrompt = `You are a research assistant with access to web search and scraping tools. When asked to find specific blog posts on a website, you should:

1. For blog post requests (e.g., "3rd blog post", "5th blog post"):
   - First navigate to the main blog page to see all posts in order
   - Blog posts are typically ordered newest to oldest
   - Count posts as they appear on the page: 1st = newest/top post, 2nd = second from top, etc.
   - For firecrawl.dev: Use "site:firecrawl.dev/blog" to find all blog posts

2. To find the correct blog post:
   - Search with "site:firecrawl.dev/blog" to get the blog listing
   - If needed, scrape the blog index page to see all posts in order
   - Count carefully from the top to identify the correct post by position
   - Then scrape that specific post to get its content

3. Important: When someone asks for the "5th blog post", they mean the 5th post when counting from the newest (top) down, NOT a post with "5" in the title.

Be thorough and methodical. Always verify you have the correct post by its position in the blog listing.`;

  // Check if using OpenRouter
  const useOpenRouter = currentConfig.provider === 'openrouter';
  
  if (useOpenRouter) {
    return await performOpenRouterResearch(query, messages, systemPrompt, onEvent, requestId, overallTimer);
  }

  // Use Anthropic (original implementation)
  return await performAnthropicResearch(query, messages, systemPrompt, onEvent, requestId, overallTimer);
}

// OpenRouter research implementation
async function performOpenRouterResearch(
  query: string,
  messages: Array<{ role: string; content: string | Array<{ type: string; [key: string]: unknown }> }>,
  systemPrompt: string,
  onEvent: (event: { type: string; [key: string]: unknown }) => void,
  requestId: string,
  overallTimer: () => number
): Promise<string> {
  logger.openrouter.info('Starting OpenRouter research', { requestId, data: { model: currentConfig.model } });
  
  let finalResponse = '';
  let toolCallCount = 0;
  let currentMessages = [...messages];
  const maxIterations = 10;
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    
    try {
      const response = await callOpenRouter(
        currentMessages as OpenRouterMessage[],
        systemPrompt,
        tools,
        requestId
      );

      const choice = response.choices[0];
      if (!choice) {
        throw new Error('No response from OpenRouter');
      }

      const message = choice.message;

      // Check for tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        // Add assistant message with tool calls
        currentMessages.push({
          role: 'assistant',
          content: message.content || '',
        });

        for (const toolCall of message.tool_calls) {
          toolCallCount++;
          const toolName = toolCall.function.name;
          const toolInput = JSON.parse(toolCall.function.arguments);
          
          const toolDisplayName = toolName === 'web_search' ? 'firecrawl_search' : 
                                   toolName === 'deep_scrape' ? 'firecrawl_scrape' : 
                                   toolName;
          
          logger.agent.debug('Executing tool from OpenRouter', { 
            requestId, 
            data: { tool: toolName, iteration } 
          });
          
          onEvent({
            type: 'tool_call',
            number: toolCallCount,
            tool: toolDisplayName,
            parameters: toolInput
          });

          const startTime = Date.now();
          const toolResult = await executeTool(toolName, toolInput, requestId);
          const duration = Date.now() - startTime;

          onEvent({
            type: 'tool_result',
            tool: toolDisplayName,
            duration,
            result: toolResult.content,
            screenshots: toolResult.screenshots
          });

          // Add tool result to messages
          currentMessages.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: toolResult.content
            }]
          });
        }
      } else if (message.content) {
        // Final response
        finalResponse = message.content;
        
        onEvent({
          type: 'response',
          content: finalResponse
        });
        
        break;
      }

      if (choice.finish_reason === 'stop' && !message.tool_calls) {
        break;
      }

    } catch (error) {
      const duration = overallTimer();
      logger.openrouter.error('OpenRouter research failed', { 
        requestId, 
        duration,
        error: error instanceof Error ? error : String(error)
      });
      throw error;
    }
  }

  const duration = overallTimer();
  logger.agent.info('Research complete (OpenRouter)', { 
    requestId, 
    duration,
    data: { toolCalls: toolCallCount, iterations: iteration }
  });

  onEvent({
    type: 'summary',
    thinkingBlocks: 0,
    toolCalls: toolCallCount
  });

  return finalResponse;
}

// Anthropic research implementation (original)
async function performAnthropicResearch(
  query: string,
  messages: Array<{ role: string; content: string | Array<{ type: string; [key: string]: unknown }> }>,
  systemPrompt: string,
  onEvent: (event: { type: string; [key: string]: unknown }) => void,
  requestId: string,
  overallTimer: () => number
): Promise<string> {
  logger.anthropic.info('Starting Anthropic research', { requestId, data: { model: currentConfig.model } });

  const requestParams = {
    model: currentConfig.model || "claude-opus-4-5-20251101",
    max_tokens: 8000,
    system: systemPrompt,
    thinking: {
      type: "enabled" as const,
      budget_tokens: 20000
    },
    tools: tools,
    messages: messages
  };

  let response;
  try {
    const timer = logger.startTimer('anthropic-initial-call');
    
    response = await getAnthropicClient().beta.messages.create({
      ...requestParams,
      betas: ["interleaved-thinking-2025-05-14"]
    } as Parameters<Anthropic['beta']['messages']['create']>[0]);
    
    const duration = timer();
    logger.anthropic.debug('Initial Anthropic call complete', { requestId, duration });
  } catch (error) {
    logger.anthropic.error('Anthropic API call failed', { 
      requestId, 
      error: error instanceof Error ? error : String(error)
    });
    
    if (error instanceof Error) {
      if (error.message.includes('model')) {
        throw new Error(`Model error: The ${currentConfig.model} model may not be available in your region or with your API key. Error: ${error.message}`);
      }
      if (error.message.includes('beta')) {
        throw new Error(`Beta feature error: The interleaved-thinking-2025-05-14 beta may not be enabled for your account. Error: ${error.message}`);
      }
      if (error.message.includes('authentication') || error.message.includes('401')) {
        throw new Error(`Authentication error: Please check your ANTHROPIC_API_KEY. Error: ${error.message}`);
      }
    }
    throw error;
  }

  const assistantContent: Array<{ type: string; [key: string]: unknown }> = [];
  let thinkingCount = 0;
  let toolCallCount = 0;
  let currentMessages = [...messages];
  let finalResponse = '';

  async function processResponse(resp: { content: Array<{ type: string; thinking?: string; text?: string; name?: string; input?: Record<string, unknown>; id?: string }> }) {
    for (const block of resp.content) {
      if (block.type === 'thinking') {
        thinkingCount++;
        const thinkingContent = block.thinking || '';
        
        onEvent({
          type: 'thinking',
          number: thinkingCount,
          content: thinkingContent
        });
        
        assistantContent.push(block);
      } else if (block.type === 'tool_use') {
        toolCallCount++;
        const toolDisplayName = block.name === 'web_search' ? 'firecrawl_search' : 
                                 block.name === 'deep_scrape' ? 'firecrawl_scrape' : 
                                 block.name;
        
        logger.agent.debug('Executing tool from Anthropic', { 
          requestId, 
          data: { tool: block.name } 
        });
        
        onEvent({
          type: 'tool_call',
          number: toolCallCount,
          tool: toolDisplayName,
          parameters: block.input
        });
        
        assistantContent.push(block);

        const startTime = Date.now();
        const toolResult = await executeTool(block.name || '', block.input || {}, requestId);
        const duration = Date.now() - startTime;
        
        onEvent({
          type: 'tool_result',
          tool: toolDisplayName,
          duration,
          result: toolResult.content,
          screenshots: toolResult.screenshots
        });

        currentMessages = [
          ...currentMessages,
          {
            role: "assistant",
            content: [...assistantContent]
          },
          {
            role: "user",
            content: [{
              type: "tool_result",
              tool_use_id: block.id,
              content: toolResult.content
            }]
          }
        ];

        const continuationParams = {
          ...requestParams,
          messages: currentMessages
        };

        let nextResponse;
        try {
          const timer = logger.startTimer('anthropic-continuation');
          
          nextResponse = await getAnthropicClient().beta.messages.create({
            ...continuationParams,
            betas: ["interleaved-thinking-2025-05-14"]
          } as Parameters<Anthropic['beta']['messages']['create']>[0]);
          
          const duration = timer();
          logger.anthropic.debug('Anthropic continuation complete', { requestId, duration });
        } catch (error) {
          logger.anthropic.error('Anthropic continuation failed', { 
            requestId, 
            error: error instanceof Error ? error : String(error)
          });
          throw error;
        }

        assistantContent.length = 0;

        await processResponse(nextResponse as { content: Array<{ type: string; thinking?: string; text?: string; name?: string; input?: Record<string, unknown>; id?: string }> });
        return;
      } else if (block.type === 'text') {
        const textContent = block.text || '';
        
        onEvent({
          type: 'response',
          content: textContent
        });
        
        finalResponse = textContent;
      }
    }
  }

  await processResponse(response as { content: Array<{ type: string; thinking?: string; text?: string; name?: string; input?: Record<string, unknown>; id?: string }> });

  const duration = overallTimer();
  logger.agent.info('Research complete (Anthropic)', { 
    requestId, 
    duration,
    data: { thinkingBlocks: thinkingCount, toolCalls: toolCallCount }
  });
  
  onEvent({
    type: 'summary',
    thinkingBlocks: thinkingCount,
    toolCalls: toolCallCount
  });
  
  return finalResponse;
}

// Main research function with interleaved thinking
export async function performResearch(query: string): Promise<string> {
  const requestId = generateRequestId();
  
  logger.agent.info('Starting research (non-streaming)', { requestId, data: { query: query.substring(0, 100) } });

  const messages: Array<{ role: string; content: string | Array<{ type: string; [key: string]: unknown }> }> = [{
    role: "user",
    content: query
  }];

  const systemPrompt = `You are a research assistant with access to web search and scraping tools. When asked to find specific blog posts on a website, you should:

1. For blog post requests (e.g., "3rd blog post", "5th blog post"):
   - First navigate to the main blog page to see all posts in order
   - Blog posts are typically ordered newest to oldest
   - Count posts as they appear on the page: 1st = newest/top post, 2nd = second from top, etc.
   - For firecrawl.dev: Use "site:firecrawl.dev/blog" to find all blog posts

2. To find the correct blog post:
   - Search with "site:firecrawl.dev/blog" to get the blog listing
   - If needed, scrape the blog index page to see all posts in order
   - Count carefully from the top to identify the correct post by position
   - Then scrape that specific post to get its content

3. Important: When someone asks for the "5th blog post", they mean the 5th post when counting from the newest (top) down, NOT a post with "5" in the title.

Be thorough and methodical. Always verify you have the correct post by its position in the blog listing.`;

  const requestParams = {
    model: currentConfig.model || "claude-opus-4-5-20251101",
    max_tokens: 8000,
    system: systemPrompt,
    thinking: {
      type: "enabled" as const,
      budget_tokens: 20000
    },
    tools: tools,
    messages: messages
  };

  let response;
  try {
    response = await getAnthropicClient().beta.messages.create({
      ...requestParams,
      betas: ["interleaved-thinking-2025-05-14"]
    } as Parameters<Anthropic['beta']['messages']['create']>[0]);
  } catch (error) {
    logger.anthropic.error('Anthropic API call failed (non-streaming)', { 
      requestId, 
      error: error instanceof Error ? error : String(error)
    });
    
    if (error instanceof Error) {
      if (error.message.includes('model')) {
        throw new Error(`Model error: The ${currentConfig.model} model may not be available in your region or with your API key. Error: ${error.message}`);
      }
      if (error.message.includes('beta')) {
        throw new Error(`Beta feature error: The interleaved-thinking-2025-05-14 beta may not be enabled for your account. Error: ${error.message}`);
      }
      if (error.message.includes('authentication') || error.message.includes('401')) {
        throw new Error(`Authentication error: Please check your ANTHROPIC_API_KEY. Error: ${error.message}`);
      }
    }
    throw error;
  }

  const assistantContent: Array<{ type: string; [key: string]: unknown }> = [];
  let currentMessages = [...messages];
  let finalResponse = '';

  async function processResponse(resp: { content: Array<{ type: string; thinking?: string; text?: string; name?: string; input?: Record<string, unknown>; id?: string }> }) {
    for (const block of resp.content) {
      if (block.type === 'thinking') {
        assistantContent.push(block);
      } else if (block.type === 'tool_use') {
        assistantContent.push(block);

        const toolResult = await executeTool(block.name || '', block.input || {}, requestId);

        currentMessages = [
          ...currentMessages,
          {
            role: "assistant",
            content: [...assistantContent]
          },
          {
            role: "user",
            content: [{
              type: "tool_result",
              tool_use_id: block.id,
              content: toolResult.content
            }]
          }
        ];

        const continuationParams = {
          ...requestParams,
          messages: currentMessages
        };

        let nextResponse;
        try {
          nextResponse = await getAnthropicClient().beta.messages.create({
            ...continuationParams,
            betas: ["interleaved-thinking-2025-05-14"]
          } as Parameters<Anthropic['beta']['messages']['create']>[0]);
        } catch (error) {
          throw error;
        }

        assistantContent.length = 0;

        await processResponse(nextResponse as { content: Array<{ type: string; thinking?: string; text?: string; name?: string; input?: Record<string, unknown>; id?: string }> });
        return;
      } else if (block.type === 'text') {
        const textContent = block.text || '';
        finalResponse = textContent;
      }
    }
  }

  await processResponse(response as { content: Array<{ type: string; thinking?: string; text?: string; name?: string; input?: Record<string, unknown>; id?: string }> });

  logger.agent.info('Research complete (non-streaming)', { requestId });
  
  return finalResponse;
}
