import { Injectable, Logger } from '@nestjs/common';
import { IncomingData, ReadingData } from '../../types/common.types';
import { logDebug, logError, logWarn } from '../../common/utils/logger.util';

@Injectable()
export class DataParserService {
  private readonly logger = new Logger(DataParserService.name);

  /**
   * Parse de dados JSON para ReadingData
   */
  parseReadingData(data: IncomingData): ReadingData {
    // Valores originais para logging/auditoria
    const fields = Object.values(data).map(v => parseFloat(v?.toString() || '0'));
    const rawValues: Record<string, number | null> = {};

    const getRawValue = (fieldNames: string[], fallbackIndex?: number): number | null => {
      for (const fieldName of fieldNames) {
        if (data[fieldName] !== undefined && data[fieldName] !== null) {
          const numeric = parseFloat(data[fieldName]?.toString() || '0');
          if (!Number.isNaN(numeric)) {
            return numeric;
          }
        }
      }

      if (
        typeof fallbackIndex === 'number' &&
        fallbackIndex >= 0 &&
        fallbackIndex < fields.length
      ) {
        const fallbackValue = fields[fallbackIndex];
        if (!Number.isNaN(fallbackValue)) {
          return fallbackValue;
        }
      }

      return null;
    };

    const getField = (
      alias: string,
      fieldNames: string[],
      fallbackIndex: number | undefined,
      parser: (v: any) => number = this.parseNumeric,
    ): number => {
      const rawValue = getRawValue(fieldNames, fallbackIndex);
      rawValues[alias] = rawValue;

      if (rawValue === null) {
        return 0;
      }

      return parser.call(this, rawValue);
    };

    // Validar valores antes de retornar
    const readingData: ReadingData = {
      timestamp: new Date(),
      // Potência ativa (pode ser negativa em caso de geração)
      pa: getField('pa', ['pa', 'PA', 'Pa'], 1, this.parsePower),
      pb: getField('pb', ['pb', 'PB', 'Pb'], 2, this.parsePower),
      pc: getField('pc', ['pc', 'PC', 'Pc'], 3, this.parsePower),
      pt: getField('pt', ['pt', 'PT', 'Pt'], 4, this.parsePower),
      // Potência reativa (pode ser negativa)
      qa: getField('qa', ['qa', 'QA', 'Qa'], 5, this.parsePower),
      qb: getField('qb', ['qb', 'QB', 'Qb'], 6, this.parsePower),
      qc: getField('qc', ['qc', 'QC', 'Qc'], 7, this.parsePower),
      qt: getField('qt', ['qt', 'QT', 'Qt'], 8, this.parsePower),
      // Energia consumida (pode ser negativa em cenários de geração líquida)
      epa_c: getField('epa_c', ['epa_c', 'EPA_C', 'Epa_c'], 9, this.parseEnergy),
      epb_c: getField('epb_c', ['epb_c', 'EPB_C', 'Epb_c'], 10, this.parseEnergy),
      epc_c: getField('epc_c', ['epc_c', 'EPC_C', 'Epc_c'], 11, this.parseEnergy),
      ept_c: getField('ept_c', ['ept_c', 'EPT_C', 'Ept_c'], 12, this.parseEnergy),
      // Energia gerada (pode receber valores negativos do medidor)
      epa_g: getField('epa_g', ['epa_g', 'EPA_G', 'Epa_g'], 13, this.parseEnergy),
      epb_g: getField('epb_g', ['epb_g', 'EPB_G', 'Epb_g'], 14, this.parseEnergy),
      epc_g: getField('epc_g', ['epc_g', 'EPC_G', 'Epc_g'], 15, this.parseEnergy),
      ept_g: getField('ept_g', ['ept_g', 'EPT_G', 'Ept_g'], 16, this.parseEnergy),
      // Corrente RMS (NUNCA pode ser negativa)
      iarms: getField('iarms', ['iarms', 'IARMS', 'Iarms'], 17, this.parseCurrent),
      ibrms: getField('ibrms', ['ibrms', 'IBRMS', 'Ibrms'], 18, this.parseCurrent),
      icrms: getField('icrms', ['icrms', 'ICRMS', 'Icrms'], 19, this.parseCurrent),
      // Tensão RMS (NUNCA pode ser negativa)
      uarms: getField('uarms', ['uarms', 'UARMS', 'Uarms'], 20, this.parseVoltage),
      ubrms: getField('ubrms', ['ubrms', 'UBRMS', 'Ubrms'], 21, this.parseVoltage),
      ucrms: getField('ucrms', ['ucrms', 'UCRMS', 'Ucrms'], 22, this.parseVoltage),
      // Fator de potência (deve estar entre -1 e 1)
      pfa: getField('pfa', ['pfa', 'PFA', 'Pfa'], 23, this.parsePowerFactor),
      pfb: getField('pfb', ['pfb', 'PFB', 'Pfb'], 24, this.parsePowerFactor),
      pfc: getField('pfc', ['pfc', 'PFC', 'Pfc'], 25, this.parsePowerFactor),
      pft: getField('pft', ['pft', 'PFT', 'Pft'], 26, this.parsePowerFactor),
    };

    // Logs diferenciados para acompanhamento
    const energyFields = ['epa_c', 'epb_c', 'epc_c', 'ept_c', 'epa_g', 'epb_g', 'epc_g', 'ept_g'];
    const negativeEnergyFields = energyFields
      .filter(field => rawValues[field] !== null && (rawValues[field] as number) < 0)
      .map(field => `${field}=${rawValues[field]}`);

    if (negativeEnergyFields.length > 0) {
      logWarn(this.logger, 'Valores de energia negativos recebidos', {
        fields: negativeEnergyFields,
      });
    }

    const correctedToZeroFields = ['iarms', 'ibrms', 'icrms', 'uarms', 'ubrms', 'ucrms']
      .filter(field => rawValues[field] !== null && (rawValues[field] as number) < 0)
      .map(field => `${field}=${rawValues[field]}`);

    if (correctedToZeroFields.length > 0) {
      logWarn(this.logger, 'Valores negativos ajustados para zero', {
        fields: correctedToZeroFields,
      });
    }

    return readingData;
  }

  /**
   * Processa dados recebidos em formato de texto separado por dois pontos (:)
   * Formato esperado: hora:minuto:segundo:pa:pb:pc:pt:qa:qb:qc:qt:epa_c:epb_c:epc_c:ept_c:epa_g:epb_g:epc_g:ept_g:iarms:ibrms:icrms:uarms:ubrms:ucrms:pfa:pfb:pfc:pft
   * Valores devem ser divididos por 100 (duas casas decimais de precisão)
   */
  parseTextLineData(line: string, baseDate?: Date): { meterId: number | null; readingData: ReadingData } | null {
    if (!line || typeof line !== 'string') {
      return null;
    }

    // Remover espaços e quebras de linha
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.length === 0) {
      return null;
    }

    // Separar por dois pontos
    const parts = cleanLine.split(':');
    
    // Formato esperado: hora:minuto:segundo:pa:pb:pc:pt:qa:qb:qc:qt:epa_c:epb_c:epc_c:ept_c:epa_g:epb_g:epc_g:ept_g:iarms:ibrms:icrms:uarms:ubrms:ucrms:pfa:pfb:pfc:pft
    // Total esperado: 29 campos (3 para tempo + 26 para dados)
    if (parts.length < 29) {
      logWarn(this.logger, 'Linha de texto com formato inválido', {
        parts: parts.length,
        preview: cleanLine.substring(0, 100),
      });
      return null;
    }

    try {
      // Extrair hora, minuto, segundo (primeiros 3 campos)
      let hora = parseInt(parts[0], 10) || 0;
      let minuto = parseInt(parts[1], 10) || 0;
      let segundo = parseInt(parts[2], 10) || 0;

      // Validar hora, minuto, segundo
      if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59 || segundo < 0 || segundo > 59) {
        logWarn(this.logger, 'Valores de tempo inválidos na linha de texto', {
          hora,
          minuto,
          segundo,
        });
        // Usar hora atual se inválido
        const now = baseDate || new Date();
        hora = now.getHours();
        minuto = now.getMinutes();
        segundo = now.getSeconds();
      }

      // Criar timestamp a partir da data base (hoje) + hora:minuto:segundo
      const dataLeitura = baseDate ? new Date(baseDate) : new Date();
      dataLeitura.setHours(hora, minuto, segundo, 0);

      // Se a hora da leitura for maior que a hora atual, assumir que é do dia anterior
      const agora = new Date();
      if (dataLeitura > agora) {
        dataLeitura.setDate(dataLeitura.getDate() - 1);
      }

      // Extrair dados (começando após hora:minuto:segundo = índice 3)
      const dataOffset = 3;
      
      // Função auxiliar para converter e dividir por 100
      const parseAndDivide = (value: string): number => {
        const num = parseFloat(value);
        if (isNaN(num)) return 0;
        // Dividir por 100 conforme a legenda (duas casas decimais de precisão)
        return num / 100;
      };

      // Parse dos dados conforme a ordem da legenda
      const readingData: ReadingData = {
        timestamp: dataLeitura,
        // Potência ativa (pode ser negativa em caso de geração)
        pa: this.parsePower(parseAndDivide(parts[dataOffset])),
        pb: this.parsePower(parseAndDivide(parts[dataOffset + 1])),
        pc: this.parsePower(parseAndDivide(parts[dataOffset + 2])),
        pt: this.parsePower(parseAndDivide(parts[dataOffset + 3])),
        // Potência reativa (pode ser negativa)
        qa: this.parsePower(parseAndDivide(parts[dataOffset + 4])),
        qb: this.parsePower(parseAndDivide(parts[dataOffset + 5])),
        qc: this.parsePower(parseAndDivide(parts[dataOffset + 6])),
        qt: this.parsePower(parseAndDivide(parts[dataOffset + 7])),
        // Energia consumida (pode ser negativa em cenários de geração líquida)
        epa_c: this.parseEnergy(parseAndDivide(parts[dataOffset + 8])),
        epb_c: this.parseEnergy(parseAndDivide(parts[dataOffset + 9])),
        epc_c: this.parseEnergy(parseAndDivide(parts[dataOffset + 10])),
        ept_c: this.parseEnergy(parseAndDivide(parts[dataOffset + 11])),
        // Energia gerada (pode apresentar valores negativos do medidor)
        epa_g: this.parseEnergy(parseAndDivide(parts[dataOffset + 12])),
        epb_g: this.parseEnergy(parseAndDivide(parts[dataOffset + 13])),
        epc_g: this.parseEnergy(parseAndDivide(parts[dataOffset + 14])),
        ept_g: this.parseEnergy(parseAndDivide(parts[dataOffset + 15])),
        // Corrente RMS (NUNCA pode ser negativa)
        iarms: this.parseCurrent(parseAndDivide(parts[dataOffset + 16])),
        ibrms: this.parseCurrent(parseAndDivide(parts[dataOffset + 17])),
        icrms: this.parseCurrent(parseAndDivide(parts[dataOffset + 18])),
        // Tensão RMS (NUNCA pode ser negativa)
        uarms: this.parseVoltage(parseAndDivide(parts[dataOffset + 19])),
        ubrms: this.parseVoltage(parseAndDivide(parts[dataOffset + 20])),
        ucrms: this.parseVoltage(parseAndDivide(parts[dataOffset + 21])),
        // Fator de potência (deve estar entre -1 e 1, já vem dividido por 100 na legenda)
        pfa: this.parsePowerFactor(parseAndDivide(parts[dataOffset + 22])),
        pfb: this.parsePowerFactor(parseAndDivide(parts[dataOffset + 23])),
        pfc: this.parsePowerFactor(parseAndDivide(parts[dataOffset + 24])),
        pft: this.parsePowerFactor(parseAndDivide(parts[dataOffset + 25])),
      };

      logDebug(this.logger, 'Linha de texto parseada', {
        timestamp: dataLeitura.toISOString(),
        pa: readingData.pa,
        pt: readingData.pt,
        ept_c: readingData.ept_c,
      });

      const negativeEnergyFields = ['epa_c', 'epb_c', 'epc_c', 'ept_c', 'epa_g', 'epb_g', 'epc_g', 'ept_g']
        .filter(field => (readingData as any)[field] < 0)
        .map(field => `${field}=${(readingData as any)[field]}`);

      if (negativeEnergyFields.length > 0) {
        logWarn(this.logger, 'Energia negativa recebida em linha de texto', {
          fields: negativeEnergyFields,
        });
      }

      const correctedToZeroFields: string[] = [];
      const currentAndVoltageOffsets = [
        { alias: 'iarms', index: 16 },
        { alias: 'ibrms', index: 17 },
        { alias: 'icrms', index: 18 },
        { alias: 'uarms', index: 19 },
        { alias: 'ubrms', index: 20 },
        { alias: 'ucrms', index: 21 },
      ];

      currentAndVoltageOffsets.forEach(({ alias, index }) => {
        const raw = parseAndDivide(parts[dataOffset + index]);
        if (raw < 0) {
          correctedToZeroFields.push(`${alias}=${raw}`);
        }
      });

      if (correctedToZeroFields.length > 0) {
        logWarn(this.logger, 'Corrente ou tensão ajustada para zero em linha de texto', {
          fields: correctedToZeroFields,
        });
      }

      return { meterId: null, readingData };
    } catch (error) {
      logError(this.logger, 'Erro ao processar linha de dados', error);
      return null;
    }
  }

  // Métodos auxiliares de parsing
  private parseNumeric(value: any): number {
    const parsed = parseFloat(value?.toString() || '0');
    return isNaN(parsed) ? 0 : parsed;
  }

  private parseEnergy(value: any): number {
    const parsed = parseFloat(value?.toString() || '0');
    if (isNaN(parsed)) {
      return 0;
    }
    return parsed;
  }

  private parseCurrent(value: any): number {
    const parsed = parseFloat(value?.toString() || '0');
    if (isNaN(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  }

  private parseVoltage(value: any): number {
    const parsed = parseFloat(value?.toString() || '0');
    if (isNaN(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  }

  private parsePower(value: any): number {
    const parsed = parseFloat(value?.toString() || '0');
    if (isNaN(parsed)) {
      return 0;
    }
    // Limitar valores extremos (mais de 1MW parece suspeito)
    if (Math.abs(parsed) > 1000000) {
      logWarn(this.logger, 'Valor de potência extremo detectado', {
        value: parsed,
      });
      return parsed > 0 ? 1000000 : -1000000;
    }
    return parsed;
  }

  private parsePowerFactor(value: any): number {
    const parsed = parseFloat(value?.toString() || '0');
    if (isNaN(parsed)) {
      return 0;
    }
    // Limitar entre -1 e 1
    if (parsed > 1) return 1;
    if (parsed < -1) return -1;
    return parsed;
  }
}

