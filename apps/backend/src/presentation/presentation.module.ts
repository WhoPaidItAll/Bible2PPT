import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TemplateModule } from '../template/template.module';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';

@Module({
  imports: [TemplateModule],
  controllers: [PresentationController],
  providers: [PresentationService, PrismaService],
  exports: [PresentationService],
})
export class PresentationModule {}