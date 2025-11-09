import { DataParserService } from '../data-parser.service';

describe('DataParserService', () => {
  let service: DataParserService;

  beforeEach(() => {
    service = new DataParserService();
  });

  it('deve converter dados JSON em ReadingData', () => {
    const result = service.parseReadingData({
      pa: '100',
      pb: 200,
      pt: '400',
      ept_c: '12345.67',
      iarms: '-10',
      uarms: '220',
      pfa: '0.95',
    });

    expect(result.pa).toBe(100);
    expect(result.pb).toBe(200);
    expect(result.pt).toBe(400);
    expect(result.ept_c).toBe(12345.67);
    expect(result.iarms).toBe(0);
    expect(result.uarms).toBe(220);
    expect(result.pfa).toBeCloseTo(0.95);
  });

  it('deve retornar null para linha de texto com formato inválido', () => {
    const result = service.parseTextLineData('10:20:30:100');
    expect(result).toBeNull();
  });

  it('deve parsear linha de texto válida ajustando correntes negativas', () => {
    const parts = [
      '10',
      '30',
      '15',
      '1000',
      '2000',
      '3000',
      '6000',
      '100',
      '200',
      '300',
      '600',
      '123456',
      '234567',
      '345678',
      '456789',
      '111111',
      '222222',
      '333333',
      '444444',
      '-500',
      '600',
      '700',
      '22000',
      '22100',
      '22200',
      '98',
      '97',
      '96',
      '95',
    ];

    const textLine = parts.join(':');
    const result = service.parseTextLineData(textLine);

    expect(result).not.toBeNull();
    expect(result?.readingData.pa).toBeCloseTo(10);
    expect(result?.readingData.pt).toBeCloseTo(60);
    expect(result?.readingData.ept_c).toBeCloseTo(4567.89);
    expect(result?.readingData.iarms).toBe(0);
    expect(result?.readingData.uarms).toBeCloseTo(220);
    expect(result?.readingData.pft).toBeCloseTo(0.95);
  });
});

