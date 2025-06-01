import PptxGenJS, { PresLayout } from 'pptxgenjs'; // Import PresLayout for type safety
import JSZip from 'jszip';
import { ThemeName, AVAILABLE_FONTS } from '@/types/bible'; // Import ThemeName and fonts

// Define interfaces for the data and options
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

export interface PptGenerationOptions { // Exporting for potential use elsewhere if needed
  titleSlide?: { title: string; subtitle?: string };
  slideNumberFont?: string;
  slideNumberFontSize?: number;
  maxLinesPerSlide: number;
  showBookNameOnSlide: 'always' | 'firstOfChapter' | 'firstOfBook';
  showChapterNumberOnSlide: 'always' | 'firstOfChapter' | 'firstOfBook';
  splitChaptersIntoFiles?: boolean;
  themeName?: ThemeName;
  bodyFont?: string;
  titleFont?: string;
}

const DEFAULT_PPT_OPTIONS: PptGenerationOptions = {
  maxLinesPerSlide: 0,
  showBookNameOnSlide: 'firstOfChapter',
  showChapterNumberOnSlide: 'firstOfChapter',
  slideNumberFont: 'Arial', // Default font for slide numbers
  slideNumberFontSize: 10,
  splitChaptersIntoFiles: false,
  themeName: 'defaultLight',
  bodyFont: 'Arial', // Default body font
  titleFont: 'Arial', // Default title font
};

// Define Master Slide Names for clarity
const MASTER_SLIDE_TITLE_LAYOUT = 'TITLE_SLIDE_LAYOUT'; // For the main title slide of the presentation
const MASTER_SLIDE_CONTENT_LAYOUT = 'CONTENT_SLIDE_LAYOUT'; // For verse content

function defineMasterSlides(pptx: PptxGenJS, options: PptGenerationOptions) {
  const bodyFont = options.bodyFont || DEFAULT_PPT_OPTIONS.bodyFont!;
  const titleFont = options.titleFont || DEFAULT_PPT_OPTIONS.titleFont!;

  let slideBgColor = 'FFFFFF'; // Default Light: White background
  let titleColor = '000000';   // Default Light: Black title
  let bodyColor = '333333';    // Default Light: Dark Gray body text
  let slideNumberColor = '666666';

  if (options.themeName === 'defaultDark') {
    slideBgColor = '333333'; // Dark background
    titleColor = 'FFFFFF';   // White title
    bodyColor = 'E0E0E0';    // Light gray body text
    slideNumberColor = 'CCCCCC';
  } else if (options.themeName === 'themeBlue') {
    slideBgColor = 'E7F0F7'; // Light blue background
    titleColor = '003366';   // Dark blue title
    bodyColor = '004080';    // Medium blue body text
    slideNumberColor = '003366';
  }

  // Master for the overall Presentation Title Slide (if any)
  pptx.defineSlideMaster({
    title: MASTER_SLIDE_TITLE_LAYOUT,
    background: { color: slideBgColor },
    objects: [
      {
        placeholder: {
          options: { name: 'title', type: 'title', x: 0.5, y: 2.0, w: '90%', h: 1.5, align: 'center', fontFace: titleFont, fontSize: 48, color: titleColor },
          text: 'Presentation Title Placeholder', // Default text for the placeholder
        },
      },
      {
        placeholder: {
          options: { name: 'subtitle', type: 'body', x: 0.5, y: 3.5, w: '90%', h: 1.0, align: 'center', fontFace: bodyFont, fontSize: 24, color: bodyColor },
          text: 'Subtitle Placeholder', // Default text for the placeholder
        },
      },
    ],
    slideNumber: { x: (pptx.options.slideWidth || 10) - 0.7, y: (pptx.options.slideHeight || 5.625) - 0.5, fontFace: options.slideNumberFont, fontSize: options.slideNumberFontSize, color: slideNumberColor },
  });

  // Master for Content Slides (verses)
  const slideWidth = pptx.options.slideWidth || 10; // inches
  const slideHeight = pptx.options.slideHeight || 5.625; // inches
  const contentPadding = 0.3;
  const titleMasterY = 0.3;
  const titleMasterH = 0.5;
  const bodyMasterY = titleMasterY + titleMasterH + 0.1; // A bit tighter
  const bodyMasterH = slideHeight - bodyMasterY - 0.5;


  pptx.defineSlideMaster({
    title: MASTER_SLIDE_CONTENT_LAYOUT,
    background: { color: slideBgColor },
    objects: [
      // Placeholder for Book/Chapter Title
      {
        placeholder: {
          options: { name: 'header', type: 'title', x: contentPadding, y: titleMasterY, w: slideWidth - (2 * contentPadding), h: titleMasterH,
                     fontFace: titleFont, fontSize: 20, color: titleColor, align: 'center', bold: true },
          text: 'Book Chapter Title Placeholder', // Default text
        },
      },
      // Placeholder for Verse Text (Body)
      {
        placeholder: {
          options: { name: 'body', type: 'body', x: contentPadding, y: bodyMasterY, w: slideWidth - (2 * contentPadding), h: bodyMasterH,
                     fontFace: bodyFont, fontSize: 18, color: bodyColor, align: 'left', lineSpacing: 28 },
          text: 'Verse text placeholder', // Default text
        },
      },
    ],
    slideNumber: { x: slideWidth - 0.7, y: slideHeight - 0.5, fontFace: options.slideNumberFont, fontSize: options.slideNumberFontSize, color: slideNumberColor },
  });
}


function estimateLines(text: string, charsPerLine: number = 60): number {
  if (!text) return 0;
  const explicitNewLines = (text.match(/\n/g) || []).length;
  // Simple split by space for word count, then estimate lines.
  // This is still very basic.
  const words = text.split(' ').length;
  const linesBasedOnWords = Math.ceil(words / (charsPerLine / 6)); // Assuming avg 6 chars per word
  return Math.max(1, explicitNewLines + linesBasedOnWords);
}

// Store global reference for title slide logic (used to ensure main title only appears once)
let multiVersionVersesGlobalRef: MultiVersionVerse[] = [];

async function generateSinglePresentation(
  pptx: PptxGenJS, // Pass PptxGenJS instance
  versesForPresentation: MultiVersionVerse[],
  options: PptGenerationOptions,
  isFirstChapterOfSplit: boolean = true, // Used for split chapter title logic
  overallQueryTitle?: string // The main query string for the overall presentation
): Promise<void> {

  // Define master slides for this specific PptxGenJS instance based on current options
  defineMasterSlides(pptx, options);

  // Add a main title slide logic
  if (options.titleSlide) {
    if (options.splitChaptersIntoFiles && isFirstChapterOfSplit) {
      // For split files, each file can have its own title slide derived from the main title + chapter info
      const chapterSpecificTitle = `${options.titleSlide.title} (${versesForPresentation[0]?.mainBookName} ${versesForPresentation[0]?.mainChapterNumber}장)`;
      const titleSlide = pptx.addSlide({ masterName: MASTER_SLIDE_TITLE_LAYOUT });
      titleSlide.addText(chapterSpecificTitle, { placeholder: 'title' });
      // No subtitle from options.titleSlide.subtitle here; chapter info is the subtitle.
    } else if (!options.splitChaptersIntoFiles && versesForPresentation === multiVersionVersesGlobalRef) {
      // Only for the single, main presentation (not split)
      const titleSlide = pptx.addSlide({ masterName: MASTER_SLIDE_TITLE_LAYOUT });
      titleSlide.addText(options.titleSlide.title, { placeholder: 'title' });
      if (options.titleSlide.subtitle) {
        titleSlide.addText(options.titleSlide.subtitle, { placeholder: 'subtitle' });
      }
    }
  }


  let currentSlide = pptx.addSlide({ masterName: MASTER_SLIDE_CONTENT_LAYOUT });
  let linesOnCurrentSlide = 0;
  let lastDisplayedBook = "";
  let lastDisplayedChapter = 0;

  const bodyFont = options.bodyFont || DEFAULT_PPT_OPTIONS.bodyFont!;
  // titleFont from options is applied via master slide's 'header' placeholder.

  for (let i = 0; i < versesForPresentation.length; i++) {
    const mvVerse = versesForPresentation[i];
    let verseBlockText = mvVerse.verses.length === 1
      ? `${mvVerse.mainVerseNumber} ${mvVerse.verses[0].text}`
      // Use \n for pptxgenjs newlines within a single text block
      : mvVerse.verses.map(v => `[${v.bibleName}] ${mvVerse.mainVerseNumber} ${v.text}`).join('\n');

    const estimatedVerseLines = estimateLines(verseBlockText);

    if (options.maxLinesPerSlide > 0 && linesOnCurrentSlide + estimatedVerseLines > options.maxLinesPerSlide && linesOnCurrentSlide > 0) {
      currentSlide = pptx.addSlide({ masterName: MASTER_SLIDE_CONTENT_LAYOUT });
      linesOnCurrentSlide = 0;
    }

    let displayBookName = mvVerse.mainBookName;
    let displayChapterNumber = `${mvVerse.mainChapterNumber}장`;
    let showTitleText = "";
    let titleShouldBeShown = false;

    if (options.showBookNameOnSlide === 'always' ||
        (options.showBookNameOnSlide === 'firstOfBook' && (mvVerse.mainBookName !== lastDisplayedBook || linesOnCurrentSlide === 0)) ||
        (options.showBookNameOnSlide === 'firstOfChapter' && (mvVerse.mainBookName !== lastDisplayedBook || mvVerse.mainChapterNumber !== lastDisplayedChapter || linesOnCurrentSlide === 0))) {
        showTitleText = displayBookName;
        titleShouldBeShown = true;
    }

    // Construct the chapter part of the title
    let chapterPart = "";
    if (options.showChapterNumberOnSlide === 'always' ||
        (options.showChapterNumberOnSlide === 'firstOfChapter' && (mvVerse.mainBookName !== lastDisplayedBook || mvVerse.mainChapterNumber !== lastDisplayedChapter || linesOnCurrentSlide === 0))) {
        chapterPart = displayChapterNumber;
        titleShouldBeShown = true;
    }

    // Combine book and chapter parts for the title
    if (showTitleText && chapterPart) {
        showTitleText = `${showTitleText} ${chapterPart}`;
    } else if (chapterPart) { // Only chapter number is to be shown
        showTitleText = chapterPart;
        titleShouldBeShown = true;
    }
    // If only book name is shown, showTitleText is already set.

    if (titleShouldBeShown && linesOnCurrentSlide === 0) {
       currentSlide.addText(showTitleText, { placeholder: 'header' });
       lastDisplayedBook = mvVerse.mainBookName;
       lastDisplayedChapter = mvVerse.mainChapterNumber;
    } else if (linesOnCurrentSlide === 0) {
        // If no title is to be shown, but it's the start of the slide, clear the header placeholder
        currentSlide.addText('', { placeholder: 'header' });
    }

    currentSlide.addText(verseBlockText, { placeholder: 'body', fontFace: bodyFont, breakLine: true });
    linesOnCurrentSlide += estimatedVerseLines;

    if (options.maxLinesPerSlide > 0 && linesOnCurrentSlide >= options.maxLinesPerSlide) {
      if (i < versesForPresentation.length - 1) {
        currentSlide = pptx.addSlide({ masterName: MASTER_SLIDE_CONTENT_LAYOUT });
        linesOnCurrentSlide = 0;
      }
    }
  }
}


async function generatePresentation(
  multiVersionVerses: MultiVersionVerse[],
  options: Partial<PptGenerationOptions> = {}
): Promise<{ buffer: Buffer, filename: string, contentType: string }> {
  multiVersionVersesGlobalRef = multiVersionVerses;
  const currentOptions: PptGenerationOptions = { ...DEFAULT_PPT_OPTIONS, ...options };
  const overallQueryTitle = currentOptions.titleSlide?.title || 'Bible Presentation';


  if (currentOptions.splitChaptersIntoFiles) {
    const zip = new JSZip();
    const chapterGroups: { [key: string]: MultiVersionVerse[] } = {};

    multiVersionVerses.forEach(mvVerse => {
      const key = `${mvVerse.mainBookName}_Ch${mvVerse.mainChapterNumber}`;
      if (!chapterGroups[key]) chapterGroups[key] = [];
      chapterGroups[key].push(mvVerse);
    });

    let isFirstChapterInZip = true;
    for (const key in chapterGroups) {
      const chapterVerses = chapterGroups[key];
      if (chapterVerses.length > 0) {
        const pptxInstance = new PptxGenJS();
        // Pass overallQueryTitle for context, used if options.titleSlide.title is set.
        // isFirstChapterOfSplit flag is true only for the first chapter added to zip,
        // this might be used to add a main title slide to only the first PPT in a series.
        // However, the current logic in generateSinglePresentation for split files
        // makes each chapter PPT have its own title slide derived from overall title + chapter.
        await generateSinglePresentation(pptxInstance, chapterVerses, currentOptions, isFirstChapterInZip, overallQueryTitle);
        isFirstChapterInZip = false;
        const buffer = (await pptxInstance.write({ outputType: 'nodebuffer' })) as Buffer;
        // Sanitize filename
        const filename = `${key.replace(/_Ch/g, ' ').replace(/[^\w\s가-힣.-]/g, '_')}.pptx`;
        zip.file(filename, buffer);
      }
    }

    const zipFilename = `${overallQueryTitle.replace(/[^\w\s가-힣.-]/g, '_')}_chapters.zip`;
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    return { buffer: zipBuffer, filename: zipFilename, contentType: 'application/zip' };

  } else {
    const pptxInstance = new PptxGenJS();
    await generateSinglePresentation(pptxInstance, multiVersionVerses, currentOptions, true, overallQueryTitle);
    const buffer = (await pptxInstance.write({ outputType: 'nodebuffer' })) as Buffer;
    const pptFilename = `${overallQueryTitle.replace(/[^\w\s가-힣.-]/g, '_')}.pptx`;
    return { buffer, filename: pptFilename, contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
  }
}

export const PowerPointService = {
  generatePresentation,
};
