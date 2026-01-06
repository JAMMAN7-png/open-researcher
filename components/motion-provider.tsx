'use client'

import { LazyMotion, domAnimation } from 'motion/react'
import { ReactNode } from 'react'

interface MotionProviderProps {
  children: ReactNode
}

/**
 * LazyMotion provider for optimal bundle size (~4.6KB)
 * Provides animation features to the application via domAnimation feature bundle
 * This is a lighter alternative to the full framer-motion bundle
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}
