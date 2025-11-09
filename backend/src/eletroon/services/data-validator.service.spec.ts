import { Test, TestingModule } from '@nestjs/testing';
import { DataValidatorService } from './data-validator.service';
import { BadRequestException } from '@nestjs/common';

describe('DataValidatorService', () => {
  let service: DataValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataValidatorService],
    }).compile();

    service = module.get<DataValidatorService>(DataValidatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hasMinimalRelevantData', () => {
    it('should return true for valid data', () => {
      const data = {
        pa: 1000,
        pb: 2000,
        pc: 1500,
      };

      const result = service.hasMinimalRelevantData(data);

      expect(result).toBe(true);
    });

    it('should return false for empty data', () => {
      const data = {};

      const result = service.hasMinimalRelevantData(data);

      expect(result).toBe(false);
    });

    it('should return false for data with only zeros', () => {
      const data = {
        pa: 0,
        pb: 0,
        pc: 0,
      };

      const result = service.hasMinimalRelevantData(data);

      expect(result).toBe(false);
    });
  });

  describe('validateMeterData', () => {
    it('should not throw for valid data', () => {
      const data = {
        pa: 1000,
        pb: 2000,
        pc: 1500,
      };

      expect(() => service.validateMeterData(data)).not.toThrow();
    });

    it('should throw for invalid data', () => {
      const data = {};

      expect(() => service.validateMeterData(data)).toThrow(BadRequestException);
    });
  });
});

