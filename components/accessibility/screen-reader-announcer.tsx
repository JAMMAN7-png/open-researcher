'use client'

import { useEffect, useState, useCallback } from 'react'

interface Announcement {
  id: string
  message: string
  priority: 'polite' | 'assertive'
}

// Global announcement queue
let announceCallback: ((message: string, priority?: 'polite' | 'assertive') => void) | null = null

/**
 * Announces a message to screen readers
 * @param message The message to announce
 * @param priority 'polite' for non-urgent, 'assertive' for urgent announcements
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (announceCallback) {
    announceCallback(message, priority)
  }
}

/**
 * Screen reader announcer component that provides live region announcements
 * Place this component once at the root of your application
 */
export function ScreenReaderAnnouncer() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [assertiveAnnouncements, setAssertiveAnnouncements] = useState<Announcement[]>([])

  const addAnnouncement = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const announcement: Announcement = { id, message, priority }

    if (priority === 'assertive') {
      setAssertiveAnnouncements(prev => [...prev, announcement])
    } else {
      setAnnouncements(prev => [...prev, announcement])
    }

    // Clear announcement after it's been read
    setTimeout(() => {
      if (priority === 'assertive') {
        setAssertiveAnnouncements(prev => prev.filter(a => a.id !== id))
      } else {
        setAnnouncements(prev => prev.filter(a => a.id !== id))
      }
    }, 1000)
  }, [])

  useEffect(() => {
    announceCallback = addAnnouncement
    return () => {
      announceCallback = null
    }
  }, [addAnnouncement])

  return (
    <>
      {/* Polite live region - for non-urgent announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements.map(a => (
          <span key={a.id}>{a.message}</span>
        ))}
      </div>

      {/* Assertive live region - for urgent announcements */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveAnnouncements.map(a => (
          <span key={a.id}>{a.message}</span>
        ))}
      </div>
    </>
  )
}
