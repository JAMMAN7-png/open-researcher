'use client'

import { m } from 'motion/react'
import { cn } from '@/lib/utils'

interface AnimatedIconProps {
  size?: number
  className?: string
}

/**
 * Animated checkmark icon with success animation
 * Features scale and fade-in animation for positive feedback
 */
export function AnimatedCheckIcon({ size = 24, className }: AnimatedIconProps) {
  return (
    <m.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-green-500 dark:text-green-400', className)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1], // Spring-like easing
      }}
    >
      <m.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      <m.path
        d="M8 12.5L10.5 15L16 9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.15, ease: 'easeOut' }}
      />
    </m.svg>
  )
}

/**
 * Animated X icon with error animation
 * Features shake and fade-in animation for negative feedback
 */
export function AnimatedXIcon({ size = 24, className }: AnimatedIconProps) {
  return (
    <m.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-red-500 dark:text-red-400', className)}
      initial={{ scale: 0, opacity: 0, rotate: -45 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotate: 0,
        x: [0, -4, 4, -4, 4, -2, 2, 0], // Shake animation
      }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
        x: {
          duration: 0.4,
          delay: 0.1,
          ease: 'easeInOut',
        },
      }}
    >
      <m.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      <m.path
        d="M9 9L15 15M15 9L9 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.15, ease: 'easeOut' }}
      />
    </m.svg>
  )
}
