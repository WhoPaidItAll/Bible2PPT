import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';

// Define interfaces for the data and options (assuming they exist from previous step)
// Ensure these are comprehensive enough
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

interface PptGenerationOptions {
  titleSlide?: { title: string; subtitle?: string };
  slideNumberFont?: string;
  slideNumberFontSize?: number;
  maxLinesPerSlide: number;
  showBookNameOnSlide: 'always' | 'firstOfChapter' | 'firstOfBook';
  showChapterNumberOnSlide: 'always' | 'firstOfChapter' | 'firstOfBook';
  splitChaptersIntoFiles?: boolean; // Added this option
}

const DEFAULT_PPT_OPTIONS: PptGenerationOptions = {
  maxLinesPerSlide: 0,
  showBookNameOnSlide: 'firstOfChapter',
  showChapterNumberOnSlide: 'firstOfChapter',
  slideNumberFont: 'Arial',
  slideNumberFontSize: 10,
  splitChaptersIntoFiles: false,
};

function estimateLines(text: string, charsPerLine: number = 60): number {
  if (!text) return 0;
  const explicitNewLines = (text.match(/\n/g) || []).length;
  const wrappedLines = Math.ceil(text.length / charsPerLine);
  return Math.max(1, explicitNewLines + wrappedLines);
}

// Store global reference for title slide logic (a bit of a hack, better state management is advised for complex apps)
// This variable is used to determine if the main title slide should be added.
// It's compared with the versesForPresentation in generateSinglePresentation.
// If they are the same (i.e., we are generating the main, non-split presentation, or the first part of a split one that represents the whole),
// then the main title slide from options is used.
let multiVersionVersesGlobalRef: MultiVersionVerse[] = [];

async function generateSinglePresentation(
  pptx: PptxGenJS,
  versesForPresentation: MultiVersionVerse[],
  options: PptGenerationOptions,
  presentationSpecificSubtitle?: string // e.g. "Genesis Chapter 1" for a chapter-specific file
): Promise<void> {

  pptx.layout = 'LAYOUT_WIDE';

  // Handle Title Slide Logic
  if (options.titleSlide) {
    // If a presentationSpecificSubtitle is provided (meaning this is for a specific chapter in a split scenario)
    if (presentationSpecificSubtitle) {
        const titleSlide = pptx.addSlide();
        titleSlide.addText(options.titleSlide.title, { // Main title from overall options
            x: 0.5, y: 2.0, w: '90%', h: 1.5, fontSize: 48, align: 'center',
        });
        // Subtitle specific to this part of presentation (e.g. chapter name)
        titleSlide.addText(presentationSpecificSubtitle, {
            x: 0.5, y: 3.5, w: '90%', h: 1.0, fontSize: 24, align: 'center',
        });
    } else if (versesForPresentation === multiVersionVersesGlobalRef) {
        // This condition means we are generating the single, main presentation OR it's the first call that implies the overall title.
        // Only add the main title slide once, or if it's not a split-by-chapter scenario.
        const titleSlide = pptx.addSlide();
        titleSlide.addText(options.titleSlide.title, {
            x: 0.5, y: 2.0, w: '90%', h: 1.5, fontSize: 48, align: 'center',
        });
        if (options.titleSlide.subtitle) { // Optional overall subtitle
            titleSlide.addText(options.titleSlide.subtitle, {
                x: 0.5, y: 3.5, w: '90%', h: 1.0, fontSize: 24, align: 'center',
            });
        }
    }
    // If no presentationSpecificSubtitle and not the main global ref, implies it's a part of split but not the main title context.
    // Or, if options.titleSlide is not set, no title slide is added.
  }


  let currentSlide = pptx.addSlide();
  let linesOnCurrentSlide = 0;
  let lastDisplayedBook = "";
  let lastDisplayedChapter = 0;

  const slideWidth = pptx.options.slideWidth || 10;
  const slideHeight = pptx.options.slideHeight || 5.625;
  const titleY = 0.3, titleH = 0.5;
  const contentY = titleY + titleH + 0.2;
  const contentH = slideHeight - contentY - 0.5;
  const contentPadding = 0.3;

  for (let i = 0; i < versesForPresentation.length; i++) {
    const mvVerse = versesForPresentation[i];
    let verseBlockText = mvVerse.verses.length === 1
      ? `${mvVerse.mainVerseNumber} ${mvVerse.verses[0].text}`
      : mvVerse.verses.map(v => `[${v.bibleName}] ${mvVerse.mainVerseNumber} ${v.text}`).join('\n');

    const estimatedVerseLines = estimateLines(verseBlockText);

    if (options.maxLinesPerSlide > 0 && linesOnCurrentSlide + estimatedVerseLines > options.maxLinesPerSlide && linesOnCurrentSlide > 0) {
      currentSlide = pptx.addSlide();
      linesOnCurrentSlide = 0;
    }

    let displayBookName = mvVerse.mainBookName;
    let displayChapterNumber = `${mvVerse.mainChapterNumber}장`;
    let showTitle = false;

    if (options.showBookNameOnSlide === 'always' ||
        (options.showBookNameOnSlide === 'firstOfBook' && (mvVerse.mainBookName !== lastDisplayedBook || linesOnCurrentSlide === 0)) ||
        (options.showBookNameOnSlide === 'firstOfChapter' && (mvVerse.mainBookName !== lastDisplayedBook || mvVerse.mainChapterNumber !== lastDisplayedChapter || linesOnCurrentSlide === 0))) {
      showTitle = true;
    }
    if (options.showChapterNumberOnSlide === 'always' ||
        (options.showChapterNumberOnSlide === 'firstOfChapter' && (mvVerse.mainBookName !== lastDisplayedBook || mvVerse.mainChapterNumber !== lastDisplayedChapter || linesOnCurrentSlide === 0))) {
      showTitle = true;
    }

    if (showTitle && (linesOnCurrentSlide === 0 || mvVerse.mainBookName !== lastDisplayedBook || mvVerse.mainChapterNumber !== lastDisplayedChapter)) {
      currentSlide.addText(`${displayBookName} ${displayChapterNumber}`, {
        x: contentPadding, y: titleY, w: slideWidth - (2 * contentPadding), h: titleH,
        fontSize: 20, bold: true, align: 'center',
      });
      lastDisplayedBook = mvVerse.mainBookName;
      lastDisplayedChapter = mvVerse.mainChapterNumber;
    }

    currentSlide.addText(verseBlockText, {
      x: contentPadding, y: contentY,
      w: slideWidth - (2 * contentPadding), h: contentH,
      fontSize: 18, align: 'left', lineSpacing: 28,
    });
    linesOnCurrentSlide += estimatedVerseLines;

    if (options.maxLinesPerSlide > 0 && linesOnCurrentSlide >= options.maxLinesPerSlide) {
      if (i < versesForPresentation.length - 1) {
        currentSlide = pptx.addSlide();
        linesOnCurrentSlide = 0;
      }
    }
  }

  pptx.options.slideNumber = {
    x: slideWidth - 0.5, y: slideHeight - 0.4,
    fontFace: options.slideNumberFont, fontSize: options.slideNumberFontSize, color: "666666"
  };
}


async function generatePresentation(
  multiVersionVerses: MultiVersionVerse[],
  options: Partial<PptGenerationOptions> = {}
): Promise<{ buffer: Buffer, filename: string, contentType: string }> {
  multiVersionVersesGlobalRef = multiVersionVerses; // Set global ref for title slide logic
  const currentOptions: PptGenerationOptions = { ...DEFAULT_PPT_OPTIONS, ...options };

  if (currentOptions.splitChaptersIntoFiles) {
    const zip = new JSZip();
    const chapterGroups: { [key: string]: MultiVersionVerse[] } = {};

    // Group verses by book and chapter
    multiVersionVerses.forEach(mvVerse => {
      const key = `${mvVerse.mainBookName}_Ch${mvVerse.mainChapterNumber}`;
      if (!chapterGroups[key]) {
        chapterGroups[key] = [];
      }
      chapterGroups[key].push(mvVerse);
    });

    const chapterKeys = Object.keys(chapterGroups);

    if (chapterKeys.length === 0 && multiVersionVerses.length > 0) {
        // Fallback if grouping somehow fails but verses exist (e.g. all verses are for a single chapter already)
        // This case should ideally be handled by the main loop if chapterKeys.length is 1.
        // However, as a safeguard:
        const singlePptx = new PptxGenJS();
        const bookName = multiVersionVerses[0].mainBookName;
        const chapNum = multiVersionVerses[0].mainChapterNumber;
        const chapterTitle = `${bookName} ${chapNum}장`;
        // Pass the specific chapter title as the presentationSpecificSubtitle
        await generateSinglePresentation(singlePptx, multiVersionVerses, currentOptions, chapterTitle);
        const buffer = (await singlePptx.write({ outputType: 'nodebuffer' })) as Buffer;
        const filename = `${bookName}_${chapNum}.pptx`;
        zip.file(filename, buffer);
    } else {
       for (const key of chapterKeys) {
        const chapterVerses = chapterGroups[key];
        if (chapterVerses.length > 0) {
            const pptx = new PptxGenJS();
            const bookName = chapterVerses[0].mainBookName;
            const chapNum = chapterVerses[0].mainChapterNumber;
            const chapterSpecificSubtitle = `${bookName} ${chapNum}장`;

            // Options for this specific chapter's PPT
            const chapterPptOptions = {...currentOptions};
            // If there's a main title, use it and set the chapter as subtitle for this individual file.
            if (currentOptions.titleSlide?.title) {
                chapterPptOptions.titleSlide = { title: currentOptions.titleSlide.title, subtitle: chapterSpecificSubtitle };
            } else { // Otherwise, just use the chapter itself as the title.
                 chapterPptOptions.titleSlide = { title: chapterSpecificSubtitle };
            }

            await generateSinglePresentation(pptx, chapterVerses, chapterPptOptions, chapterSpecificSubtitle);
            const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
            const filename = `${key.replace("_Ch", " ")}.pptx`; // e.g., "창세기 1.pptx"
            zip.file(filename, buffer);
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipFilename = currentOptions.titleSlide?.title
        ? `${currentOptions.titleSlide.title.replace(/\s+/g, '_')}_chapters.zip`
        : 'bible_chapters.zip';
    return { buffer: zipBuffer, filename: zipFilename, contentType: 'application/zip' };

  } else {
    // Single presentation logic
    const pptx = new PptxGenJS();
    // For a single presentation, presentationSpecificSubtitle is null/undefined, so main title logic applies
    await generateSinglePresentation(pptx, multiVersionVerses, currentOptions);
    const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
    const pptFilename = currentOptions.titleSlide?.title
        ? `${currentOptions.titleSlide.title.replace(/\s+/g, '_')}.pptx`
        : 'bible_presentation.pptx';
    return { buffer, filename: pptFilename, contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
  }
}

export const PowerPointService = {
  generatePresentation,
};
