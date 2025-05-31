import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { BibleIndexService } from './bible-index.service';

@Controller('api/bible-index')
export class BibleIndexController {
  constructor(private readonly bibleIndexService: BibleIndexService) {}

  @Get('book/:id')
  async getBookInfo(@Param('id', ParseIntPipe) id: number) {
    return this.bibleIndexService.getBookInfo(id);
  }

  @Get('book/:id/name')
  async getBookName(@Param('id', ParseIntPipe) id: number) {
    return this.bibleIndexService.getBookName(id);
  }

  @Get('books')
  async getAllBooks() {
    return this.bibleIndexService.getAllBooks();
  }

  @Get('book/:id/chapters')
  async getChaptersByBook(@Param('id', ParseIntPipe) id: number) {
    return this.bibleIndexService.getChaptersByBook(id);
  }
}