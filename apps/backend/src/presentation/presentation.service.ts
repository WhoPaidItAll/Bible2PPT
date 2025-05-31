import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TemplateService } from '../template/template.service';

export interface Presentation {
  id?: number;
  title: string;
  templateId: number;
  slides: string; // JSON or string representation of slides
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class PresentationService {
  constructor(
    private prisma: PrismaService,
    private templateService: TemplateService,
  ) {}

  async getAllPresentations(): Promise<Presentation[]> {
    return this.prisma.presentation.findMany();
  }

  async getPresentationById(id: number): Promise<Presentation | null> {
    return this.prisma.presentation.findUnique({
      where: { id },
    });
  }

  async createPresentation(presentation: Presentation): Promise<Presentation> {
    const template = await this.templateService.getTemplateById(presentation.templateId);
    if (!template) {
      throw new Error(`Template with ID ${presentation.templateId} not found`);
    }
    return this.prisma.presentation.create({
      data: {
        title: presentation.title,
        templateId: presentation.templateId,
        slides: presentation.slides,
      },
    });
  }

  async updatePresentation(id: number, presentation: Presentation): Promise<Presentation> {
    return this.prisma.presentation.update({
      where: { id },
      data: {
        title: presentation.title,
        templateId: presentation.templateId,
        slides: presentation.slides,
      },
    });
  }

  async deletePresentation(id: number): Promise<Presentation> {
    return this.prisma.presentation.delete({
      where: { id },
    });
  }

  async generatePresentationFromVerses(
    title: string,
    templateId: number,
    verseIds: number[],
  ): Promise<Presentation> {
    const template = await this.templateService.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    // Placeholder for actual slide generation logic
    const slides = JSON.stringify({
      slides: verseIds.map((id) => ({ verseId: id, content: 'Placeholder content' })),
    });
    return this.createPresentation({
      title,
      templateId,
      slides,
    });
  }
}