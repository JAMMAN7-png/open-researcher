import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi-spec';

// Route segment configuration for Next.js 15+
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

