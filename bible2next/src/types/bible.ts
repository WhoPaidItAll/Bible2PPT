// src/types/bible.ts

export interface BibleVersion {
  id: string; // DB ID
  identifier: string; // e.g., "rvsn", "niv"
  name: string;
  language: string;
}

export interface BibleSource {
  sourceId: string; // e.g., "godpeople" (identifier from API)
  sourceName: string;
  dbSourceId: string; // Actual DB ID
  versions: BibleVersion[];
}

export interface Book {
  id: string; // DB ID
  name: string;
  abbreviation: string;
  order: number;
  chapterCount: number;
}

export interface SelectedBible {
    dbSourceId: string;
    sourceName: string;
    dbVersionId: string;
    versionName: string;
    versionIdentifier: string; // e.g. "rvsn"
    language: string;
}

export type ThemeName = 'defaultLight' | 'defaultDark' | 'themeBlue';

export const AVAILABLE_THEMES: ThemeName[] = ['defaultLight', 'defaultDark', 'themeBlue'];
export const AVAILABLE_FONTS: string[] = ['Arial', 'Verdana', 'Times New Roman', 'Calibri', 'Helvetica']; // Example fonts

export interface PptOptions {
  splitChaptersIntoFiles: boolean;
  maxLinesPerSlide: number;
  showBookNameOnSlide: 'always' | 'firstOfChapter' | 'firstOfBook';
  showChapterNumberOnSlide: 'always' | 'firstOfChapter' | 'firstOfBook';
  themeName?: ThemeName;
  bodyFont?: string;
  titleFont?: string;
  // Add other options from original app if they map to pptxgenjs features
}
