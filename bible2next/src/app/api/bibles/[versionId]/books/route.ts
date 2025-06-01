import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { versionId: string } }
) {
  const versionId = params.versionId;
  if (!versionId) {
    return NextResponse.json({ message: 'Bible Version ID is required' }, { status: 400 });
  }

  try {
    const books = await prisma.book.findMany({
      where: {
        versionId: versionId,
      },
      orderBy: {
        order: 'asc',
      },
    });

    if (!books || books.length === 0) {
      // Check if the version itself exists to give a better error
      const version = await prisma.bibleVersion.findUnique({ where: { id: versionId }});
      if (!version) {
        return NextResponse.json({ message: `Bible version with ID ${versionId} not found.` }, { status: 404 });
      }
      return NextResponse.json({ message: `No books found for Bible version ID ${versionId}.` }, { status: 404 });
    }

    // We return the DB book ID as 'id'
    // The original script had book.chapterCount here.
    // My schema for Book does not have chapterCount. It was removed.
    // So, I will omit it from the response mapping.
    return NextResponse.json(books.map(book => ({
        id: book.id,
        name: book.name,
        abbreviation: book.abbreviation,
        order: book.order,
        // chapterCount: book.chapterCount, // This field is not in the Book model
    })));

  } catch (error) {
    console.error(`[API Bibles/${versionId}/Books GET] Error:`, error);
    return NextResponse.json({ message: 'Failed to fetch book list', error: (error as Error).message }, { status: 500 });
  }
}
