import { Metadata } from 'next'
import OpenResearcherContent from './open-researcher-content'

export const metadata: Metadata = {
  title: 'Research Assistant',
  description: 'AI-powered web research assistant with real-time thinking visualization, deep web scraping, and comprehensive content analysis using Firecrawl and Claude AI.',
  openGraph: {
    title: 'Open Researcher - AI Research Assistant',
    description: 'Deep web research with AI-powered analysis and real-time thinking visualization',
    type: 'website',
  },
  alternates: {
    canonical: '/open-researcher',
  },
}

export default function OpenResearcherPage() {
  return <OpenResearcherContent />
}