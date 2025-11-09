import { Injectable, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { IpExtractorService } from './ip-extractor.service';
import { MeterIdExtractorService } from './meter-id-extractor.service';
import type { MeterDataDto } from '../dto/meter-data.dto';
import type { TextDataDto } from '../dto/text-data.dto';

export interface NormalizedMeterRequest {
  clientIp: string;
  meterId: number;
  payload: MeterDataDto | TextDataDto | string | Record<string, unknown>;
  contentType: string;
  baseDate?: Date;
  rawBody?: Buffer;
  headers: Record<string, unknown>;
}

interface ResolveParams {
  request: Request;
  body: MeterDataDto | TextDataDto | string | undefined;
  rawBody?: Buffer;
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
}

@Injectable()
export class MeterRequestResolverService {
  constructor(
    private readonly ipExtractorService: IpExtractorService,
    private readonly meterIdExtractorService: MeterIdExtractorService,
  ) {}

  resolve(params: ResolveParams): NormalizedMeterRequest {
    const { request, body, rawBody, query = {}, headers = {} } = params;

    const clientIp = this.extractClientIp(request);
    const resolvedHeaders = request.headers ?? headers;
    const contentType =
      (resolvedHeaders['content-type'] as string) ||
      (resolvedHeaders['Content-Type'] as string) ||
      '';

    const normalizedPayload = this.resolvePayload({
      body,
      request,
      rawBody,
    });

    const meterId = this.resolveMeterId(
      normalizedPayload ?? {},
      query,
      resolvedHeaders,
    );

    const baseDate = this.resolveBaseDate(normalizedPayload, query);

    return {
      clientIp,
      meterId,
      payload: normalizedPayload ?? {},
      contentType,
      baseDate,
      rawBody: this.pickRawBody(rawBody, request),
      headers: resolvedHeaders as Record<string, unknown>,
    };
  }

  private extractClientIp(request: Request): string {
    const clientIp = this.ipExtractorService.extractClientIp(request);
    if (!clientIp || clientIp === 'unknown') {
      throw new BadRequestException(
        'IP do cliente não pôde ser identificado. Verifique a configuração de rede ou proxy.',
      );
    }
    return clientIp;
  }

  private resolvePayload({
    body,
    request,
    rawBody,
  }: {
    body: MeterDataDto | TextDataDto | string | undefined;
    request: Request;
    rawBody?: Buffer;
  }) {
    const candidates: Array<MeterDataDto | TextDataDto | string | Record<string, unknown> | undefined> =
      [
        body,
        request.body as Record<string, unknown> | string | undefined,
        this.parseBuffer(rawBody),
        this.parseBuffer((request as any).rawBody),
      ];

    for (const candidate of candidates) {
      const normalized = this.normalizeCandidate(candidate);
      if (normalized !== undefined) {
        return normalized;
      }
    }

    return undefined;
  }

  private normalizeCandidate(
    candidate: MeterDataDto | TextDataDto | string | Record<string, unknown> | undefined,
  ) {
    if (candidate === undefined || candidate === null) {
      return undefined;
    }

    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (!trimmed) {
        return undefined;
      }

      const parsed = this.tryParseJson(trimmed);
      return parsed ?? trimmed;
    }

    if (typeof candidate === 'object') {
      const keys = Object.keys(candidate);
      if (keys.length === 0) {
        return undefined;
      }
      return candidate;
    }

    return undefined;
  }

  private parseBuffer(buffer?: Buffer | string) {
    if (!buffer) {
      return undefined;
    }

    const value = Buffer.isBuffer(buffer) ? buffer.toString('utf-8') : buffer;
    if (!value.trim()) {
      return undefined;
    }

    const parsed = this.tryParseJson(value);
    return parsed ?? value;
  }

  private tryParseJson(value: string) {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  private resolveMeterId(
    payload: MeterDataDto | TextDataDto | Record<string, unknown>,
    query: Record<string, unknown>,
    headers: Record<string, unknown>,
  ): number {
    const meterId = this.meterIdExtractorService.extractMeterIdStandardized(
      payload,
      query,
      headers,
    );

    if (!meterId || Number.isNaN(meterId) || meterId <= 0) {
      throw new BadRequestException(
        'ID do medidor é obrigatório. Forneça o valor via header `x-meter-id`, campo `id`/`meterId` no corpo ou parâmetro `meterId`.',
      );
    }

    return meterId;
  }

  private resolveBaseDate(
    payload: MeterDataDto | TextDataDto | Record<string, unknown> | undefined,
    query: Record<string, unknown>,
  ): Date | undefined {
    const baseDateCandidate =
      (this.extractDateFromPayload(payload) as string | undefined) ??
      (query?.baseDate as string | undefined);

    if (!baseDateCandidate) {
      return undefined;
    }

    const baseDate = new Date(baseDateCandidate);
    return Number.isNaN(baseDate.valueOf()) ? undefined : baseDate;
  }

  private extractDateFromPayload(payload?: MeterDataDto | TextDataDto | Record<string, unknown>) {
    if (!payload || typeof payload !== 'object') {
      return undefined;
    }
    const typedPayload = payload as TextDataDto & { baseDate?: string };
    return typedPayload.baseDate;
  }

  private pickRawBody(buffer: Buffer | undefined, request: Request) {
    if (buffer && Buffer.isBuffer(buffer)) {
      return buffer;
    }

    const requestRawBody = (request as any).rawBody;
    if (Buffer.isBuffer(requestRawBody)) {
      return requestRawBody;
    }

    if (typeof request.body === 'string') {
      return Buffer.from(request.body, 'utf-8');
    }

    return undefined;
  }
}


