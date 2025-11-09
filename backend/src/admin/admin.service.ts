import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getStats() {
    try {
      // Contar total de dispositivos
      const totalDevices = await this.prisma.device.count();
      
      // Contar dispositivos online (com leituras recentes - últimos 5 minutos)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const onlineDevices = await this.prisma.device.count({
        where: {
          readings: {
            some: {
              timestamp: {
                gte: fiveMinutesAgo,
              },
            },
          },
        },
      });
      
      const offlineDevices = totalDevices - onlineDevices;
      
      // Contar dispositivos não associados (sem userId)
      const availableDevices = await this.prisma.device.count({
        where: {
          userId: null,
        },
      });
      
      // Contar usuários (apenas usuários regulares, não admin)
      const totalUsers = await this.prisma.user.count({
        where: {
          role: 'USER',
        },
      });
      
      // Contar total de leituras
      const totalReadings = await this.prisma.reading.count();

      return {
        totalDevices,
        onlineDevices,
        offlineDevices,
        availableDevices,
        totalUsers,
        totalReadings,
      };
    } catch (error) {
      this.logger.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  async getUsers() {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          role: 'USER', // Apenas usuários regulares
        },
        include: {
          devices: {
            select: {
              meterId: true,
              name: true,
              location: true,
              readings: {
                orderBy: { timestamp: 'desc' },
                take: 1,
                select: {
                  timestamp: true,
                  qt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transformar dados para o formato esperado pelo frontend
      return users.map(user => ({
        id: user.id,
        email: user.email,
        password: user.password, // Em produção, não retornar senha
        role: user.role.toLowerCase(),
        createdAt: user.createdAt.toISOString().split('T')[0],
        devices: user.devices.map(device => ({
          meterId: device.meterId,
          name: device.name,
          location: device.location || 'Local não definido',
          status: device.readings.length > 0 ? 'ONLINE' : 'OFFLINE',
          lastReadingAt: device.readings.length > 0 
            ? device.readings[0].timestamp.toLocaleString('pt-BR')
            : 'Nunca',
          lastReading: device.readings.length > 0 ? {
            timestamp: device.readings[0].timestamp.toLocaleString('pt-BR'),
            qt: device.readings[0].qt,
          } : null,
        })),
      }));
    } catch (error) {
      this.logger.error('Erro ao buscar usuários:', error);
      throw error;
    }
  }

  async getDevices() {
    try {
      const devices = await this.prisma.device.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          readings: {
            orderBy: { timestamp: 'desc' },
            take: 1,
            select: {
              timestamp: true,
              qt: true,
            },
          },
        },
        orderBy: { meterId: 'asc' },
      });

      return devices.map(device => ({
        meterId: device.meterId,
        name: device.name,
        location: device.location || 'Local não definido',
        status: device.readings.length > 0 ? 'ONLINE' : 'OFFLINE',
        lastReadingAt: device.readings.length > 0 
          ? device.readings[0].timestamp.toLocaleString('pt-BR')
          : 'Nunca',
        lastReading: device.readings.length > 0 ? {
          timestamp: device.readings[0].timestamp.toLocaleString('pt-BR'),
          qt: device.readings[0].qt,
        } : null,
        user: device.user ? {
          id: device.user.id,
          email: device.user.email,
        } : null,
      }));
    } catch (error) {
      this.logger.error('Erro ao buscar dispositivos:', error);
      throw error;
    }
  }

  async getConsumptionLast24Hours() {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Buscar todas as leituras das últimas 24 horas
      const readings = await this.prisma.reading.findMany({
        where: {
          timestamp: {
            gte: twentyFourHoursAgo,
            lte: now,
          },
        },
        orderBy: { timestamp: 'asc' },
        select: {
          timestamp: true,
          ept_c: true,
          ept_g: true,
          pt: true, // Potência total para cálculo alternativo
        },
      });

      // Agrupar por hora (7 períodos de aproximadamente 3-4 horas cada)
      const hourlyData: {
        hour: string;
        consumption: number;
        netConsumption: number;
        importConsumption: number;
        generation: number;
        reliability: 'measured' | 'estimated' | 'no-data';
      }[] = [];
      const periods = 7;
      const periodDuration = 24 / periods; // aproximadamente 3.4 horas por período

      for (let i = 0; i < periods; i++) {
        const periodStart = new Date(twentyFourHoursAgo.getTime() + i * periodDuration * 60 * 60 * 1000);
        const periodEnd = new Date(twentyFourHoursAgo.getTime() + (i + 1) * periodDuration * 60 * 60 * 1000);
        
        const periodReadings = readings.filter(r => 
          r.timestamp >= periodStart && r.timestamp < periodEnd
        );

        const periodHours = periodDuration;
        const energySummary = this.summarizeEnergyWindow(periodReadings, periodHours);
        const hourLabel = `${String(Math.floor(periodStart.getHours())).padStart(2, '0')}:00`;
        
        hourlyData.push({
          hour: hourLabel,
          consumption: energySummary.netConsumption, // compatibilidade retroativa
          netConsumption: energySummary.netConsumption,
          importConsumption: energySummary.consumption,
          generation: energySummary.generation,
          reliability: energySummary.reliability,
        });

        if (energySummary.reliability === 'estimated') {
          this.logger.warn(
            `Consumo das últimas 24h estimado via potência para o período ${hourLabel}`,
          );
        }
      }

      return hourlyData;
    } catch (error) {
      this.logger.error('Erro ao buscar consumo das últimas 24h:', error);
      throw error;
    }
  }

  async getWeeklyReadings() {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Buscar leituras dos últimos 7 dias
      const readings = await this.prisma.reading.findMany({
        where: {
          timestamp: {
            gte: sevenDaysAgo,
            lte: now,
          },
        },
        orderBy: { timestamp: 'asc' },
        select: {
          timestamp: true,
          ept_c: true,
          ept_g: true,
          pt: true,
        },
      });

      // Agrupar por dia da semana
      const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const dailyData: {
        day: string;
        consumption: number;
        netConsumption: number;
        importConsumption: number;
        generation: number;
        count: number;
        reliability: 'measured' | 'estimated' | 'no-data';
      }[] = [];

      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(sevenDaysAgo);
        dayStart.setDate(dayStart.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const dayReadings = readings.filter(r => 
          r.timestamp >= dayStart && r.timestamp <= dayEnd
        );

        const energySummary = this.summarizeEnergyWindow(dayReadings, 24);

        const readingCount = dayReadings.length;

        dailyData.push({
          day: daysOfWeek[dayStart.getDay()],
          consumption: energySummary.netConsumption,
          netConsumption: energySummary.netConsumption,
          importConsumption: energySummary.consumption,
          generation: energySummary.generation,
          count: readingCount,
          reliability: energySummary.reliability,
        });

        if (energySummary.reliability === 'estimated') {
          this.logger.warn(
            `Consumo semanal estimado via potência para o dia ${daysOfWeek[dayStart.getDay()]}`,
          );
        }
      }

      return dailyData;
    } catch (error) {
      this.logger.error('Erro ao buscar leituras semanais:', error);
      throw error;
    }
  }

  private summarizeEnergyWindow(
    readings: Array<{ ept_c: number | null; ept_g: number | null; pt: number | null }>,
    periodHours: number,
  ): {
    consumption: number;
    generation: number;
    netConsumption: number;
    reliability: 'measured' | 'estimated' | 'no-data';
  } {
    if (
      !Array.isArray(readings) ||
      readings.length === 0 ||
      !Number.isFinite(periodHours) ||
      periodHours <= 0
    ) {
      return {
        consumption: 0,
        generation: 0,
        netConsumption: 0,
        reliability: 'no-data',
      };
    }

    const sanitize = (value: number | null | undefined): number =>
      typeof value === 'number' && Number.isFinite(value) ? value : 0;

    const first = readings[0];
    const last = readings[readings.length - 1];

    const firstConsumption = sanitize(first.ept_c);
    const lastConsumption = sanitize(last.ept_c);
    const firstGeneration = sanitize(first.ept_g);
    const lastGeneration = sanitize(last.ept_g);

    let consumption = lastConsumption - firstConsumption;
    let generation = lastGeneration - firstGeneration;

    const positivePowerSum = readings.reduce(
      (sum, reading) => sum + Math.max(0, sanitize(reading.pt)),
      0,
    );
    const negativePowerSum = readings.reduce(
      (sum, reading) => sum + Math.min(0, sanitize(reading.pt)),
      0,
    );

    const avgPositivePower = readings.length ? positivePowerSum / readings.length : 0;
    const avgNegativePower = readings.length ? negativePowerSum / readings.length : 0;

    const periodFractionOfDay = periodHours / 24;
    const fallbackConsumption = Math.max(0, avgPositivePower) * periodFractionOfDay;
    const fallbackGeneration = Math.abs(Math.min(0, avgNegativePower)) * periodFractionOfDay;

    const hasGenerationEvidence =
      generation > 0 || readings.some(reading => sanitize(reading.pt) < 0);

    const isConsumptionReset =
      firstConsumption > 0 &&
      lastConsumption >= 0 &&
      lastConsumption < firstConsumption &&
      firstConsumption - lastConsumption >= firstConsumption * 0.9;

    const isGenerationReset =
      firstGeneration > 0 &&
      lastGeneration >= 0 &&
      lastGeneration < firstGeneration &&
      firstGeneration - lastGeneration >= firstGeneration * 0.9;

    let usedFallback = false;

    if (readings.length === 1) {
      consumption = fallbackConsumption;
      generation = fallbackGeneration;
      usedFallback = true;
    } else {
      if (consumption < 0) {
        if (isConsumptionReset && !hasGenerationEvidence) {
          consumption = fallbackConsumption;
          usedFallback = true;
        } else {
          consumption = 0;
        }
      } else if (consumption === 0 && fallbackConsumption > 0 && !hasGenerationEvidence) {
        consumption = fallbackConsumption;
        usedFallback = true;
      }

      if (generation < 0) {
        if (isGenerationReset) {
          generation = fallbackGeneration;
          usedFallback = true;
        } else {
          generation = 0;
        }
      } else if (generation === 0 && fallbackGeneration > 0 && hasGenerationEvidence) {
        generation = fallbackGeneration;
        usedFallback = true;
      }
    }

    consumption = Math.max(0, consumption);
    generation = Math.max(0, generation);

    const netConsumption = consumption - generation;

    return {
      consumption,
      generation,
      netConsumption,
      reliability: usedFallback ? 'estimated' : 'measured',
    };
  }

  async getRecentActivityLogs(limit: number = 5) {
    try {
      // Buscar dispositivos com leituras recentes
      const recentReadings = await this.prisma.reading.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit * 10, // Buscar mais para filtrar por dispositivo
        include: {
          device: {
            select: {
              meterId: true,
              name: true,
            },
          },
        },
      });

      // Agrupar por dispositivo e pegar a leitura mais recente de cada
      const deviceMap = new Map<number, typeof recentReadings[0]>();
      for (const reading of recentReadings) {
        if (!deviceMap.has(reading.meterId)) {
          deviceMap.set(reading.meterId, reading);
        }
        if (deviceMap.size >= limit) break;
      }

      const logs = Array.from(deviceMap.values()).map(reading => {
        const timeAgo = Math.floor((Date.now() - reading.timestamp.getTime()) / (1000 * 60));
        let timeLabel = '';
        
        if (timeAgo < 1) {
          timeLabel = 'Agora mesmo';
        } else if (timeAgo < 60) {
          timeLabel = `Há ${timeAgo} minuto${timeAgo > 1 ? 's' : ''}`;
        } else {
          const hoursAgo = Math.floor(timeAgo / 60);
          timeLabel = `Há ${hoursAgo} hora${hoursAgo > 1 ? 's' : ''}`;
        }

        return {
          type: 'success',
          message: `Medidor #${reading.device.meterId} conectado com sucesso`,
          time: timeLabel,
          timestamp: reading.timestamp,
        };
      });

      // Adicionar eventos de leituras realizadas
      const totalReadingsToday = await this.prisma.reading.count({
        where: {
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });

      if (totalReadingsToday > 0) {
        logs.push({
          type: 'info',
          message: `Leitura de energia realizada em ${totalReadingsToday} medidor${totalReadingsToday > 1 ? 'es' : ''}`,
          time: 'Hoje',
          timestamp: new Date(),
        });
      }

      return logs.slice(0, limit);
    } catch (error) {
      this.logger.error('Erro ao buscar logs de atividade:', error);
      throw error;
    }
  }
}
