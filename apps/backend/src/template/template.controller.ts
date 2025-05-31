import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { TemplateService } from './template.service';

export interface Template {
  id?: number;
  name: string;
  layout: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Controller('api/template')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  async getAllTemplates(): Promise<Template[]> {
    return this.templateService.getAllTemplates();
  }

  @Get(':id')
  async getTemplateById(@Param('id') id: string): Promise<Template | null> {
    return this.templateService.getTemplateById(Number(id));
  }

  @Post()
  async createTemplate(@Body() template: Template): Promise<Template> {
    return this.templateService.createTemplate(template);
  }

  @Put(':id')
  async updateTemplate(@Param('id') id: string, @Body() template: Template): Promise<Template | null> {
    return this.templateService.updateTemplate(Number(id), template);
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string): Promise<Template | null> {
    return this.templateService.deleteTemplate(Number(id));
  }
}