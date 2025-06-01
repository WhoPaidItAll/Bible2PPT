import { prisma } from '@/lib/prisma';
import { Book as DbBook } from '@prisma/client';

export interface ParsedVerseQuery {
  bookName: string; // Full book name from DB, e.g., "창세기"
  bookAbbreviation: string; // Abbreviation from DB, e.g., "창"
  dbBookId: string; // ID of the book in our database
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
}

export interface BookAlias {
  name: string; // Canonical name (e.g., "창세기")
  abbreviation: string; // Canonical abbreviation (e.g., "창")
  dbBookId: string;
  // chapterCount: number; // Could be useful for validation
}

class VerseQueryParser {
  private bookAliases: Map<string, BookAlias> = new Map();
  // Store a list of just book names and abbreviations for regex building
  private knownBookNamesAndAbbreviations: string[] = [];

  constructor(booksForVersion: DbBook[]) {
    this.loadBookAliases(booksForVersion);
  }

  private loadBookAliases(books: DbBook[]): void {
    const bookNameSet = new Set<string>();
    books.forEach(book => {
      const alias: BookAlias = {
        name: book.name,
        abbreviation: book.abbreviation,
        dbBookId: book.id,
        // chapterCount: book.chapterCount // Chapter count is not on DbBook in our schema
      };

      // Store exact matches first
      this.bookAliases.set(book.name.toLowerCase(), alias);
      this.bookAliases.set(book.abbreviation.toLowerCase(), alias);
      bookNameSet.add(book.name);
      bookNameSet.add(book.abbreviation);

      // Specific handling for common variations if needed
      // Example: If original app allowed "요1" for "요한일서"
      if (book.name === "요한일서") this.bookAliases.set("요1", alias);
      if (book.name === "요한이서") this.bookAliases.set("요2", alias);
      if (book.name === "요한삼서") this.bookAliases.set("요3", alias);
      // Add more specific aliases based on original app's behavior
      // The original C# code's GetBookKey method is a good reference for these.
      // For instance, it seems like the C# code implicitly handled "창" as Genesis due to its OnlineID mapping.
      // Our current approach loads from DB, so "창" should already be an alias if it's an abbreviation in DB.
    });

    // Create a sorted list of known names and abbreviations for regex construction
    // Sort by length descending to match longer names first (e.g., "요한복음" before "요한")
    this.knownBookNamesAndAbbreviations = Array.from(bookNameSet).sort((a, b) => b.length - a.length);
  }

  public parse(query: string): ParsedVerseQuery[] {
    const results: ParsedVerseQuery[] = [];

    // Escape book names for regex and join with |
    // This allows matching book names that might contain spaces or special characters.
    const bookNameRegexPart = this.knownBookNamesAndAbbreviations
      .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape regex special chars, fixed ] to \\]
      .join('|');

    if (!bookNameRegexPart) {
        console.warn("No book names loaded for parser. Cannot parse query.");
        return [];
    }

    // Regex breakdown:
    // ((?:${bookNameRegexPart})) : Captures a known book name or abbreviation (whole word).
    // \s*                             : Optional whitespace.
    // (\d+)                           : Captures chapter number.
    // (?:                             : Start of optional group for verse.
    //   \s*[:장절]?\s*                : Optional delimiter (':', '장', '절', or just space).
    //   (\d+)                         : Captures start verse number.
    // )?                              : End of optional group for verse (making verse number optional).
    // (?:                             : Start of optional group for range.
    //   \s*-\s*                       : Dash for range, surrounded by optional whitespace.
    //   (\d+)                         : Captures end chapter OR end verse.
    //   (?:                           : Start of optional group for end verse if end chapter was specified.
    //     \s*[:장절]?\s*              : Optional delimiter.
    //     (\d+)                       : Captures end verse number.
    //   )?                            : End of optional group for end verse.
    // )?                              : End of optional group for range.
    // The 'g' flag allows multiple matches for queries separated by ';'
    const queryRegex = new RegExp(
        `(\\b(?:${bookNameRegexPart})\\b|${bookNameRegexPart})\\s*(\\d+)(?:\\s*[:장절]?\\s*(\\d+))?(?:\\s*-\\s*(\\d+)(?:\\s*[:장절]?\\s*(\\d+))?)?`, 'gi'
    );

    const individualQueries = query.split(';').map(q => q.trim()).filter(q => q.length > 0);

    for (const singleQuery of individualQueries) {
      // We use the global regex and loop through matches in a single query part
      // This is more robust if a single query part could somehow contain multiple valid structures (though unlikely with ';' split)
      let match;
      let lastIndex = 0;
      // Reset lastIndex for each part of the query split by ';'
      queryRegex.lastIndex = 0;

      while((match = queryRegex.exec(singleQuery)) !== null) {
        lastIndex = queryRegex.lastIndex; // Save last index for next iteration

        const bookInput = match[1].trim().toLowerCase();
        const bookInfo = this.bookAliases.get(bookInput);

        if (!bookInfo) {
          console.warn(`Book not found for input: '${match[1].trim()}' in query '${singleQuery}'. Match was: ${match[0]}`);
          continue;
        }

        const startChapter = parseInt(match[2], 10);
        // If match[3] (startVerse) is undefined, it means only chapter was specified (e.g., "창세기 1")
        // or it's a chapter range (e.g., "창세기 1-2")
        const startVerse = match[3] ? parseInt(match[3], 10) : 1;

        let endChapter = startChapter;
        // If only chapter specified (match[3] is undefined), endVerse should cover the whole chapter.
        // If startVerse is specified, then default endVerse is startVerse.
        let endVerse = match[3] ? startVerse : 200; // Default: whole chapter (200 as placeholder for 'last verse')

        if (match[4]) { // Range part exists: match[4] is the number after '-'
          const rangePart1 = parseInt(match[4], 10);
          if (match[5]) { // End chapter AND end verse specified (e.g., "1:1-2:5" or "1-2:5")
            endChapter = rangePart1;
            endVerse = parseInt(match[5], 10);
          } else { // Only one number after '-': could be end verse OR end chapter
            if (match[3]) { // Start verse was specified (e.g., "1:1-5")
              endVerse = rangePart1; // So, rangePart1 is end verse
            } else { // No start verse specified (e.g., "창세기 1-2" or "창세기 1-5" where 5 is chapter)
              endChapter = rangePart1; // So, rangePart1 is end chapter
              endVerse = 200; // Fetch whole end chapter
            }
          }
        }

        results.push({
          bookName: bookInfo.name,
          bookAbbreviation: bookInfo.abbreviation,
          dbBookId: bookInfo.dbBookId,
          startChapter,
          startVerse,
          endChapter,
          endVerse,
        });
      }
      if (lastIndex === 0 && singleQuery.length > 0) { // If regex didn't match anything in a non-empty query part
          console.warn(`Could not parse query part: '${singleQuery}' with new regex.`);
      }
    }
    return results;
  }
}
export default VerseQueryParser;
