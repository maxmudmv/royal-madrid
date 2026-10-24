import { NextResponse } from 'next/server';
import { searchGlobalArchive } from '@/lib/queries';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') || '';
  if (!q.trim()) {
    return NextResponse.json({
      query: '',
      results: {
        players: [],
        matches: [],
        seasons: [],
        managers: [],
        transfers: [],
        historicalEvents: [],
      },
    });
  }

  const results = await searchGlobalArchive(q);
  return NextResponse.json({
    query: q,
    results,
  });
}
