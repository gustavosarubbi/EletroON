import { Module } from '@nestjs/common';
import { EletroonService } from './eletroon.service';
import { EletroonController } from './eletroon.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DataParserService } from './services/data-parser.service';
import { DataValidatorService } from './services/data-validator.service';
import { IpExtractorService } from './services/ip-extractor.service';
import { MeterIdExtractorService } from './services/meter-id-extractor.service';
import { MeterRequestResolverService } from './services/meter-request-resolver.service';

@Module({
  imports: [PrismaModule],
  providers: [
    EletroonService,
    DataParserService,
    DataValidatorService,
    IpExtractorService,
    MeterIdExtractorService,
    MeterRequestResolverService,
  ],
  controllers: [EletroonController],
  exports: [
    EletroonService,
    IpExtractorService,
    MeterIdExtractorService,
    MeterRequestResolverService,
  ],
})
export class EletroonModule {}
