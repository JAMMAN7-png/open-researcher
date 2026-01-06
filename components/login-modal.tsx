'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2Icon, LockIcon, ShieldCheckIcon, AlertCircleIcon } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { cn } from '@/lib/utils'

interface LoginModalProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function LoginModal({ open, onOpenChange, onSuccess }: LoginModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error, setError } = useAuthStore()

  // Clear error when modal opens/closes
  useEffect(() => {
    if (open) {
      setPassword('')
      setError(null)
    }
  }, [open, setError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError('Password is required')
      return
    }

    const success = await login(password)
    if (success) {
      onSuccess?.()
      onOpenChange?.(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/50">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
            <LockIcon className="w-8 h-8 text-blue-400" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-white">
            Authentication Required
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Enter the admin password to access the application.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300 flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4" />
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter password..."
                disabled={isLoading}
                autoFocus
                className={cn(
                  "bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500",
                  "focus:border-blue-500 focus:ring-blue-500/20",
                  "pr-20",
                  error && "border-red-500 focus:border-red-500"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !password.trim()}
            className={cn(
              "w-full h-12 text-base font-semibold",
              "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500",
              "disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            {isLoading ? (
              <>
                <Loader2Icon className="w-5 h-5 mr-2 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <ShieldCheckIcon className="w-5 h-5 mr-2" />
                Unlock Application
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            This session will persist until you close your browser.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}

