import { Injectable, Logger, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncomingData, ReadingData } from '../types/common.types';
import { DataParserService } from './services/data-parser.service';
import { DataValidatorService } from './services/data-validator.service';
import { IpExtractorService } from './services/ip-extractor.service';
import { MeterIdExtractorService } from './services/meter-id-extractor.service';
import { logDebug, logError, logInfo, logWarn } from '../common/utils/logger.util';

@Injectable()
export class EletroonService {
  private readonly logger = new Logger(EletroonService.name);

  constructor(
    private prisma: PrismaService,
    private dataParser: DataParserService,
    private dataValidator: DataValidatorService,
    private ipExtractor: IpExtractorService,
    private meterIdExtractor: MeterIdExtractorService,
  ) {}

  /**
   * Extrai o IP do cliente do request (delegado para IpExtractorService)
   */
  extractClientIp(req: any): string {
    return this.ipExtractor.extractClientIp(req);
  }

  /**
   * Valida se o IP do cliente é válido (delegado para IpExtractorService)
   */
  isValidClientIp(ip: string): boolean {
    return this.ipExtractor.isValidIp(ip);
  }

  /**
   * Extrai o ID do medidor de forma padronizada (delegado para MeterIdExtractorService)
   */
  extractMeterIdStandardized(
    body: any,
    query?: any,
    headers?: any
  ): number | null {
    return this.meterIdExtractor.extractMeterIdStandardized(body, query, headers);
  }

  async processarDadosRecebidos(
    rawData: IncomingData,
    clientIp: string,
    meterId: number
  ) {
    logInfo(this.logger, 'Processando dados recebidos', {
      clientIp,
      meterId,
    });

    try {
      // Validar se rawData existe
      if (rawData === null || rawData === undefined) {
        logWarn(this.logger, 'Dados recebidos vazios', {
          meterId,
          clientIp,
        });
        throw new BadRequestException('Dados recebidos são inválidos ou estão vazios.');
      }

      // Validar tipo de dados
      if (typeof rawData !== 'object' || Array.isArray(rawData)) {
        logWarn(this.logger, 'Tipo de dados inválido', {
          type: typeof rawData,
          isArray: Array.isArray(rawData),
          meterId,
        });
        throw new BadRequestException('Dados recebidos devem ser um objeto.');
      }

      // ID já foi validado no controller (vem do header)
      // Não precisa re-extrair nem re-validar
      const finalMeterId: number = meterId;
      logDebug(this.logger, 'ID confirmado para processamento', {
        meterId: finalMeterId,
      });

      // Tentar validar dados mínimos, mas não bloquear (ID já foi encontrado no header)
      // Se o ID foi encontrado no header, significa que o medidor está autenticado
      try {
        this.dataValidator.validateMeterData(rawData, clientIp);
        logDebug(this.logger, 'Dados validados com sucesso', {
          meterId: finalMeterId,
        });
      } catch (validationError) {
        // Se a validação falhar, logar aviso mas continuar
        // O ID sendo encontrado no header é suficiente para processar
        logWarn(this.logger, 'Validação mínima falhou, prosseguindo com processamento', {
          meterId: finalMeterId,
          message: (validationError as Error).message,
        });
        // Não bloquear o processamento - ID no header é suficiente
      }
      
      // Parse dos dados de leitura
      const readingData = this.dataParser.parseReadingData(rawData);
      
      // Se conseguiu processar dados (mesmo que mínimos), marca como ONLINE
      // O dispositivo está enviando dados, então está online
      const deviceStatus = 'ONLINE';
      
      await this.prisma.$transaction(async (prisma) => {
        // Criar ou atualizar dispositivo com status e IP
        await prisma.device.upsert({
          where: { meterId: finalMeterId },
          update: {
            status: deviceStatus,
            ...(clientIp !== 'unknown' && { ipAddress: clientIp }),
            updatedAt: new Date(),
          },
          create: {
            meterId: finalMeterId,
            name: `Medidor ${finalMeterId}`,
            location: null,
            ...(clientIp !== 'unknown' && { ipAddress: clientIp }),
            status: deviceStatus,
          },
        });

        // Criar leitura mesmo com dados mínimos
        await prisma.reading.create({
          data: {
            ...readingData,
            meterId: finalMeterId,
          },
        });
      });

      logInfo(this.logger, 'Dados processados com sucesso', {
        meterId: finalMeterId,
        status: deviceStatus,
      });
      return { 
        message: 'Dados recebidos e processados com sucesso', 
        meterId: finalMeterId,
        status: deviceStatus,
      };
    } catch (error) {
      logError(this.logger, 'Erro ao processar dados', error, {
        meterId,
        clientIp,
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Se o erro for por falta de ID, já foi logado acima
      // Não tentamos criar dispositivo offline pois ID é obrigatório
      throw new InternalServerErrorException(
        error.message || 'Erro interno ao processar dados'
      );
    }
  }


  /**
   * Processa dados recebidos em formato de texto separado por dois pontos (:)
   * Formato esperado: hora:minuto:segundo:pa:pb:pc:pt:qa:qb:qc:qt:epa_c:epb_c:epc_c:ept_c:epa_g:epb_g:epc_g:ept_g:iarms:ibrms:icrms:uarms:ubrms:ucrms:pfa:pfb:pfc:pft
   * Valores devem ser divididos por 100 (duas casas decimais de precisão)
   */

  /**
   * Processa múltiplas linhas de dados em formato texto
   */
  async processarDadosTexto(
    textData: string,
    clientIp: string,
    meterId: number,
    baseDate?: Date
  ) {
    logInfo(this.logger, 'Processando dados texto', {
      clientIp,
      meterId,
    });

    if (!textData || typeof textData !== 'string') {
      throw new BadRequestException('Dados de texto inválidos.');
    }

    // Separar linhas
    const lines = textData.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) {
      throw new BadRequestException('Nenhuma linha de dados encontrada.');
    }

    logDebug(this.logger, 'Quantidade de linhas recebidas', {
      meterId,
      lineCount: lines.length,
    });

    // ID já foi validado no controller (vem do header)
    const finalMeterId: number = meterId;

    // Parse de todas as linhas primeiro
    const parsedReadings: Array<{ readingData: ReadingData; lineIndex: number }> = [];
    const errors: Array<{ lineIndex: number; error: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parsed = this.dataParser.parseTextLineData(line, baseDate);
      
      if (!parsed) {
        errors.push({ lineIndex: i + 1, error: 'Formato de linha inválido' });
        continue;
      }

      parsedReadings.push({
        readingData: parsed.readingData,
        lineIndex: i + 1,
      });
    }

    if (parsedReadings.length === 0) {
      throw new BadRequestException('Nenhuma linha válida encontrada para processar.');
    }

    logInfo(this.logger, 'Resumo do parsing de linhas', {
      meterId: finalMeterId,
      validLines: parsedReadings.length,
      totalLines: lines.length,
      errors: errors.length,
    });

    // Processar em transação para melhor performance
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Criar ou atualizar dispositivo uma única vez com IP
        await prisma.device.upsert({
          where: { meterId: finalMeterId },
          update: {
            status: 'ONLINE',
            ...(clientIp !== 'unknown' && { ipAddress: clientIp }),
            updatedAt: new Date(),
          },
          create: {
            meterId: finalMeterId,
            name: `Medidor ${finalMeterId}`,
            location: null,
            ...(clientIp !== 'unknown' && { ipAddress: clientIp }),
            status: 'ONLINE',
          },
        });

        // Inserir todas as leituras de uma vez (ou em lotes se necessário)
        const batchSize = 100;
        for (let i = 0; i < parsedReadings.length; i += batchSize) {
          const batch = parsedReadings.slice(i, i + batchSize);
          
          await prisma.reading.createMany({
            data: batch.map(({ readingData }) => ({
              ...readingData,
              meterId: finalMeterId,
            })),
            skipDuplicates: true, // Pular duplicatas baseado em constraints únicas (se houver)
          });
        }
      });

      logInfo(this.logger, 'Processamento de lote concluído', {
        meterId: finalMeterId,
        processed: parsedReadings.length,
        errors: errors.length,
      });

      return {
        message: `Processados ${parsedReadings.length} de ${lines.length} linhas`,
        processed: parsedReadings.length,
        errors: errors.length,
        meterId,
        errorDetails: errors,
      };
    } catch (error) {
      logError(this.logger, 'Erro ao processar dados texto em lote', error, {
        meterId: finalMeterId,
        clientIp,
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao processar dados de texto.');
    }
  }


  async getLatestReading(meterId: number) {
    const device = await this.prisma.device.findUnique({
      where: { meterId },
      include: { readings: { orderBy: { timestamp: 'desc' }, take: 1 } },
    });

    if (!device || !device.readings || device.readings.length === 0) {
      throw new NotFoundException(`Nenhuma leitura encontrada para o medidor ${meterId}`);
    }

    return device.readings[0];
  }

  async getDeviceReadings(meterId: number, page: number = 1, limit: number = 100) {
    const device = await this.prisma.device.findUnique({
      where: { meterId },
    });

    if (!device) {
      throw new NotFoundException(`Medidor ${meterId} não encontrado`);
    }

    const skip = (page - 1) * limit;

    const [readings, total] = await Promise.all([
      this.prisma.reading.findMany({
        where: { meterId },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.reading.count({
        where: { meterId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: readings,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async getDeviceReadingsByPeriod(
    meterId: number,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 1000,
  ) {
    const device = await this.prisma.device.findUnique({
      where: { meterId },
    });

    if (!device) {
      throw new NotFoundException(`Medidor ${meterId} não encontrado`);
    }

    const where: any = { meterId };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [readings, total] = await Promise.all([
      this.prisma.reading.findMany({
        where,
        orderBy: { timestamp: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.reading.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: readings,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async listarDevices(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [devices, total] = await Promise.all([
        this.prisma.device.findMany({
          select: {
            meterId: true,
            name: true,
            location: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { readings: true },
            },
          },
          orderBy: { meterId: 'asc' },
          skip,
          take: limit,
        }),
        this.prisma.device.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: devices,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      logError(this.logger, 'Falha ao listar devices', error);
      throw new InternalServerErrorException('Erro interno ao listar devices.');
    }
  }

  async getMultipleDevicesReadings(
    meterIds: number[],
    startDate?: Date,
    endDate?: Date,
    limit: number = 2000,
  ) {
    if (!meterIds || meterIds.length === 0) {
      return [];
    }

    logInfo(this.logger, 'Buscando leituras para múltiplos dispositivos', {
      meterIds: meterIds.length,
      limit,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });

    const where: any = {
      meterId: { in: meterIds },
    };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    const readings = await this.prisma.reading.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: limit,
    });

    logDebug(this.logger, 'Resumo da consulta de leituras', {
      returned: readings.length,
      meterIds: meterIds.length,
    });
    if (readings.length > 0) {
      const first = readings[0];
      const last = readings[readings.length - 1];
      const timeSpan = last.timestamp.getTime() - first.timestamp.getTime();
      const hours = timeSpan / (1000 * 60 * 60);

      logDebug(this.logger, 'Faixa temporal das leituras', {
        firstTimestamp: first.timestamp.toISOString(),
        lastTimestamp: last.timestamp.toISOString(),
        hours: Number.isFinite(hours) ? hours.toFixed(2) : undefined,
      });

      const eptCValues = readings.map((r) => r.ept_c);
      const uniqueValues = [...new Set(eptCValues)];

      if (uniqueValues.length === 1) {
        logWarn(this.logger, 'Valores de energia acumulada constantes', {
          value: eptCValues[0],
          registros: readings.length,
        });
      } else {
        const sortedValues = uniqueValues.sort((a, b) => a - b);
        const diff = sortedValues[sortedValues.length - 1] - sortedValues[0];
        logDebug(this.logger, 'Amplitude de energia acumulada', {
          diff,
          registros: readings.length,
        });
      }

      if (hours < 1) {
        logWarn(this.logger, 'Dados com menos de uma hora de histórico', {
          hours: hours.toFixed(2),
        });
      }
    }

    return readings;
  }

  async exportReadingsReport(
    meterIds: number[],
    startDate?: Date,
    endDate?: Date,
    format: string = 'csv',
  ) {
    const where: any = {};
    
    if (meterIds && meterIds.length > 0) {
      where.meterId = { in: meterIds };
    }
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    const readings = await this.prisma.reading.findMany({
      where,
      include: {
        device: {
          select: {
            meterId: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
      take: 10000,
    });

    if (format === 'csv') {
      const csvHeaders = [
        'Timestamp',
        'Meter ID',
        'Device Name',
        'Location',
        'PA (kW)',
        'PB (kW)',
        'PC (kW)',
        'PT (kW)',
        'QA (kVAR)',
        'QB (kVAR)',
        'QC (kVAR)',
        'QT (kVAR)',
        'EPA_C (kWh)',
        'EPB_C (kWh)',
        'EPC_C (kWh)',
        'EPT_C (kWh)',
        'EPA_G (kWh)',
        'EPB_G (kWh)',
        'EPC_G (kWh)',
        'EPT_G (kWh)',
        'IARMS (A)',
        'IBRMS (A)',
        'ICRMS (A)',
        'UARMS (V)',
        'UBRMS (V)',
        'UCRMS (V)',
        'PFA',
        'PFB',
        'PFC',
        'PFT',
      ];

      const csvRows = readings.map(reading => [
        reading.timestamp.toISOString(),
        reading.meterId.toString(),
        reading.device.name || '',
        reading.device.location || '',
        reading.pa.toString(),
        reading.pb.toString(),
        reading.pc.toString(),
        reading.pt.toString(),
        reading.qa.toString(),
        reading.qb.toString(),
        reading.qc.toString(),
        reading.qt.toString(),
        reading.epa_c.toString(),
        reading.epb_c.toString(),
        reading.epc_c.toString(),
        reading.ept_c.toString(),
        reading.epa_g.toString(),
        reading.epb_g.toString(),
        reading.epc_g.toString(),
        reading.ept_g.toString(),
        reading.iarms.toString(),
        reading.ibrms.toString(),
        reading.icrms.toString(),
        reading.uarms.toString(),
        reading.ubrms.toString(),
        reading.ucrms.toString(),
        reading.pfa.toString(),
        reading.pfb.toString(),
        reading.pfc.toString(),
        reading.pft.toString(),
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return {
        content: csvContent,
        filename: `relatorio_energia_${startDate?.toISOString().split('T')[0] || 'all'}_${endDate?.toISOString().split('T')[0] || 'all'}.csv`,
        contentType: 'text/csv',
      };
    }

    // JSON format
    return {
      content: JSON.stringify(readings, null, 2),
      filename: `relatorio_energia_${startDate?.toISOString().split('T')[0] || 'all'}_${endDate?.toISOString().split('T')[0] || 'all'}.json`,
      contentType: 'application/json',
    };
  }

  async listarDevicesDoUsuario(userId: number, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [devices, total] = await Promise.all([
        this.prisma.device.findMany({
          where: {
            userId,
          },
          select: {
            meterId: true,
            name: true,
            location: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { readings: true },
            },
          },
          orderBy: { meterId: 'asc' },
          skip,
          take: limit,
        }),
        this.prisma.device.count({
          where: { userId },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: devices,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      logError(this.logger, 'Falha ao listar devices do usuário', error, {
        userId,
      });
      throw new InternalServerErrorException('Erro interno ao listar devices do usuário.');
    }
  }
}