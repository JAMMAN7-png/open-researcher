import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AuthState {
  // Session token
  token: string | null
  // When the session expires
  expiresAt: number | null
  // Whether auth is required (determined by server)
  authRequired: boolean | null
  // Loading state
  isLoading: boolean
  // Error message
  error: string | null
  
  // Actions
  setToken: (token: string, expiresAt: number) => void
  clearToken: () => void
  setAuthRequired: (required: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Check if currently authenticated
  isAuthenticated: () => boolean
  
  // Login action
  login: (password: string) => Promise<boolean>
  
  // Logout action
  logout: () => Promise<void>
  
  // Verify current session
  verifySession: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresAt: null,
      authRequired: null,
      isLoading: false,
      error: null,
      
      setToken: (token, expiresAt) => set({ token, expiresAt, error: null }),
      clearToken: () => set({ token: null, expiresAt: null }),
      setAuthRequired: (required) => set({ authRequired: required }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      isAuthenticated: () => {
        const state = get()
        if (!state.token) return false
        if (state.expiresAt && state.expiresAt < Date.now()) {
          // Token expired, clear it
          set({ token: null, expiresAt: null })
          return false
        }
        return true
      },
      
      login: async (password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
          })
          
          const data = await response.json()
          
          if (data.success) {
            set({
              token: data.token,
              expiresAt: data.expiresAt,
              isLoading: false,
              error: null,
            })
            return true
          } else {
            set({
              isLoading: false,
              error: data.error || 'Authentication failed',
            })
            return false
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
          })
          return false
        }
      },
      
      logout: async () => {
        const state = get()
        
        try {
          if (state.token) {
            await fetch('/api/auth', {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${state.token}` },
            })
          }
        } catch {
          // Ignore errors on logout
        }
        
        set({ token: null, expiresAt: null })
      },
      
      verifySession: async () => {
        const state = get()
        set({ isLoading: true })
        
        try {
          const headers: Record<string, string> = {}
          if (state.token) {
            headers['Authorization'] = `Bearer ${state.token}`
          }
          
          const response = await fetch('/api/auth', {
            method: 'GET',
            headers,
          })
          
          const data = await response.json()
          
          set({
            authRequired: data.authRequired,
            isLoading: false,
          })
          
          if (data.authenticated) {
            if (data.expiresAt) {
              set({ expiresAt: data.expiresAt })
            }
            return true
          } else {
            if (data.authRequired) {
              set({ token: null, expiresAt: null })
            }
            return !data.authRequired
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Session verification failed',
          })
          return false
        }
      },
    }),
    {
      name: 'open-researcher-auth',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage so it clears on browser close
      partialize: (state) => ({
        token: state.token,
        expiresAt: state.expiresAt,
      }),
    }
  )
)

// Selector hooks
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated())
export const useAuthRequired = () => useAuthStore((state) => state.authRequired)
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthError = () => useAuthStore((state) => state.error)

