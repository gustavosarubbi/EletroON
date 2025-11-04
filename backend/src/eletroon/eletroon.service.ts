import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncomingData, ReadingData } from '../types/common.types';

@Injectable()
export class EletroonService {
  private readonly logger = new Logger(EletroonService.name);

  constructor(private prisma: PrismaService) {}

  async processarDadosRecebidos(rawData: IncomingData) {
    this.logger.log('Processando dados recebidos do medidor...');

    try {
      const meterId = this.extractMeterId(rawData);
      if (!meterId) {
        throw new Error('ID do medidor não encontrado nos dados recebidos');
      }

      const readingData = this.parseReadingData(rawData);
      
      await this.prisma.$transaction(async (prisma) => {
        // Criar ou atualizar dispositivo
        await prisma.device.upsert({
          where: { meterId },
          update: {},
          create: {
            meterId,
            name: `Medidor ${meterId}`,
            location: null,
          },
        });

        // Criar leitura
        await prisma.reading.create({
          data: {
            ...readingData,
            meterId,
          },
        });
      });

      this.logger.log(`Dados processados com sucesso para medidor ${meterId}`);
      return { message: 'Dados recebidos e processados com sucesso', meterId };
    } catch (error) {
      this.logger.error('Erro ao processar dados:', error);
      throw new InternalServerErrorException('Erro interno ao processar dados');
    }
  }

  private extractMeterId(data: IncomingData): number | null {
    if (data.id) {
      const id = parseInt(data.id.toString());
      return isNaN(id) ? null : id;
    }
    return null;
  }

  private parseReadingData(data: IncomingData): ReadingData {
    const fields = Object.values(data).map(v => parseFloat(v?.toString() || '0'));
    
    return {
      timestamp: new Date(),
      pa: this.parseNumeric(fields[1]),
      pb: this.parseNumeric(fields[2]),
      pc: this.parseNumeric(fields[3]),
      pt: this.parseNumeric(fields[4]),
      qa: this.parseNumeric(fields[5]),
      qb: this.parseNumeric(fields[6]),
      qc: this.parseNumeric(fields[7]),
      qt: this.parseNumeric(fields[8]),
      epa_c: this.parseNumeric(fields[9]),
      epb_c: this.parseNumeric(fields[10]),
      epc_c: this.parseNumeric(fields[11]),
      ept_c: this.parseNumeric(fields[12]),
      epa_g: this.parseNumeric(fields[13]),
      epb_g: this.parseNumeric(fields[14]),
      epc_g: this.parseNumeric(fields[15]),
      ept_g: this.parseNumeric(fields[16]),
      iarms: this.parseNumeric(fields[17]),
      ibrms: this.parseNumeric(fields[18]),
      icrms: this.parseNumeric(fields[19]),
      uarms: this.parseNumeric(fields[20]),
      ubrms: this.parseNumeric(fields[21]),
      ucrms: this.parseNumeric(fields[22]),
      pfa: this.parseNumeric(fields[23]),
      pfb: this.parseNumeric(fields[24]),
      pfc: this.parseNumeric(fields[25]),
      pft: this.parseNumeric(fields[26]),
    };
  }

  private parseNumeric(value: any): number {
    const parsed = parseFloat(value?.toString() || '0');
    return isNaN(parsed) ? 0 : parsed;
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

  async getDeviceReadings(meterId: number, limit: number = 100) {
    const device = await this.prisma.device.findUnique({
      where: { meterId },
      include: { readings: { orderBy: { timestamp: 'desc' }, take: limit } },
    });

    if (!device) {
      throw new NotFoundException(`Medidor ${meterId} não encontrado`);
    }

    if (!device.readings || device.readings.length === 0) {
      return [];
    }

    return device.readings;
  }

  async getDeviceReadingsByPeriod(
    meterId: number,
    startDate?: Date,
    endDate?: Date,
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

    const readings = await this.prisma.reading.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: limit,
    });

    return readings;
  }

  async listarDevices() {
    try {
      const devices = await this.prisma.device.findMany({
        select: {
          meterId: true,
          name: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { readings: true },
          },
        },
        orderBy: { meterId: 'asc' },
      });

      return devices;
    } catch (error) {
      this.logger.error('Falha ao listar devices', error.stack);
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