'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

interface SwaggerUIComponentProps {
  url: string;
}

export function SwaggerUIComponent({ url }: SwaggerUIComponentProps) {
  return (
    <div className="swagger-ui-wrapper">
      <SwaggerUI url={url} />
      <style jsx global>{`
        .swagger-ui-wrapper {
          background: #fafafa;
          min-height: 100vh;
        }
        
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .info {
          margin: 20px 0;
        }
        
        .swagger-ui .info .title {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }
        
        .swagger-ui .info .description {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }
        
        .swagger-ui .opblock-tag {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }
        
        .swagger-ui .opblock .opblock-summary-operation-id,
        .swagger-ui .opblock .opblock-summary-path,
        .swagger-ui .opblock .opblock-summary-path__deprecated {
          font-family: var(--font-geist-mono), monospace;
        }
        
        .swagger-ui .btn {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }
        
        .swagger-ui textarea,
        .swagger-ui input[type="text"],
        .swagger-ui input[type="password"] {
          font-family: var(--font-geist-mono), monospace;
        }
        
        .swagger-ui .response-col_description__inner code,
        .swagger-ui .parameters-col_description code {
          font-family: var(--font-geist-mono), monospace;
        }
        
        /* Dark mode styles */
        @media (prefers-color-scheme: dark) {
          .swagger-ui-wrapper {
            background: #1a1a1a;
          }
          
          .swagger-ui {
            filter: invert(88%) hue-rotate(180deg);
          }
          
          .swagger-ui .information-container img {
            filter: invert(100%) hue-rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}

