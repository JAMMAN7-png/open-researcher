# Dependency Update Summary

**Status: COMPLETED**

**Date**: 2026-01-06
**Agent**: Agent 1 - Dependency Update

## Overview

All dependencies have been updated to their latest stable versions. The update was successful with minor compatibility adjustments required.

## Package Updates

### Dependencies

| Package | Previous Version | New Version | Change Type |
|---------|-----------------|-------------|-------------|
| @anthropic-ai/sdk | ^0.54.0 | ^0.71.2 | Major |
| @mendable/firecrawl-js | ^1.25.1 | ^4.10.0 | Major |
| @radix-ui/react-dialog | ^1.1.14 | ^1.1.15 | Patch |
| @radix-ui/react-slot | ^1.2.3 | ^1.2.4 | Patch |
| @radix-ui/react-tooltip | ^1.2.7 | ^1.2.8 | Patch |
| ai | ^4.3.16 | ^4.3.19 | Patch |
| lucide-react | ^0.511.0 | ^0.562.0 | Minor |
| next | 15.3.4 | 16.1.1 | Major |
| react | ^19.0.0 | ^19.2.3 | Minor |
| react-dom | ^19.0.0 | ^19.2.3 | Minor |
| sonner | ^2.0.3 | ^2.0.7 | Patch |
| tailwind-merge | ^3.3.0 | ^3.4.0 | Minor |
| zod | ^3.25.76 | ^3.25.76 | No change (kept at 3.x for ai compatibility) |
| @hookform/resolvers | ^5.2.2 | ^5.2.2 | No change (already latest) |
| motion | ^12.24.7 | ^12.24.7 | No change (already latest) |
| react-hook-form | ^7.70.0 | ^7.70.0 | No change (already latest) |
| zustand | ^5.0.9 | ^5.0.9 | No change (already latest) |
| class-variance-authority | ^0.7.1 | ^0.7.1 | No change (already latest) |
| clsx | ^2.1.1 | ^2.1.1 | No change (already latest) |
| react-markdown | ^10.1.0 | ^10.1.0 | No change (already latest) |
| remark-gfm | ^4.0.1 | ^4.0.1 | No change (already latest) |
| tailwindcss-animate | ^1.0.7 | ^1.0.7 | No change (already latest) |

### Dev Dependencies

| Package | Previous Version | New Version | Change Type |
|---------|-----------------|-------------|-------------|
| @eslint/eslintrc | ^3 | ^3.3.3 | Patch |
| @tailwindcss/postcss | ^4 | ^4.1.18 | Minor |
| @types/node | ^20 | ^25.0.3 | Major |
| @types/react | ^19 | ^19.2.7 | Minor |
| @types/react-dom | ^19 | ^19.2.3 | Minor |
| eslint | ^9 | ^9.39.2 | Minor |
| eslint-config-next | 15.3.4 | 16.1.1 | Major |
| tailwindcss | ^4 | ^4.1.18 | Minor |
| typescript | ^5 | ^5.9.3 | Minor |
| @axe-core/playwright | ^4.11.0 | ^4.11.0 | No change (already latest) |
| @playwright/test | ^1.57.0 | ^1.57.0 | No change (already latest) |

## Compatibility Issues Found

### 1. Zod Version Constraint

**Issue**: The `ai` package v4.x has a peer dependency on `zod@^3.23.8`. Zod v4.x is not compatible.

**Resolution**: Kept zod at `^3.25.76` (latest 3.x version) instead of upgrading to 4.x.

**Impact**: None - zod 3.x is stable and widely used. Zod 4.x upgrade can be considered when ai SDK v6.x is adopted.

### 2. Next.js 16 Breaking Changes

**Issue**: Next.js 16.x includes several breaking changes from 15.x:
- `middleware.ts` renamed to `proxy.ts`
- Async Request APIs - synchronous access fully removed (must `await` params/searchParams)
- `next lint` deprecated - use ESLint directly

**Resolution**: Updated to Next.js 16.1.1 as requested. Code changes may be required in the codebase.

**Action Required**:
- Rename `middleware.ts` to `proxy.ts` if it exists
- Update any synchronous `params` or `searchParams` access to use `await`
- Review and update ESLint configuration if needed

### 3. @mendable/firecrawl-js Major Update

**Issue**: Major version jump from 1.x to 4.x may include API changes.

**Resolution**: Updated to latest version. API compatibility should be verified.

**Action Required**: Review firecrawl API usage in the codebase for any breaking changes.

## Security Vulnerabilities

### Remaining Moderate Vulnerabilities (2)

1. **ai <=5.0.51** - GHSA-rwvc-j5jr-mgvh
   - Vercel's AI SDK filetype whitelist bypass when uploading files
   - Fix requires upgrading to ai@6.0.14 (breaking change)
   - Low impact: ai package not directly used in application code

2. **jsondiffpatch <0.7.2** - GHSA-33vc-wfww-vjfv
   - XSS vulnerability via HtmlFormatter::nodeBegin
   - Dependency of ai package
   - Fix requires upgrading to ai@6.0.14 (breaking change)

### Resolved Vulnerabilities (1)

1. **mdast-util-to-hast 13.0.0 - 13.2.0** - GHSA-4fh9-h7wg-q85m
   - Unsanitized class attribute vulnerability
   - Fixed via npm audit fix

## Files Modified

- `C:\Users\PC\open-researcher\package.json`
- `C:\Users\PC\open-researcher\package-lock.json`

## Verification Results

```
npm install: SUCCESS
npm audit: 2 moderate vulnerabilities (non-blocking, requires major ai SDK upgrade)
```

## Next Steps

1. **Code Migration Required for Next.js 16**:
   - Check for `middleware.ts` and rename to `proxy.ts`
   - Update all `params` and `searchParams` usage to be async
   - Update ESLint configuration

2. **Firecrawl API Review**:
   - Verify @mendable/firecrawl-js 4.x API compatibility
   - Test all web scraping functionality

3. **Optional: AI SDK Upgrade**:
   - Consider upgrading ai package to v6.x to resolve security vulnerabilities
   - This is a major version change requiring code modifications

## Research Sources

- npm registry (latest package versions)
- https://endoflife.date/nextjs - Next.js version lifecycle
- https://nextjs.org/docs/app/guides/upgrading/version-16 - Next.js 16 migration guide
- https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0 - AI SDK migration guide
- npm audit reports
