'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { LoginModal } from '@/components/login-modal'
import { Loader2Icon, ShieldIcon } from 'lucide-react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isVerifying, setIsVerifying] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [isAuthRequired, setIsAuthRequired] = useState<boolean | null>(null)
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false)
  
  const { verifySession, token } = useAuthStore()

  useEffect(() => {
    const checkAuth = async () => {
      setIsVerifying(true)
      console.log('[AuthProvider] Checking authentication...')
      
      try {
        // Call verify session which will update the store
        const isValid = await verifySession()
        
        // Get the authRequired state from the store after verification
        const store = useAuthStore.getState()
        const authNeeded = store.authRequired
        
        console.log('[AuthProvider] Auth check result:', { isValid, authNeeded, hasToken: !!store.token })
        
        setIsAuthRequired(authNeeded)
        setIsUserAuthenticated(isValid)
        
        // Show login if auth is required and user is not authenticated
        if (authNeeded === true && !isValid) {
          console.log('[AuthProvider] Auth required but not authenticated, showing login')
          setShowLogin(true)
        } else {
          setShowLogin(false)
        }
      } catch (error) {
        console.error('[AuthProvider] Auth check error:', error)
        // On error, assume auth required for safety
        setIsAuthRequired(true)
        setIsUserAuthenticated(false)
        setShowLogin(true)
      }
      
      setIsVerifying(false)
    }

    checkAuth()
  }, [verifySession, token])

  // Show loading while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
              <ShieldIcon className="w-8 h-8 text-blue-400" />
            </div>
            <Loader2Icon className="absolute inset-0 w-16 h-16 animate-spin text-blue-500/30" />
          </div>
          <p className="text-gray-400 text-sm">Verifying session...</p>
        </div>
      </div>
    )
  }

  // Show login modal if auth required and not authenticated
  if (isAuthRequired === true && !isUserAuthenticated) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
            <p className="text-gray-400">Please authenticate to continue</p>
          </div>
        </div>
        <LoginModal 
          open={showLogin} 
          onOpenChange={setShowLogin}
          onSuccess={() => {
            console.log('[AuthProvider] Login successful, updating state')
            setShowLogin(false)
            setIsUserAuthenticated(true)
          }}
        />
      </>
    )
  }

  // Render children if authenticated or auth not required
  return <>{children}</>
}

