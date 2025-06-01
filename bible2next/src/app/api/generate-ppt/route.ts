import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import VerseQueryParser from '@/services/verse-parser/verse-query-parser';
import { GodpeopleBibleService } from '@/services/bible-sources/godpeople.service';
import { PowerPointService, PptGenerationOptions } from '@/services/powerpoint.service'; // Import PptGenerationOptions
import { JobStatus } from '@prisma/client';
import { AVAILABLE_THEMES, AVAILABLE_FONTS, ThemeName } from '@/types/bible';


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

interface SelectedBibleVersionInfoForHistory {
    dbVersionId: string;
    versionName: string;
    identifier: string;
    language: string;
    dbSourceId: string;
    sourceName: string;
    sourceIdentifier: string;
}

// Define default PPT options structure for the backend
const DEFAULT_API_PPT_OPTIONS: PptGenerationOptions = {
  splitChaptersIntoFiles: false,
  maxLinesPerSlide: 0,
  showBookNameOnSlide: 'firstOfChapter',
  showChapterNumberOnSlide: 'firstOfChapter',
  themeName: 'defaultLight',
  bodyFont: 'Arial',
  titleFont: 'Arial',
  // titleSlide is optional and handled if provided by client or default in service
};


export async function POST(request: Request) {
  let jobDetailsForHistory = {
    queryString: '',
    bibleVersionsUsed: [] as SelectedBibleVersionInfoForHistory[],
    optionsUsed: {} as PptGenerationOptions, // Explicitly type this
    status: JobStatus.FAILED,
    outputFilename: null as string | null,
    errorMessage: null as string | null,
  };

  try {
    const body = await request.json();
    const { bibleVersionDbIds, query, options: requestOptionsFromClient } = body;

    // Merge client options with defaults to ensure all fields are present for saving and for service
    const currentPptOptions: PptGenerationOptions = {
      ...DEFAULT_API_PPT_OPTIONS, // Start with defaults
      ...(requestOptionsFromClient || {}), // Spread client options, which might be partial
      // titleSlide needs to be explicitly handled if it's just a string (query) vs. an object
      titleSlide: requestOptionsFromClient?.titleSlide ?? { title: query },
    };
    // Ensure themeName and fonts are valid, fallback to default if not.
    currentPptOptions.themeName = AVAILABLE_THEMES.includes(currentPptOptions.themeName as ThemeName) ? currentPptOptions.themeName : DEFAULT_API_PPT_OPTIONS.themeName;
    currentPptOptions.bodyFont = AVAILABLE_FONTS.includes(currentPptOptions.bodyFont!) ? currentPptOptions.bodyFont : DEFAULT_API_PPT_OPTIONS.bodyFont;
    currentPptOptions.titleFont = AVAILABLE_FONTS.includes(currentPptOptions.titleFont!) ? currentPptOptions.titleFont : DEFAULT_API_PPT_OPTIONS.titleFont;


    jobDetailsForHistory.queryString = query;
    jobDetailsForHistory.optionsUsed = currentPptOptions; // Save the fully resolved options

    if (!bibleVersionDbIds || !Array.isArray(bibleVersionDbIds) || bibleVersionDbIds.length === 0 || !query) {
      jobDetailsForHistory.errorMessage = 'Missing required fields: bibleVersionDbIds (array) and query';
      try { await prisma.jobHistory.create({ data: { ...jobDetailsForHistory, bibleVersionsUsed: jobDetailsForHistory.bibleVersionsUsed as any, optionsUsed: jobDetailsForHistory.optionsUsed as any } }); } catch (histError) { console.error("Failed to save error job history:", histError); }
      return NextResponse.json({ message: jobDetailsForHistory.errorMessage }, { status: 400 });
    }

    const selectedVersionsDataForHistory: SelectedBibleVersionInfoForHistory[] = [];
    for (const id of bibleVersionDbIds) {
        const versionWithSource = await prisma.bibleVersion.findUnique({
            where: { id }, include: { source: true }
        });
        if (versionWithSource) {
            selectedVersionsDataForHistory.push({
                dbVersionId: versionWithSource.id, versionName: versionWithSource.name,
                identifier: versionWithSource.identifier, language: versionWithSource.language,
                dbSourceId: versionWithSource.source.id, sourceName: versionWithSource.source.name,
                sourceIdentifier: versionWithSource.source.identifier,
            });
        }
    }
    jobDetailsForHistory.bibleVersionsUsed = selectedVersionsDataForHistory;

    const primaryVersionBooks = await prisma.book.findMany({
        where: { versionId: bibleVersionDbIds[0] }, orderBy: { order: 'asc' }
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
          const bookInfo = await prisma.book.findFirst({ where: { versionId: versionDbId, name: pq.bookName }});
          if (!versionInfoFromJob || !bookInfo) { console.warn(`Skipping version ${versionDbId} or book ${pq.bookName}.`); continue; }
          let fetchedVerses: { number: number; text: string; }[] = [];
          if (versionInfoFromJob.sourceIdentifier === 'godpeople') {
             fetchedVerses = await GodpeopleBibleService.getVerses(versionInfoFromJob.identifier, bookInfo.abbreviation, chap);
          } else { console.warn(`Bible source ${versionInfoFromJob.sourceName} not supported.`); continue; }
          fetchedVerses.forEach(fv => {
            if (fv.number >= startV && fv.number <= endV) {
              let mvVerse = chapterVersesMap.get(fv.number);
              if (!mvVerse) {
                mvVerse = { mainBookName: bookInfo.name, mainChapterNumber: chap, mainVerseNumber: fv.number, verses: [] };
                chapterVersesMap.set(fv.number, mvVerse);
              }
              mvVerse.verses.push({ bibleName: versionInfoFromJob.versionName, bookName: bookInfo.name, chapterNumber: chap, verseNumber: fv.number, text: fv.text });
            }
          });
        }
        Array.from(chapterVersesMap.values()).sort((a,b)=>a.mainVerseNumber-b.mainVerseNumber).forEach(mv=>allVersesForPpt.push(mv));
      }
    }


    if (allVersesForPpt.length === 0) {
      jobDetailsForHistory.errorMessage = 'No verses found for the given query and versions.';
      try { await prisma.jobHistory.create({ data: { ...jobDetailsForHistory, bibleVersionsUsed: jobDetailsForHistory.bibleVersionsUsed as any, optionsUsed: jobDetailsForHistory.optionsUsed as any } }); } catch (histError) { console.error("Failed to save error job history:", histError); }
      return NextResponse.json({ message: jobDetailsForHistory.errorMessage }, { status: 404 });
    }

    // Use currentPptOptions (which includes defaults and client overrides, and validated theme/fonts) for the service
    // titleSlide is already part of currentPptOptions, potentially set from request or defaulted to {title: query}
    const pptServiceFinalOptions: PptGenerationOptions = currentPptOptions;

    const { buffer, filename, contentType } = await PowerPointService.generatePresentation(allVersesForPpt, pptServiceFinalOptions);

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
    // Use currentPptOptions if available (populated early), otherwise the initial empty object might lead to incomplete history on very early errors.
    // However, optionsUsed is set right after body parsing, so it should be populated with at least client options or defaults.
    // No need to reset to DEFAULT_API_PPT_OPTIONS unless currentPptOptions isn't populated yet.
    // jobDetailsForHistory.optionsUsed = jobDetailsForHistory.optionsUsed && Object.keys(jobDetailsForHistory.optionsUsed).length > 0 ? jobDetailsForHistory.optionsUsed : DEFAULT_API_PPT_OPTIONS;

    try { await prisma.jobHistory.create({ data: { ...jobDetailsForHistory, bibleVersionsUsed: jobDetailsForHistory.bibleVersionsUsed as any, optionsUsed: jobDetailsForHistory.optionsUsed as any } }); } catch (histError) { console.error("Failed to save final error job history:", histError); }

    const errorDetail = error instanceof Error && process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error';
    return NextResponse.json({ message: `Failed to generate PPT: ${jobDetailsForHistory.errorMessage}`, errorDetails: errorDetail }, { status: 500 });
  }
}
