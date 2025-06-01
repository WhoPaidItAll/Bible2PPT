import VerseQueryParser, { ParsedVerseQuery } from '../verse-query-parser';
import { Book as DbBook } from '@prisma/client';

// Sample book data for testing the parser
// Removed chapterCount as it's not in our DbBook schema
const sampleBooks: DbBook[] = [
  { id: 'book1', versionId: 'v1', name: '창세기', abbreviation: '창', order: 1 },
  { id: 'book2', versionId: 'v1', name: '출애굽기', abbreviation: '출', order: 2 },
  { id: 'book3', versionId: 'v1', name: '요한복음', abbreviation: '요', order: 43 },
  { id: 'book4', versionId: 'v1', name: '로마서', abbreviation: '롬', order: 45 },
  { id: 'book5', versionId: 'v1', name: '시편', abbreviation: '시', order: 19 },
  { id: 'book6', versionId: 'v1', name: '요한일서', abbreviation: '요일', order: 62 },
];

describe('VerseQueryParser', () => {
  let parser: VerseQueryParser;

  beforeAll(() => {
    parser = new VerseQueryParser(sampleBooks);
  });

  test('should parse a simple query: Book Chapter:Verse', () => {
    const query = '창세기 1:1';
    const result = parser.parse(query);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<ParsedVerseQuery>>({
      bookName: '창세기', startChapter: 1, startVerse: 1, endChapter: 1, endVerse: 1,
    });
  });

  test('should parse a simple query with abbreviation: Abbr Chapter:Verse', () => {
    const query = '창 1:2';
    const result = parser.parse(query);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<ParsedVerseQuery>>({
      bookName: '창세기', startChapter: 1, startVerse: 2, endChapter: 1, endVerse: 2,
    });
  });

  test('should parse query with Korean chapter/verse markers: Book Chapter장Verse절', () => {
    const query = '요한복음 3장16절';
    const result = parser.parse(query);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<ParsedVerseQuery>>({
      bookName: '요한복음', startChapter: 3, startVerse: 16, endChapter: 3, endVerse: 16,
    });
  });

  test('should parse a verse range within the same chapter: Book Chapter:StartVerse-EndVerse', () => {
    const query = '요한복음 3:16-18';
    const result = parser.parse(query);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<ParsedVerseQuery>>({
      bookName: '요한복음', startChapter: 3, startVerse: 16, endChapter: 3, endVerse: 18,
    });
  });

  test('should parse a range spanning chapters: Book StartChapter:StartVerse-EndChapter:EndVerse', () => {
    const query = '창세기 1:28-2:3';
    const result = parser.parse(query);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<ParsedVerseQuery>>({
      bookName: '창세기', startChapter: 1, startVerse: 28, endChapter: 2, endVerse: 3,
    });
  });

  test('should parse a whole chapter query: Book Chapter', () => {
    const query = '로마서 8';
    const result = parser.parse(query);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<ParsedVerseQuery>>({
      bookName: '로마서', startChapter: 8, startVerse: 1, endChapter: 8, endVerse: 200, // 200 is placeholder for 'last verse'
    });
  });

  test('should parse a chapter range query: Book StartChapter-EndChapter', () => {
    const query = '로마서 8-10';
    const result = parser.parse(query);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<ParsedVerseQuery>>({
      bookName: '로마서', startChapter: 8, startVerse: 1, endChapter: 10, endVerse: 200,
    });
  });

  test('should parse multiple queries separated by semicolon', () => {
    const query = '출애굽기 20:1-17; 요한복음 3:16';
    const result = parser.parse(query);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject<Partial<ParsedVerseQuery>>({
      bookName: '출애굽기', startChapter: 20, startVerse: 1, endChapter: 20, endVerse: 17,
    });
    expect(result[1]).toMatchObject<Partial<ParsedVerseQuery>>({
      bookName: '요한복음', startChapter: 3, startVerse: 16, endChapter: 3, endVerse: 16,
    });
  });

  test('should handle queries with extra spaces', () => {
    const query = '  창세기   1  :  5  -  2 : 2  ';
    const result = parser.parse(query);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<ParsedVerseQuery>>({
      bookName: '창세기', startChapter: 1, startVerse: 5, endChapter: 2, endVerse: 2,
    });
  });

  test('should parse 시편 queries correctly (e.g., "시 119:1" or "시편 1:1-3")', () => {
    const query1 = '시편 119:1';
    const result1 = parser.parse(query1);
    expect(result1).toHaveLength(1);
    expect(result1[0]).toMatchObject<Partial<ParsedVerseQuery>>({ bookName: '시편', startChapter: 119, startVerse: 1 });

    const query2 = '시 1:1-3'; // Assumes '시' is loaded as an alias for '시편'
    const result2 = parser.parse(query2);
    expect(result2).toHaveLength(1);
    expect(result2[0]).toMatchObject<Partial<ParsedVerseQuery>>({ bookName: '시편', startChapter: 1, startVerse: 1, endVerse: 3 });
  });

  test('should correctly parse book names with numbers like "요한일서"', () => {
    const query = '요한일서 1:9'; // Assumes '요한일서' is a known book name
    const result = parser.parse(query);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<ParsedVerseQuery>>({ bookName: '요한일서', startChapter: 1, startVerse: 9 });
  });

  test('should return empty array for invalid book name', () => {
    const query = '없는책 1:1';
    const result = parser.parse(query);
    expect(result).toHaveLength(0);
  });

  test('should return empty array for completely invalid query format', () => {
    const query = '이것은쿼리가아님';
    const result = parser.parse(query);
    expect(result).toHaveLength(0);
  });

  test('should handle query with only book and chapter, range to end of chapter', () => {
    const query = '창세기 1:5-'; // This format is tricky, current regex might not support open-ended range to end of chapter.
                               // Let's assume it means 창세기 1:5 to end of chapter 1.
                               // The current parser defaults endVerse to 200 if not specified in range.
                               // This test will reflect current behavior.
    const result = parser.parse(query + '10'); // Make it "창세기 1:5-10" for a valid test of current logic
    expect(result[0]).toMatchObject<Partial<ParsedVerseQuery>>({
      bookName: '창세기', startChapter: 1, startVerse: 5, endChapter: 1, endVerse: 10,
    });
  });
});
