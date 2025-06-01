import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sources = await prisma.bibleSource.findMany({
      include: {
        versions: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = sources.map(source => ({
      sourceId: source.identifier, // Using identifier for client-side consistency if needed
      sourceName: source.name,
      dbSourceId: source.id, // Actual DB ID
      versions: source.versions.map(version => ({
        id: version.id, // Actual DB ID
        identifier: version.identifier, // e.g., "rvsn"
        name: version.name,
        language: version.language,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Bibles GET] Error:', error);
    return NextResponse.json({ message: 'Failed to fetch Bible list', error: (error as Error).message }, { status: 500 });
  }
}
