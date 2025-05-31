import { Module } from '@nestjs/common';
import { BibleIndexService } from './bible-index.service';
import { BibleIndexController } from './bible-index.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BibleIndexController],
  providers: [BibleIndexService],
  exports: [BibleIndexService],
})
export class BibleIndexModule {}