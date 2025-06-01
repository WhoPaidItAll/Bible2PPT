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
  chapterCount: number; // This was removed from DB Book model, but API for books might still return it if API hasn't been updated.
  // For UI purposes, it can be useful. If API /api/bibles/[versionId]/books doesn't return it, this type will be more permissive.
  // My version of /api/bibles/[versionId]/books route DOES NOT return chapterCount.
  // So, components using this type for that API response should be aware it might be undefined.
  // Let's make it optional to reflect the reality of the API I built.
  // chapterCount?: number;
  // The bash script provides it as non-optional. I will stick to the script for this subtask.
  // If the API I built in previous step omits it, then there will be a type mismatch at runtime if not handled.
  // For now, I will follow the bash script's type definition.
}

export interface SelectedBible {
    dbSourceId: string;
    sourceName: string;
    dbVersionId: string;
    versionName: string;
    versionIdentifier: string; // e.g. "rvsn"
    language: string;
}

export interface PptOptions {
  splitChaptersIntoFiles: boolean;
  maxLinesPerSlide: number;
  showBookNameOnSlide: 'always' | 'firstOfChapter' | 'firstOfBook';
  showChapterNumberOnSlide: 'always' | 'firstOfChapter' | 'firstOfBook';
  // Add other options from original app if they map to pptxgenjs features
}
