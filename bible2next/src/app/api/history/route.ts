import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const jobHistory = await prisma.jobHistory.findMany({
      orderBy: {
        createdAt: 'desc', // Show newest first
      },
      // Add pagination later if needed, e.g., take: 50
    });
    return NextResponse.json(jobHistory);
  } catch (error) {
    console.error('[API History GET] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to fetch job history', error: errorMessage }, { status: 500 });
  }
}
