import { Module } from '@nestjs/common';
import { EletroonService } from './eletroon.service';
import { EletroonController } from './eletroon.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EletroonService],
  controllers: [EletroonController],
})
export class EletroonModule {}
