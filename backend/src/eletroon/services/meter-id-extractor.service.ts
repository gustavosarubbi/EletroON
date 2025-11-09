import { Injectable, Logger } from '@nestjs/common';
import { logDebug, logWarn } from '../../common/utils/logger.util';

@Injectable()
export class MeterIdExtractorService {
  private readonly logger = new Logger(MeterIdExtractorService.name);

  /**
   * Extrai o ID do medidor de múltiplas fontes em ordem de prioridade:
   * 1. HEADER (prioridade máxima)
   * 2. BODY (campo 'id' ou 'meterId')
   * 3. QUERY (parâmetro 'meterId')
   * 
   * Se encontrar em qualquer fonte, retorna imediatamente (não continua buscando)
   */
  extractMeterIdStandardized(
    body: any,
    query?: any,
    headers?: any
  ): number | null {
    logDebug(this.logger, 'Extraindo ID do medidor');

    const attempts: Array<{ source: 'header' | 'body' | 'query'; value: number | null }> = [
      { source: 'header', value: this.extractFromHeaders(headers) },
      { source: 'body', value: this.extractFromBody(body) },
      { source: 'query', value: this.extractFromQuery(query) },
    ];

    for (const attempt of attempts) {
      if (attempt.value !== null) {
        logDebug(this.logger, 'ID encontrado', {
          source: attempt.source,
          meterId: attempt.value,
        });
        return attempt.value;
      }
    }

    logWarn(this.logger, 'ID do medidor não encontrado nas fontes disponíveis', {
      hasHeaders: Boolean(headers),
      bodyKeys: body && typeof body === 'object' && !Array.isArray(body) ? Object.keys(body) : undefined,
      queryKeys: query && typeof query === 'object' ? Object.keys(query) : undefined,
    });

    return null;
  }

  /**
   * Extrai ID dos headers
   */
  private extractFromHeaders(headers?: any): number | null {
    if (!headers || typeof headers !== 'object') {
      return null;
    }

    const headerNamesToTry = [
      'x-meter-id',
      'x-device-id', 
      'meter-id',
      'device-id',
      'x-meterid',
      'x-deviceid',
      'meterid',
      'deviceid'
    ];

    const allHeaderKeys = Object.keys(headers);

    // Primeira tentativa: buscar nos nomes exatos (lowercase)
    for (const headerName of headerNamesToTry) {
      const headerValue = headers[headerName];
      
      if (headerValue !== undefined && headerValue !== null) {
        const value = Array.isArray(headerValue) ? headerValue[0] : headerValue;
        const id = this.parseId(value);
        
        if (id !== null) {
          logDebug(this.logger, 'Header com ID encontrado', {
            header: headerName,
            meterId: id,
          });
          return id;
        }
      }
    }

    // Segunda tentativa: buscar de forma case-insensitive em TODOS os headers
    for (const headerKey of allHeaderKeys) {
      const lowerKey = headerKey.toLowerCase().trim();
      
      if (headerNamesToTry.includes(lowerKey)) {
        const headerValue = headers[headerKey];
        const value = Array.isArray(headerValue) ? headerValue[0] : headerValue;
        
        if (value !== undefined && value !== null) {
          const id = this.parseId(value);
          if (id !== null) {
            logDebug(this.logger, 'Header com ID encontrado (case-insensitive)', {
              header: headerKey,
              meterId: id,
            });
            return id;
          }
        }
      }
    }

    return null;
  }

  /**
   * Extrai ID do body (JSON)
   */
  private extractFromBody(body: any): number | null {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return null;
    }

    // Tentar campo "id"
    if (body.id !== undefined && body.id !== null) {
      const id = this.parseId(body.id);
      if (id !== null) {
        logDebug(this.logger, 'ID encontrado no body', {
          field: 'id',
          meterId: id,
        });
        return id;
      }
    }

    // Tentar campo "meterId"
    if (body.meterId !== undefined && body.meterId !== null) {
      const id = this.parseId(body.meterId);
      if (id !== null) {
        logDebug(this.logger, 'ID encontrado no body', {
          field: 'meterId',
          meterId: id,
        });
        return id;
      }
    }

    return null;
  }

  /**
   * Extrai ID da query string
   */
  private extractFromQuery(query?: any): number | null {
    if (!query || typeof query !== 'object') {
      return null;
    }

    if (query.meterId !== undefined && query.meterId !== null) {
      const id = this.parseId(query.meterId);
      if (id !== null) {
        logDebug(this.logger, 'ID encontrado na query', {
          meterId: id,
        });
        return id;
      }
    }

    return null;
  }

  /**
   * Parse um valor para número (ID do medidor)
   * Aceita número, string numérica, ou array com número
   */
  private parseId(value: any): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    // Se já é número
    if (typeof value === 'number') {
      if (!isNaN(value) && value > 0) {
        return Math.floor(value);
      }
      return null;
    }

    // Se é string, tentar parsear
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const id = parseInt(trimmed, 10);
      if (!isNaN(id) && id > 0) {
        return id;
      }
    }

    // Se é array, pegar primeiro elemento
    if (Array.isArray(value) && value.length > 0) {
      return this.parseId(value[0]);
    }

    return null;
  }
}
