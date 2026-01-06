'use client';

import dynamic from 'next/dynamic';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUIComponent = dynamic(
  () => import('@/components/swagger-ui').then((mod) => mod.SwaggerUIComponent),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading API documentation...</p>
        </div>
      </div>
    ),
  }
);

export default function DocsPage() {
  return (
    <>
      <title>API Documentation | Open Researcher</title>
      <meta name="description" content="Open Researcher API documentation with interactive examples" />
      <SwaggerUIComponent url="/api/docs" />
    </>
  );
}
