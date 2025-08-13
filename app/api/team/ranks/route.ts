// Deprecated: This route moved to /api/team/rankings. Keeping a stub to avoid breaking callers.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.redirect(new URL('/api/team/rankings', 'http://localhost'));
}

export async function GET() {
  return NextResponse.redirect(new URL('/api/team/rankings', 'http://localhost'));
}
