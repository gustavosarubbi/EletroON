import { Test, TestingModule } from '@nestjs/testing';
import { DataParserService } from './data-parser.service';
import { Logger } from '@nestjs/common';

describe('DataParserService', () => {
  let service: DataParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataParserService],
    }).compile();

    service = module.get<DataParserService>(DataParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseReadingData', () => {
    it('should parse valid JSON data', () => {
      const data = {
        pa: 1000,
        pb: 2000,
        pc: 1500,
        pt: 4500,
        epa_c: 100,
        epb_c: 200,
        epc_c: 150,
        ept_c: 450,
      };

      const result = service.parseReadingData(data);

      expect(result).toBeDefined();
      expect(result.pa).toBe(1000);
      expect(result.pt).toBe(4500);
      expect(result.ept_c).toBe(450);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle missing fields with default values', () => {
      const data = {
        pa: 1000,
      };

      const result = service.parseReadingData(data);

      expect(result).toBeDefined();
      expect(result.pa).toBe(1000);
      expect(result.pb).toBe(0);
    });
  });

  describe('parseTextLineData', () => {
    it('should parse valid text line', () => {
      const line = '10:30:45:1000:2000:1500:4500:500:1000:750:2250:10000:20000:15000:45000:0:0:0:0:10:20:15:22000:22100:22050:0:0:0:0:0:0:0:0:0.95:0.92:0.98:0.95';
      const baseDate = new Date('2024-01-01T00:00:00Z');

      const result = service.parseTextLineData(line, baseDate);

      expect(result).toBeDefined();
      expect(result.readingData).toBeDefined();
      expect(result.readingData.timestamp).toBeInstanceOf(Date);
    });

    it('should return null for invalid line', () => {
      const line = 'invalid:line';

      const result = service.parseTextLineData(line);

      expect(result).toBeNull();
    });
  });
});

