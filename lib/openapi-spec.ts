import type { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Open Researcher API',
    description: `
An AI-powered web research API that combines Firecrawl's web scraping capabilities with Anthropic's Claude AI to perform intelligent research tasks.

## Features
- **Intelligent Web Search**: Powered by Firecrawl with Google search operators support
- **Deep Web Scraping**: Extract content from pages and follow links with filtering
- **Content Analysis**: Sentiment analysis, key facts extraction, trend identification
- **Real-Time Thinking Display**: Claude's interleaved thinking exposed via streaming
- **Screenshot Capture**: Visual verification of scraped pages

## Authentication
- \`ANTHROPIC_API_KEY\`: Required server-side environment variable
- \`FIRECRAWL_API_KEY\`: Can be set server-side or passed via \`X-Firecrawl-API-Key\` header
    `,
    version: '1.0.0',
    contact: {
      name: 'Mendable AI',
      url: 'https://mendable.ai',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Current server',
    },
  ],
  tags: [
    {
      name: 'Research',
      description: 'AI-powered web research endpoints',
    },
    {
      name: 'Scraping',
      description: 'Direct web scraping via Firecrawl',
    },
    {
      name: 'Utility',
      description: 'Utility and health check endpoints',
    },
  ],
  paths: {
    '/api/open-researcher': {
      post: {
        tags: ['Research'],
        summary: 'Perform AI-powered web research',
        description: `
Executes an AI research agent that searches the web, scrapes content, and synthesizes findings into a comprehensive response.

**Response Format**: Server-Sent Events (SSE) stream

**Event Types**:
- \`thinking\`: AI reasoning blocks (real-time thinking)
- \`tool_call\`: Tool invocation (web_search, deep_scrape, analyze_content)
- \`tool_result\`: Results from tool execution including screenshots
- \`response\`: Final synthesized answer in Markdown
- \`done\`: Stream completion signal
- \`error\`: Error occurred during research
        `,
        operationId: 'performResearch',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ResearchRequest',
              },
              examples: {
                simple: {
                  summary: 'Simple research query',
                  value: {
                    query: 'What are the latest developments in AI?',
                  },
                },
                specific: {
                  summary: 'Specific research with site filter',
                  value: {
                    query: 'site:github.com trending repositories this week',
                  },
                },
              },
            },
          },
        },
        parameters: [
          {
            $ref: '#/components/parameters/FirecrawlApiKey',
          },
        ],
        responses: {
          '200': {
            description: 'SSE stream of research events',
            content: {
              'text/event-stream': {
                schema: {
                  $ref: '#/components/schemas/ResearchStreamEvent',
                },
                examples: {
                  thinking: {
                    summary: 'Thinking event',
                    value: 'data: {"type":"event","event":{"type":"thinking","content":"Analyzing the query...","number":1}}',
                  },
                  toolCall: {
                    summary: 'Tool call event',
                    value: 'data: {"type":"event","event":{"type":"tool_call","name":"web_search","input":{"query":"AI developments 2025"}}}',
                  },
                  response: {
                    summary: 'Final response',
                    value: 'data: {"type":"response","content":"# Research Findings\\n\\n..."}',
                  },
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
          '500': {
            $ref: '#/components/responses/ServerError',
          },
        },
      },
    },
    '/api/open-researcher/follow-up': {
      post: {
        tags: ['Research'],
        summary: 'Generate follow-up questions',
        description: 'Uses Claude Haiku to generate 5 relevant follow-up questions based on the original research query.',
        operationId: 'generateFollowUp',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/FollowUpRequest',
              },
              examples: {
                example: {
                  summary: 'Generate follow-ups for AI query',
                  value: {
                    query: 'What are the latest developments in AI?',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Array of follow-up questions',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/FollowUpResponse',
                },
                example: {
                  questions: [
                    'What specific AI models have been released recently?',
                    'How are these developments impacting various industries?',
                    'What are the ethical considerations of recent AI advancements?',
                    'Which companies are leading in AI research?',
                    'What future AI developments are predicted for the next year?',
                  ],
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
          '500': {
            $ref: '#/components/responses/ServerError',
          },
        },
      },
    },
    '/api/scrape': {
      post: {
        tags: ['Scraping'],
        summary: 'Scrape web pages',
        description: `
Direct proxy to Firecrawl API for scraping URLs. Supports both single URL and batch scraping.

**Supported Formats**:
- \`markdown\`: Page content as Markdown
- \`links\`: Extracted links from the page
- \`screenshot\`: Page screenshot
- \`screenshot@fullPage\`: Full page screenshot
        `,
        operationId: 'scrapeUrl',
        parameters: [
          {
            $ref: '#/components/parameters/FirecrawlApiKey',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  {
                    $ref: '#/components/schemas/ScrapeRequestSingle',
                  },
                  {
                    $ref: '#/components/schemas/ScrapeRequestBatch',
                  },
                ],
              },
              examples: {
                single: {
                  summary: 'Scrape single URL',
                  value: {
                    url: 'https://example.com',
                    formats: ['markdown', 'links'],
                  },
                },
                withScreenshot: {
                  summary: 'Scrape with full page screenshot',
                  value: {
                    url: 'https://example.com',
                    formats: ['markdown', 'screenshot@fullPage'],
                  },
                },
                batch: {
                  summary: 'Batch scrape multiple URLs',
                  value: {
                    urls: ['https://example1.com', 'https://example2.com'],
                    formats: ['markdown'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Scraped content',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ScrapeResponse',
                },
                example: {
                  success: true,
                  data: {
                    markdown: '# Example Page\n\nThis is the page content...',
                    links: ['https://example.com/link1', 'https://example.com/link2'],
                    metadata: {
                      title: 'Example Page',
                      description: 'An example page',
                    },
                  },
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
          '500': {
            $ref: '#/components/responses/ServerError',
          },
        },
      },
    },
    '/api/check-env': {
      get: {
        tags: ['Utility'],
        summary: 'Check environment configuration',
        description: 'Returns the status of required API keys and environment configuration.',
        operationId: 'checkEnvironment',
        responses: {
          '200': {
            description: 'Environment status',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/EnvironmentStatus',
                },
                example: {
                  environmentStatus: {
                    FIRECRAWL_API_KEY: true,
                    ANTHROPIC_API_KEY: true,
                    FIRESTARTER_DISABLE_CREATION_DASHBOARD: false,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ResearchRequest: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            description: 'The research query or question to investigate',
            minLength: 1,
            maxLength: 2000,
            example: 'What are the latest developments in AI?',
          },
        },
      },
      ResearchStreamEvent: {
        type: 'object',
        description: 'Server-Sent Event payload',
        properties: {
          type: {
            type: 'string',
            enum: ['event', 'response', 'done', 'error'],
            description: 'The type of SSE message',
          },
          event: {
            type: 'object',
            description: 'Event data (when type is "event")',
            properties: {
              type: {
                type: 'string',
                enum: ['start', 'thinking', 'tool_call', 'tool_result', 'summary'],
              },
              content: {
                type: 'string',
              },
              name: {
                type: 'string',
                description: 'Tool name (for tool_call events)',
              },
              input: {
                type: 'object',
                description: 'Tool input parameters (for tool_call events)',
              },
              screenshots: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    url: { type: 'string' },
                    screenshot: { type: 'string', description: 'Base64 encoded image' },
                  },
                },
              },
              timestamp: {
                type: 'number',
                description: 'Unix timestamp in milliseconds',
              },
            },
          },
          content: {
            type: 'string',
            description: 'Final response content (when type is "response")',
          },
          error: {
            type: 'string',
            description: 'Error message (when type is "error")',
          },
        },
      },
      FollowUpRequest: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            description: 'The original query to generate follow-up questions for',
            example: 'What are the latest developments in AI?',
          },
        },
      },
      FollowUpResponse: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of 5 follow-up questions',
            maxItems: 5,
          },
        },
      },
      ScrapeRequestSingle: {
        type: 'object',
        required: ['url'],
        properties: {
          url: {
            type: 'string',
            format: 'uri',
            description: 'URL to scrape',
            example: 'https://example.com',
          },
          formats: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['markdown', 'links', 'screenshot', 'screenshot@fullPage'],
            },
            description: 'Output formats to include',
            default: ['markdown'],
          },
        },
      },
      ScrapeRequestBatch: {
        type: 'object',
        required: ['urls'],
        properties: {
          urls: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uri',
            },
            description: 'URLs to scrape in batch',
            example: ['https://example1.com', 'https://example2.com'],
          },
          formats: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['markdown', 'links', 'screenshot', 'screenshot@fullPage'],
            },
            description: 'Output formats to include',
            default: ['markdown'],
          },
        },
      },
      ScrapeResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the scrape was successful',
          },
          data: {
            type: 'object',
            properties: {
              markdown: {
                type: 'string',
                description: 'Page content as Markdown',
              },
              links: {
                type: 'array',
                items: { type: 'string' },
                description: 'Extracted links from the page',
              },
              screenshot: {
                type: 'string',
                description: 'Base64 encoded screenshot (data URL)',
              },
              metadata: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  language: { type: 'string' },
                  ogImage: { type: 'string' },
                },
              },
            },
          },
          error: {
            type: 'string',
            description: 'Error message if success is false',
          },
        },
      },
      EnvironmentStatus: {
        type: 'object',
        properties: {
          environmentStatus: {
            type: 'object',
            properties: {
              FIRECRAWL_API_KEY: {
                type: 'boolean',
                description: 'Whether Firecrawl API key is configured',
              },
              ANTHROPIC_API_KEY: {
                type: 'boolean',
                description: 'Whether Anthropic API key is configured',
              },
              FIRESTARTER_DISABLE_CREATION_DASHBOARD: {
                type: 'boolean',
                description: 'Whether dashboard creation is disabled',
              },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          message: {
            type: 'string',
            description: 'Detailed error message',
          },
          hint: {
            type: 'string',
            description: 'Suggestion for resolving the error',
          },
        },
      },
    },
    parameters: {
      FirecrawlApiKey: {
        name: 'X-Firecrawl-API-Key',
        in: 'header',
        required: false,
        schema: {
          type: 'string',
        },
        description: 'Firecrawl API key (optional if configured server-side)',
        example: 'fc-your-api-key',
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request - invalid input',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Query is required',
            },
          },
        },
      },
      ServerError: {
        description: 'Server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Internal server error',
              message: 'An unexpected error occurred',
              hint: 'Check the server logs for more details',
            },
          },
        },
      },
    },
  },
};

