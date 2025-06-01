import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import VerseQueryParser from '@/services/verse-parser/verse-query-parser';
import { GodpeopleBibleService } from '@/services/bible-sources/godpeople.service';
import { PowerPointService } from '@/services/powerpoint.service';
import { JobStatus } from '@prisma/client';

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

// For storing in JobHistory - THIS IS THE KEY STRUCTURE TO GET RIGHT
interface SelectedBibleVersionInfoForHistory {
    dbVersionId: string;
    versionName: string;
    identifier: string; // e.g. "rvsn" (version identifier)
    language: string;
    dbSourceId: string; // Actual DB ID of the source
    sourceName: string;
    sourceIdentifier: string; // e.g. "godpeople" (source identifier)
}

export async function POST(request: Request) {
  let jobDetailsForHistory = {
    queryString: '',
    bibleVersionsUsed: [] as SelectedBibleVersionInfoForHistory[], // Use the refined interface
    optionsUsed: {},
    status: JobStatus.FAILED,
    outputFilename: null as string | null,
    errorMessage: null as string | null,
  };

  try {
    const body = await request.json();
    const { bibleVersionDbIds, query, options: requestOptions } = body;

    jobDetailsForHistory.queryString = query;
    jobDetailsForHistory.optionsUsed = requestOptions || {};

    if (!bibleVersionDbIds || !Array.isArray(bibleVersionDbIds) || bibleVersionDbIds.length === 0 || !query) {
      jobDetailsForHistory.errorMessage = 'Missing required fields: bibleVersionDbIds (array) and query';
      // Prisma expects Json fields to be Prisma.JsonNull if they are null, or a valid JSON structure.
      // An empty array is fine for bibleVersionsUsed. optionsUsed might be an empty object.
      try { await prisma.jobHistory.create({ data: { ...jobDetailsForHistory, bibleVersionsUsed: jobDetailsForHistory.bibleVersionsUsed as any, optionsUsed: jobDetailsForHistory.optionsUsed as any } }); } catch (histError) { console.error("Failed to save error job history:", histError); }
      return NextResponse.json({ message: jobDetailsForHistory.errorMessage }, { status: 400 });
    }

    const selectedVersionsDataForHistory: SelectedBibleVersionInfoForHistory[] = [];
    for (const id of bibleVersionDbIds) {
        const versionWithSource = await prisma.bibleVersion.findUnique({
            where: { id },
            include: { source: true } // source is included
        });
        if (versionWithSource) {
            selectedVersionsDataForHistory.push({
                dbVersionId: versionWithSource.id,
                versionName: versionWithSource.name,
                identifier: versionWithSource.identifier, // This is version identifier
                language: versionWithSource.language,
                dbSourceId: versionWithSource.source.id, // Explicitly save source DB ID
                sourceName: versionWithSource.source.name,
                sourceIdentifier: versionWithSource.source.identifier, // Save source identifier too
            });
        }
    }
    jobDetailsForHistory.bibleVersionsUsed = selectedVersionsDataForHistory;

    const primaryVersionBooks = await prisma.book.findMany({
        where: { versionId: bibleVersionDbIds[0] },
        orderBy: { order: 'asc' }
    });
    if (!primaryVersionBooks || primaryVersionBooks.length === 0) {
        jobDetailsForHistory.errorMessage = `No books found for the primary Bible version ID: ${bibleVersionDbIds[0]}`;
        try { await prisma.jobHistory.create({ data: { ...jobDetailsForHistory, bibleVersionsUsed: jobDetailsForHistory.bibleVersionsUsed as any, optionsUsed: jobDetailsForHistory.optionsUsed as any } }); } catch (histError) { console.error("Failed to save error job history:", histError); }
        return NextResponse.json({ message: jobDetailsForHistory.errorMessage }, { status: 404 });
    }
    const parser = new VerseQueryParser(primaryVersionBooks);
    const parsedQueries = parser.parse(query);

    if (parsedQueries.length === 0) {
      jobDetailsForHistory.errorMessage = 'Failed to parse verse query or query is empty.';
      try { await prisma.jobHistory.create({ data: { ...jobDetailsForHistory, bibleVersionsUsed: jobDetailsForHistory.bibleVersionsUsed as any, optionsUsed: jobDetailsForHistory.optionsUsed as any } }); } catch (histError) { console.error("Failed to save error job history:", histError); }
      return NextResponse.json({ message: jobDetailsForHistory.errorMessage }, { status: 400 });
    }

    const allVersesForPpt: MultiVersionVerse[] = [];
    for (const pq of parsedQueries) {
      for (let chap = pq.startChapter; chap <= pq.endChapter; chap++) {
        const startV = (chap === pq.startChapter) ? pq.startVerse : 1;
        const endV = (chap === pq.endChapter) ? pq.endVerse : 200;

        const chapterVersesMap = new Map<number, MultiVersionVerse>();
        for (const versionDbId of bibleVersionDbIds) {
          const versionInfoFromJob = selectedVersionsDataForHistory.find(v => v.dbVersionId === versionDbId);
          const bookInfo = await prisma.book.findFirst({
            where: { versionId: versionDbId, name: pq.bookName }
          });

          if (!versionInfoFromJob || !bookInfo) {
            console.warn(`Skipping version ${versionDbId} or book ${pq.bookName} as detailed info not found.`);
            continue;
          }

          let fetchedVerses: { number: number; text: string; }[] = [];
          if (versionInfoFromJob.sourceIdentifier === 'godpeople') {
             fetchedVerses = await GodpeopleBibleService.getVerses(versionInfoFromJob.identifier, bookInfo.abbreviation, chap);
          } else {
            console.warn(`Bible source for ${versionInfoFromJob.sourceName} not yet supported for fetching.`);
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
                bibleName: versionInfoFromJob.versionName,
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
      jobDetailsForHistory.errorMessage = 'No verses found for the given query and versions.';
      try { await prisma.jobHistory.create({ data: { ...jobDetailsForHistory, bibleVersionsUsed: jobDetailsForHistory.bibleVersionsUsed as any, optionsUsed: jobDetailsForHistory.optionsUsed as any } }); } catch (histError) { console.error("Failed to save error job history:", histError); }
      return NextResponse.json({ message: jobDetailsForHistory.errorMessage }, { status: 404 });
    }

    const pptServiceOptions = {
        maxLinesPerSlide: requestOptions?.maxLinesPerSlide ?? 0,
        showBookNameOnSlide: requestOptions?.showBookNameOnSlide ?? 'firstOfChapter',
        showChapterNumberOnSlide: requestOptions?.showChapterNumberOnSlide ?? 'firstOfChapter',
        splitChaptersIntoFiles: requestOptions?.splitChaptersIntoFiles ?? false,
        titleSlide: requestOptions?.titleSlide ?? { title: query } // Use requestOptions.titleSlide if available
    };
    jobDetailsForHistory.optionsUsed = pptServiceOptions;

    const { buffer, filename, contentType } = await PowerPointService.generatePresentation(allVersesForPpt, pptServiceOptions);

    jobDetailsForHistory.status = JobStatus.COMPLETED;
    jobDetailsForHistory.outputFilename = filename;
    jobDetailsForHistory.errorMessage = null;
    try { await prisma.jobHistory.create({ data: { ...jobDetailsForHistory, bibleVersionsUsed: jobDetailsForHistory.bibleVersionsUsed as any, optionsUsed: jobDetailsForHistory.optionsUsed as any } }); } catch (histError) { console.error("Failed to save success job history:", histError); }

    return new NextResponse(buffer, {
      status: 200,
      headers: { 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"`, },
    });

  } catch (error) {
    console.error('[API GeneratePPT POST] Error:', error);
    jobDetailsForHistory.errorMessage = error instanceof Error ? error.message : 'Unknown error during PPT generation';
    jobDetailsForHistory.status = JobStatus.FAILED;
    try { await prisma.jobHistory.create({ data: { ...jobDetailsForHistory, bibleVersionsUsed: jobDetailsForHistory.bibleVersionsUsed as any, optionsUsed: jobDetailsForHistory.optionsUsed as any } }); } catch (histError) { console.error("Failed to save final error job history:", histError); }

    const errorDetail = error instanceof Error && process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error';
    return NextResponse.json({ message: `Failed to generate PPT: ${jobDetailsForHistory.errorMessage}`, errorDetails: errorDetail }, { status: 500 });
  }
}
