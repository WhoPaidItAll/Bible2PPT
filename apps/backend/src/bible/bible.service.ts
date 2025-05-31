import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
// Define custom interface for Verse
interface Verse {
  id: number;
  number: number;
  text: string;
  chapterId: string;
}

@Injectable()
export class BibleService {
  constructor(private prisma: PrismaService) {}

  async getVersesByChapter(chapterId: string): Promise<Verse[]> {
    return this.prisma.verse.findMany({
      where: { chapterId: chapterId },
    });
  }

  async getVerseById(verseId: number): Promise<Verse | null> {
    return this.prisma.verse.findUnique({
      where: { id: verseId },
    });
  }

  async getVersesByBook(bookId: number): Promise<Verse[]> {
    return this.prisma.verse.findMany({
      where: {
        chapter: {
          bookId: bookId
        }
      }
    });
  }

  async searchVerses(text: string): Promise<Verse[]> {
    return this.prisma.verse.findMany({
      where: {
        text: {
          contains: text
        }
      },
      take: 50 // Limit to 50 results for performance
    });
  }
}