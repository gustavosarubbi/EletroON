import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IncomingData } from '../../types/common.types';

@Injectable()
export class DataValidatorService {
  private readonly logger = new Logger(DataValidatorService.name);

  /**
   * Verifica se os dados têm informações mínimas relevantes
   * Rejeita dados vazios ou com todos valores zerados
   */
  hasMinimalRelevantData(data: IncomingData): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Excluir campos que não são dados de leitura
    const excludedFields = ['id', 'meterId', 'meter_id', 'deviceId', 'device_id', 'timestamp', 'baseDate'];
    const readingFields = Object.entries(data)
      .filter(([key]) => !excludedFields.includes(key))
      .map(([, value]) => value);

    // Verificar se há pelo menos alguns dados numéricos válidos (não-zero)
    const numericFields = readingFields.filter(v => {
      const num = parseFloat(String(v || '0'));
      return !isNaN(num) && num !== 0;
    });

    // Se houver pelo menos 3 campos numéricos não-zero, considera dados mínimos válidos
    const hasMinimal = numericFields.length >= 3;
    
    if (!hasMinimal) {
      this.logger.warn(`Dados insuficientes: apenas ${numericFields.length} campos não-zero encontrados`);
    }

    return hasMinimal;
  }

  /**
   * Valida dados do medidor e lança exceção se inválidos
   */
  validateMeterData(data: IncomingData, clientIp?: string): void {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new BadRequestException(
        `Dados inválidos. Envie um objeto JSON válido.${clientIp ? ` IP: ${clientIp}` : ''}`
      );
    }

    // Verificar se tem dados mínimos
    if (!this.hasMinimalRelevantData(data)) {
      throw new BadRequestException(
        `Dados insuficientes. Envie pelo menos alguns valores de leitura válidos (não-zero).${clientIp ? ` IP: ${clientIp}` : ''}`
      );
    }
  }

  /**
   * Valida timestamp
   */
  validateTimestamp(timestamp: Date): boolean {
    if (!timestamp || !(timestamp instanceof Date)) {
      return false;
    }

    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearAhead = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    // Timestamp deve estar dentro de um ano atrás ou à frente
    return timestamp >= oneYearAgo && timestamp <= oneYearAhead;
  }
}

