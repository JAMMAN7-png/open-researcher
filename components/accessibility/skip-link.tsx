'use client'

import { cn } from '@/lib/utils'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * Skip link component for keyboard navigation
 * Allows users to skip to main content
 */
export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Hidden by default, shown on focus
        "sr-only focus:not-sr-only",
        // Positioning when visible
        "focus:fixed focus:top-4 focus:left-4 focus:z-[100]",
        // Styling when visible
        "focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-white",
        "focus:rounded-md focus:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2",
        // Animation
        "transition-all duration-200",
        className
      )}
    >
      {children}
    </a>
  )
}

/**
 * Skip links container with common navigation targets
 */
export function SkipLinks() {
  return (
    <div className="skip-links">
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      <SkipLink href="#search-input">
        Skip to search
      </SkipLink>
    </div>
  )
}
