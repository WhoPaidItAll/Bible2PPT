import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { BibleService } from './bible.service';

@Controller('api/bible')
export class BibleController {
  constructor(private readonly bibleService: BibleService) {}

  @Get('chapter/:id/verses')
  async getVersesByChapter(@Param('id') id: string) {
    return this.bibleService.getVersesByChapter(id);
  }

  @Get('verse/:id')
  async getVerseById(@Param('id', ParseIntPipe) id: number) {
    return this.bibleService.getVerseById(id);
  }

  @Get('book/:id/verses')
  async getVersesByBook(@Param('id', ParseIntPipe) id: number) {
    return this.bibleService.getVersesByBook(id);
  }

  @Get('search')
  async searchVerses(@Query('text') text: string) {
    return this.bibleService.searchVerses(text);
  }
}