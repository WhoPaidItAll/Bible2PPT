import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma.module';
import { BibleIndexModule } from '../bible-index/bible-index.module';
import { BibleModule } from '../bible/bible.module';
import { TemplateModule } from '../template/template.module';
import { PresentationModule } from '../presentation/presentation.module';

@Module({
  imports: [PrismaModule, BibleIndexModule, BibleModule, TemplateModule, PresentationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
