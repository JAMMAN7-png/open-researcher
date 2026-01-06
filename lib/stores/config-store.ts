import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Configuration store for API settings
 * Persisted in localStorage for client-side, uses environment variables server-side
 */

export type LLMProvider = 'anthropic' | 'openrouter';

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

// Popular models from OpenRouter (subset for quick selection)
export const POPULAR_OPENROUTER_MODELS: OpenRouterModel[] = [
  {
    id: 'anthropic/claude-opus-4',
    name: 'Claude Opus 4',
    description: 'Most capable Claude model with advanced reasoning',
    context_length: 200000,
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    description: 'Balanced performance and speed',
    context_length: 200000,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Previous generation, still excellent',
    context_length: 200000,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI multimodal flagship',
    context_length: 128000,
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Fast GPT-4 variant',
    context_length: 128000,
  },
  {
    id: 'google/gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    description: 'Google\'s latest fast model',
    context_length: 1000000,
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    description: 'Google\'s capable model',
    context_length: 2000000,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    description: 'Meta\'s open-source powerhouse',
    context_length: 128000,
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat',
    description: 'Efficient and capable',
    context_length: 64000,
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    description: 'Mistral\'s flagship model',
    context_length: 128000,
  },
];

// Anthropic direct models
export const ANTHROPIC_MODELS = [
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    description: 'Most capable with extended thinking',
  },
  {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    description: 'Latest Opus with enhanced reasoning',
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Balanced performance',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Previous generation Sonnet',
  },
];

export interface ConfigState {
  // LLM Provider settings
  llmProvider: LLMProvider;
  selectedModel: string;
  openRouterApiKey: string;
  
  // Firecrawl settings
  firecrawlApiKey: string;
  firecrawlSelfHosted: boolean;
  firecrawlBaseUrl: string;
  
  // Status tracking
  openRouterConnected: boolean;
  anthropicConnected: boolean;
  firecrawlConnected: boolean;
  
  // Actions
  setLLMProvider: (provider: LLMProvider) => void;
  setSelectedModel: (model: string) => void;
  setOpenRouterApiKey: (key: string) => void;
  setFirecrawlApiKey: (key: string) => void;
  setFirecrawlSelfHosted: (enabled: boolean) => void;
  setFirecrawlBaseUrl: (url: string) => void;
  setOpenRouterConnected: (connected: boolean) => void;
  setAnthropicConnected: (connected: boolean) => void;
  setFirecrawlConnected: (connected: boolean) => void;
  resetConfig: () => void;
}

const initialState = {
  llmProvider: 'anthropic' as LLMProvider,
  selectedModel: 'claude-opus-4-5-20251101',
  openRouterApiKey: '',
  firecrawlApiKey: '',
  firecrawlSelfHosted: false,
  firecrawlBaseUrl: 'https://api.firecrawl.dev',
  openRouterConnected: false,
  anthropicConnected: false,
  firecrawlConnected: false,
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setLLMProvider: (provider) => set({ 
        llmProvider: provider,
        // Reset model when switching providers
        selectedModel: provider === 'anthropic' 
          ? 'claude-opus-4-5-20251101' 
          : 'anthropic/claude-opus-4',
      }),
      
      setSelectedModel: (model) => set({ selectedModel: model }),
      
      setOpenRouterApiKey: (key) => set({ 
        openRouterApiKey: key,
        openRouterConnected: false, // Reset connection status when key changes
      }),
      
      setFirecrawlApiKey: (key) => set({ 
        firecrawlApiKey: key,
        firecrawlConnected: false,
      }),
      
      setFirecrawlSelfHosted: (enabled) => set({ 
        firecrawlSelfHosted: enabled,
        firecrawlBaseUrl: enabled ? '' : 'https://api.firecrawl.dev',
        firecrawlConnected: false,
      }),
      
      setFirecrawlBaseUrl: (url) => set({ 
        firecrawlBaseUrl: url,
        firecrawlConnected: false,
      }),
      
      setOpenRouterConnected: (connected) => set({ openRouterConnected: connected }),
      setAnthropicConnected: (connected) => set({ anthropicConnected: connected }),
      setFirecrawlConnected: (connected) => set({ firecrawlConnected: connected }),
      
      resetConfig: () => set(initialState),
    }),
    {
      name: 'open-researcher-config',
      partialize: (state) => ({
        llmProvider: state.llmProvider,
        selectedModel: state.selectedModel,
        openRouterApiKey: state.openRouterApiKey,
        firecrawlApiKey: state.firecrawlApiKey,
        firecrawlSelfHosted: state.firecrawlSelfHosted,
        firecrawlBaseUrl: state.firecrawlBaseUrl,
      }),
    }
  )
);

// Helper to get effective config (merging localStorage with env vars)
export function getEffectiveConfig() {
  // This is for server-side use - on client, use the store directly
  return {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    firecrawlApiKey: process.env.FIRECRAWL_API_KEY || '',
    firecrawlBaseUrl: process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev',
  };
}

