# Task Completion Checklist

When completing a development task in Open Researcher, follow this checklist:

## Code Quality
- [ ] TypeScript: No type errors or `any` types
- [ ] ESLint: Run `npm run lint` and fix all issues
- [ ] Formatting: Ensure consistent code formatting
- [ ] Imports: Clean up unused imports
- [ ] Console logs: Remove debug console.logs

## Testing
- [ ] Manual testing: Test the feature in development mode
- [ ] Edge cases: Test error scenarios and edge cases
- [ ] Browser testing: Test in different browsers if UI changes
- [ ] Responsive: Check mobile, tablet, and desktop views

## Next.js Specifics
- [ ] Server/Client components: Verify correct use of 'use client' directive
- [ ] API routes: Test all API endpoints
- [ ] Streaming: Verify streaming responses work correctly
- [ ] Error handling: Ensure proper error messages display

## Integration
- [ ] Anthropic API: Verify Claude API integration works
- [ ] Firecrawl API: Test web scraping functionality
- [ ] Environment variables: Check all required env vars are documented

## Documentation
- [ ] Comments: Add meaningful comments for complex logic
- [ ] README: Update if adding new features or changing setup
- [ ] Types: Ensure all TypeScript interfaces are documented

## Git
- [ ] Branch: Work on feature branch, not main
- [ ] Commits: Make atomic, well-described commits
- [ ] Pull request: Create PR with clear description

## Before Deployment
- [ ] Build: Run `npm run build` and ensure no errors
- [ ] Environment: Verify production environment variables
- [ ] Performance: Check for performance issues
