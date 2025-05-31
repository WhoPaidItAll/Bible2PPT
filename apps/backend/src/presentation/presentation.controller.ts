import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { PresentationService } from './presentation.service';

export interface Presentation {
  id?: number;
  title: string;
  templateId: number;
  slides: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GeneratePresentationRequest {
  title: string;
  templateId: number;
  verseIds: number[];
}

@Controller('api/presentation')
export class PresentationController {
  constructor(private readonly presentationService: PresentationService) {}

  @Get()
  async getAllPresentations(): Promise<Presentation[]> {
    return this.presentationService.getAllPresentations();
  }

  @Get(':id')
  async getPresentationById(@Param('id') id: string): Promise<Presentation | null> {
    return this.presentationService.getPresentationById(Number(id));
  }

  @Post()
  async createPresentation(@Body() presentation: Presentation): Promise<Presentation> {
    return this.presentationService.createPresentation(presentation);
  }

  @Put(':id')
  async updatePresentation(@Param('id') id: string, @Body() presentation: Presentation): Promise<Presentation> {
    return this.presentationService.updatePresentation(Number(id), presentation);
  }

  @Delete(':id')
  async deletePresentation(@Param('id') id: string): Promise<Presentation> {
    return this.presentationService.deletePresentation(Number(id));
  }

  @Post('generate')
  async generatePresentation(@Body() request: GeneratePresentationRequest): Promise<Presentation> {
    return this.presentationService.generatePresentationFromVerses(
      request.title,
      request.templateId,
      request.verseIds,
    );
  }
}