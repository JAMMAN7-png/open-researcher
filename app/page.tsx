import { Metadata } from 'next'
import OpenResearcherContent from './open-researcher/open-researcher-content'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Start your AI-powered web research journey with Open Researcher. Combine Firecrawl web scraping with Claude AI for intelligent, interactive research with real-time thinking visualization.',
  openGraph: {
    title: 'Open Researcher - Start Your Research',
    description: 'AI-powered web research assistant combining Firecrawl and Claude AI',
    type: 'website',
  },
}

export default function Home() {
  return <OpenResearcherContent />
}
