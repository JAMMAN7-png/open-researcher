<h1 align="center">Open Researcher</h1>

<p align="center">
  <img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGJncnpmamlzc3RnMzNpeXNwcGk1Z3kwemd6c2w1ZDdxcGZwdWJwdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hhNLykzY76wu7oGFU0/giphy.gif" alt="Open Researcher Demo" width="100%">
</p>

A powerful AI-powered research tool that combines Firecrawl's web scraping capabilities with advanced AI reasoning to help you search, analyze, and understand web content.

## Features

- **AI-Powered Search**: Intelligently search and analyze web content
- **Real-time Web Scraping**: Powered by Firecrawl for accurate, up-to-date information
- **Thinking Display**: See the AI's reasoning process in real-time
- **Smart Citations**: Automatic source tracking and citation generation
- **Split View Interface**: Side-by-side view of chat and search results
- **Smooth Animations**: LazyMotion-powered animations for optimal bundle size
- **Form Validation**: Type-safe forms with react-hook-form and Zod
- **Dark Mode Support**: Full light/dark theme support
- **Responsive Design**: Mobile-first responsive layout
- **Accessibility**: WCAG-compliant with axe-core testing

## Prerequisites

- Node.js 18+ and npm
- API Keys (at least one required):
  - `ANTHROPIC_API_KEY` - For AI functionality
  - `FIRECRAWL_API_KEY` - For web scraping (can be added via UI)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/mendableai/open-researcher
   cd open-researcher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key
   FIRECRAWL_API_KEY=your_firecrawl_api_key  # Optional, can be added via UI
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key for AI functionality |
| `FIRECRAWL_API_KEY` | No* | Firecrawl API key for web scraping |

*Can be provided through the UI if not set in environment variables

## Getting API Keys

- **Anthropic API Key**: Visit [Anthropic Console](https://console.anthropic.com/)
- **Firecrawl API Key**: Visit [Firecrawl](https://www.firecrawl.dev/)

## Usage

1. **Basic Search**: Enter your query in the chat interface
2. **Web Analysis**: The AI will automatically search and analyze relevant web content
3. **Follow-up Questions**: Ask follow-up questions to dive deeper
4. **View Sources**: Click on citations to see source information

## Project Structure

```
open-researcher/
├── app/
│   ├── api/                 # API routes (research, scrape, check-env)
│   ├── open-researcher/     # Main application page
│   ├── globals.css          # Global styles and animations
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # Shadcn/UI components (50+)
│   ├── thinking-chat.tsx    # Main chat interface
│   ├── search-results-display.tsx  # Browser-style results UI
│   ├── motion-provider.tsx  # LazyMotion provider
│   └── ...                  # Additional components
├── docs/                    # Documentation
│   ├── RESEARCH_FLOW.md     # Research flow architecture
│   ├── TECHNICAL_ARCHITECTURE.md  # Technical overview
│   ├── UX-DOCUMENTATION.md  # User experience guide
│   └── VISUAL_DESIGN_SYSTEM.md    # Design system reference
├── lib/
│   ├── open-researcher-agent.ts   # Core AI agent logic
│   └── utils.ts             # Utility functions
├── tests/                   # Playwright E2E tests
│   ├── e2e/                 # Test files
│   └── pages/               # Page object models
└── public/                  # Static assets
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Research Flow Architecture](./docs/RESEARCH_FLOW.md)** - How queries become research results
- **[Technical Architecture](./docs/TECHNICAL_ARCHITECTURE.md)** - System architecture and components
- **[UX Documentation](./docs/UX-DOCUMENTATION.md)** - User experience and interaction patterns
- **[Visual Design System](./docs/VISUAL_DESIGN_SYSTEM.md)** - Colors, typography, and animations
- **[CLAUDE.md](./CLAUDE.md)** - Detailed technical documentation for developers

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run E2E tests
npx playwright test

# Run E2E tests with UI
npx playwright test --ui

# Run tests in specific browser
npx playwright test --project=chromium

# View test report
npx playwright show-report
```

## Tech Stack

### Core
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with concurrent features
- **TypeScript 5** - Type safety

### Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Component library

### State & Forms
- **Zustand** - Lightweight state management
- **React Hook Form** - Performant form handling
- **Zod** - TypeScript-first schema validation

### Animation
- **Motion (framer-motion)** - Animation library with LazyMotion

### AI & Data
- **Anthropic Claude** - AI model (claude-opus-4)
- **Firecrawl** - Web scraping and search

### Testing
- **Playwright** - E2E testing framework
- **@axe-core/playwright** - Accessibility testing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Firecrawl](https://www.firecrawl.dev/) for powerful web scraping
- Powered by [Anthropic's Claude](https://www.anthropic.com/) for AI capabilities
- UI components from [Radix UI](https://www.radix-ui.com/) and [shadcn/ui](https://ui.shadcn.com/)