import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface Template {
  id?: number;
  name: string;
  layout: string; // JSON or string representation of layout
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

  async getAllTemplates(): Promise<Template[]> {
    return this.prisma.template.findMany();
  }

  async getTemplateById(id: number): Promise<Template | null> {
    return this.prisma.template.findUnique({
      where: { id },
    });
  }

  async createTemplate(template: Template): Promise<Template> {
    return this.prisma.template.create({
      data: {
        name: template.name,
        layout: template.layout,
      },
    });
  }

  async updateTemplate(id: number, template: Template): Promise<Template> {
    return this.prisma.template.update({
      where: { id },
      data: {
        name: template.name,
        layout: template.layout,
      },
    });
  }

  async deleteTemplate(id: number): Promise<Template> {
    return this.prisma.template.delete({
      where: { id },
    });
  }
}