import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import VerseQueryParser, { ParsedVerseQuery } from '@/services/verse-parser/verse-query-parser';
import { GodpeopleBibleService } from '@/services/bible-sources/godpeople.service';
import { PowerPointService } from '@/services/powerpoint.service';
// Ensure these types are defined in your types directory or locally if not already
interface BibleVerse {
  bibleName: string;
  bookName: string;
  chapterNumber: number;
  verseNumber: number;
  text: string;
}
interface MultiVersionVerse {
  mainBookName: string;
  mainChapterNumber: number;
  mainVerseNumber: number;
  verses: BibleVerse[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Ensure options are correctly unpacked or defaulted
    const { bibleVersionDbIds, query, options: requestOptions } = body;

    if (!bibleVersionDbIds || !Array.isArray(bibleVersionDbIds) || bibleVersionDbIds.length === 0 || !query) {
      return NextResponse.json({ message: 'Missing required fields: bibleVersionDbIds (array) and query' }, { status: 400 });
    }

    const primaryVersionBooks = await prisma.book.findMany({
        where: { versionId: bibleVersionDbIds[0] },
        orderBy: { order: 'asc' }
    });
    if (!primaryVersionBooks || primaryVersionBooks.length === 0) {
        return NextResponse.json({ message: `No books found for the primary Bible version ID: ${bibleVersionDbIds[0]}` }, { status: 404 });
    }
    const parser = new VerseQueryParser(primaryVersionBooks);
    const parsedQueries = parser.parse(query);

    if (parsedQueries.length === 0) {
      return NextResponse.json({ message: 'Failed to parse verse query or query is empty.' }, { status: 400 });
    }

    const allVersesForPpt: MultiVersionVerse[] = [];
    for (const pq of parsedQueries) {
      for (let chap = pq.startChapter; chap <= pq.endChapter; chap++) {
        const startV = (chap === pq.startChapter) ? pq.startVerse : 1;
        const endV = (chap === pq.endChapter) ? pq.endVerse : 200;

        const chapterVersesMap = new Map<number, MultiVersionVerse>();
        for (const versionDbId of bibleVersionDbIds) {
          const versionInfo = await prisma.bibleVersion.findUnique({ where: { id: versionDbId }, include: { source: true } });
          // Use the dbBookId from the parsed query, which is tied to the primary parsing version.
          // We need to find the equivalent book in the current versionDbId.
          const bookInfo = await prisma.book.findFirst({
            where: {
              versionId: versionDbId,
              // Assuming book names are canonical for lookup after parsing.
              // Or, use 'order' if BookKey was part of ParsedVerseQuery
              name: pq.bookName
            }
          });

          if (!versionInfo || !bookInfo) {
            console.warn(`Skipping version ${versionDbId} or book ${pq.bookName} as info not found.`);
            continue;
          }

          let fetchedVerses: { number: number; text: string; }[] = [];
          if (versionInfo.source.identifier === 'godpeople') {
             fetchedVerses = await GodpeopleBibleService.getVerses(versionInfo.identifier, bookInfo.abbreviation, chap);
          } else {
            console.warn(`Bible source ${versionInfo.source.identifier} not yet supported for fetching.`);
            continue;
          }

          fetchedVerses.forEach(fv => {
            if (fv.number >= startV && fv.number <= endV) {
              let mvVerse = chapterVersesMap.get(fv.number);
              if (!mvVerse) {
                mvVerse = {
                  mainBookName: bookInfo.name,
                  mainChapterNumber: chap,
                  mainVerseNumber: fv.number,
                  verses: [],
                };
                chapterVersesMap.set(fv.number, mvVerse);
              }
              mvVerse.verses.push({
                bibleName: versionInfo.name,
                bookName: bookInfo.name,
                chapterNumber: chap,
                verseNumber: fv.number,
                text: fv.text,
              });
            }
          });
        }
        Array.from(chapterVersesMap.values())
          .sort((a, b) => a.mainVerseNumber - b.mainVerseNumber)
          .forEach(mv => allVersesForPpt.push(mv));
      }
    }

    if (allVersesForPpt.length === 0) {
      return NextResponse.json({ message: 'No verses found for the given query and versions.' }, { status: 404 });
    }

    const pptServiceOptions = {
        maxLinesPerSlide: requestOptions?.maxLinesPerSlide ?? DEFAULT_PPT_OPTIONS.maxLinesPerSlide,
        showBookNameOnSlide: requestOptions?.showBookNameOnSlide ?? DEFAULT_PPT_OPTIONS.showBookNameOnSlide,
        showChapterNumberOnSlide: requestOptions?.showChapterNumberOnSlide ?? DEFAULT_PPT_OPTIONS.showChapterNumberOnSlide,
        splitChaptersIntoFiles: requestOptions?.splitChaptersIntoFiles ?? DEFAULT_PPT_OPTIONS.splitChaptersIntoFiles,
        // titleSlide: { title: query } // Keep it simple for now
        // For titleSlide, we should pass the requestOptions.title if available, or construct one.
        // The service handles cases where titleSlide or its properties are undefined.
        titleSlide: requestOptions?.titleSlide ?? { title: query }
    };

    const { buffer, filename, contentType } = await PowerPointService.generatePresentation(allVersesForPpt, pptServiceOptions);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('[API GeneratePPT POST] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Adding more detail to the error response if possible
    const errorDetail = error instanceof Error && process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error';
    return NextResponse.json({ message: `Failed to generate PPT: ${errorMessage}`, errorDetails: errorDetail }, { status: 500 });
  }
}
