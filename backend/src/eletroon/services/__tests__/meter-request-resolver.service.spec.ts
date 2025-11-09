import type { Request } from 'express';
import { MeterRequestResolverService } from '../meter-request-resolver.service';
import { IpExtractorService } from '../ip-extractor.service';
import { MeterIdExtractorService } from '../meter-id-extractor.service';

describe('MeterRequestResolverService', () => {
  let resolver: MeterRequestResolverService;

  beforeEach(() => {
    resolver = new MeterRequestResolverService(
      new IpExtractorService(),
      new MeterIdExtractorService(),
    );
  });

  const createRequest = (overrides: Partial<Request> = {}): Request => {
    return {
      headers: {},
      method: 'POST',
      ...overrides,
    } as Request;
  };

  it('deve resolver payload JSON e ID do header', () => {
    const headers = {
      'x-forwarded-for': '10.0.0.1',
      'x-meter-id': '42',
      'content-type': 'application/json',
    };

    const request = createRequest({
      headers,
      body: { meterId: 99, pa: 123 },
    });

    const result = resolver.resolve({
      request,
      body: request.body,
      headers,
      query: {},
    });

    expect(result.clientIp).toBe('10.0.0.1');
    expect(result.meterId).toBe(42);
    expect(result.payload).toMatchObject({ pa: 123 });
  });

  it('deve resolver payload texto a partir do raw body e baseDate da query', () => {
    const textPayload = 'amostra-de-dados';
    const headers = {
      'x-forwarded-for': '192.168.0.5',
      'x-meter-id': '17',
      'content-type': 'text/plain',
    };

    const request = createRequest({
      headers,
      body: undefined,
    });
    (request as any).rawBody = Buffer.from(textPayload);

    const result = resolver.resolve({
      request,
      body: undefined,
      rawBody: Buffer.from(textPayload),
      headers,
      query: { baseDate: '2024-01-01T00:00:00.000Z' },
    });

    expect(result.clientIp).toBe('192.168.0.5');
    expect(result.meterId).toBe(17);
    expect(result.payload).toBe(textPayload);
    expect(result.baseDate?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });
});

