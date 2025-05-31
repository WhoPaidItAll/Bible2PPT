import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
// Define custom interfaces for Book and Chapter
interface Book {
  id: number;
  name: string;
  chapters?: Chapter[];
}

interface Chapter {
  id: string;
  number: number;
  bookId: number;
  verses?: any[];
}

@Injectable()
export class BibleIndexService {
  constructor(private prisma: PrismaService) {}

  async getBookInfo(bookId: number): Promise<Book | null> {
    return this.prisma.book.findUnique({
      where: { id: bookId },
    });
  }

  async getBookName(bookId: number): Promise<string | null> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });
    return book ? book.name : null;
  }

  async getAllBooks(): Promise<Book[]> {
    return this.prisma.book.findMany();
  }

  async getChaptersByBook(bookId: number): Promise<Chapter[]> {
    return this.prisma.chapter.findMany({
      where: { bookId: bookId },
    });
  }
}