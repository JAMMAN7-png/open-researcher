'use client'

import { useState, useEffect } from 'react'
import { m } from 'motion/react'
import { 
  BrainIcon, 
  FlameIcon, 
  ServerIcon,
  Loader2Icon,
  RefreshCwIcon
} from 'lucide-react'
import { AnimatedCheckIcon, AnimatedXIcon } from '@/components/animated-status-icons'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/lib/stores/config-store'

interface ServiceStatus {
  name: string
  icon: React.ReactNode
  status: 'checking' | 'connected' | 'error' | 'unconfigured'
  message?: string
  provider?: string
}

export function SystemStatus() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { 
      name: 'LLM Provider', 
      icon: <BrainIcon className="size-4" />, 
      status: 'checking' 
    },
    { 
      name: 'Firecrawl', 
      icon: <FlameIcon className="size-4" />, 
      status: 'checking' 
    },
  ])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  
  const { 
    llmProvider, 
    selectedModel,
    firecrawlSelfHosted,
    openRouterConnected,
    anthropicConnected,
    firecrawlConnected,
    setOpenRouterConnected,
    setAnthropicConnected,
    setFirecrawlConnected,
  } = useConfigStore()

  const checkSystemStatus = async () => {
    setIsRefreshing(true)
    
    try {
      // Check environment status
      const envResponse = await fetch('/api/check-env')
      const envData = await envResponse.json()
      
      // Determine LLM provider status
      let llmStatus: ServiceStatus = {
        name: 'LLM Provider',
        icon: <BrainIcon className="size-4" />,
        status: 'unconfigured',
        message: 'No API key configured',
        provider: llmProvider === 'anthropic' ? 'Anthropic' : 'OpenRouter'
      }
      
      if (llmProvider === 'anthropic') {
        if (envData.environmentStatus.ANTHROPIC_API_KEY) {
          llmStatus.status = 'connected'
          llmStatus.message = `Claude (${selectedModel})`
          setAnthropicConnected(true)
        } else {
          llmStatus.status = 'error'
          llmStatus.message = 'Anthropic API key missing'
          setAnthropicConnected(false)
        }
      } else {
        // OpenRouter
        const hasEnvKey = envData.environmentStatus.OPENROUTER_API_KEY
        const hasLocalKey = !!localStorage.getItem('openrouter_api_key')
        
        if (hasEnvKey || hasLocalKey) {
          llmStatus.status = 'connected'
          llmStatus.message = `OpenRouter (${selectedModel.split('/').pop()})`
          setOpenRouterConnected(true)
        } else {
          llmStatus.status = 'error'
          llmStatus.message = 'OpenRouter API key missing'
          setOpenRouterConnected(false)
        }
      }
      
      // Determine Firecrawl status
      let fcStatus: ServiceStatus = {
        name: 'Firecrawl',
        icon: <FlameIcon className="size-4" />,
        status: 'unconfigured',
        message: 'No API key configured',
      }
      
      const hasEnvFirecrawl = envData.environmentStatus.FIRECRAWL_API_KEY
      const hasLocalFirecrawl = !!localStorage.getItem('firecrawl_api_key')
      
      if (hasEnvFirecrawl || hasLocalFirecrawl) {
        fcStatus.status = 'connected'
        if (firecrawlSelfHosted) {
          fcStatus.message = 'Self-hosted instance'
          fcStatus.icon = <ServerIcon className="size-4" />
        } else {
          fcStatus.message = 'Cloud service'
        }
        setFirecrawlConnected(true)
      } else {
        fcStatus.status = 'error'
        fcStatus.message = 'API key not configured'
        setFirecrawlConnected(false)
      }
      
      setServices([llmStatus, fcStatus])
      setHasChecked(true)
      
    } catch (error) {
      console.error('Failed to check system status:', error)
      setServices([
        { 
          name: 'LLM Provider', 
          icon: <BrainIcon className="size-4" />, 
          status: 'error',
          message: 'Failed to check status'
        },
        { 
          name: 'Firecrawl', 
          icon: <FlameIcon className="size-4" />, 
          status: 'error',
          message: 'Failed to check status'
        },
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    checkSystemStatus()
  }, [llmProvider, selectedModel, firecrawlSelfHosted])

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800'
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800'
      case 'unconfigured':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800'
    }
  }

  const allConnected = services.every(s => s.status === 'connected')

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="mt-8"
    >
      {/* Status Header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">System Status</span>
        <button
          onClick={checkSystemStatus}
          disabled={isRefreshing}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Refresh status"
        >
          <RefreshCwIcon 
            className={cn(
              "size-3.5 text-gray-400",
              isRefreshing && "animate-spin"
            )} 
          />
        </button>
      </div>

      {/* Status Cards */}
      <div className="flex flex-wrap justify-center gap-3">
        {services.map((service, index) => (
          <m.div
            key={service.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
              getStatusColor(service.status)
            )}
          >
            {/* Service Icon */}
            <span className="opacity-70">{service.icon}</span>
            
            {/* Service Info */}
            <div className="flex flex-col">
              <span className="text-xs font-medium">{service.name}</span>
              {service.message && (
                <span className="text-[10px] opacity-75">{service.message}</span>
              )}
            </div>
            
            {/* Status Icon */}
            <div className="ml-1">
              {service.status === 'checking' && (
                <Loader2Icon className="size-4 animate-spin text-blue-500" />
              )}
              {service.status === 'connected' && hasChecked && (
                <AnimatedCheckIcon size={16} />
              )}
              {service.status === 'error' && hasChecked && (
                <AnimatedXIcon size={16} />
              )}
              {service.status === 'unconfigured' && hasChecked && (
                <m.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="size-4 rounded-full bg-yellow-500/20 flex items-center justify-center"
                >
                  <span className="text-[10px]">!</span>
                </m.div>
              )}
            </div>
          </m.div>
        ))}
      </div>

      {/* Summary Message */}
      {hasChecked && (
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={cn(
            "text-center text-xs mt-3",
            allConnected 
              ? "text-green-600 dark:text-green-400" 
              : "text-yellow-600 dark:text-yellow-400"
          )}
        >
          {allConnected 
            ? "✓ All systems operational" 
            : "Configure missing services in Admin Panel"
          }
        </m.p>
      )}
    </m.div>
  )
}

