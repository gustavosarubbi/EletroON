import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService
  ) {}

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
      // Determinar tempo limite para considerar dispositivo online (últimos 5 minutos)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
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
        room: user.room || null,
        createdAt: user.createdAt.toISOString().split('T')[0],
        devices: user.devices.map(device => {
          const lastReading = device.readings[0];
          const lastReadingDate = lastReading ? lastReading.timestamp : null;
          const isOnline = lastReadingDate && lastReadingDate >= fiveMinutesAgo;
          
          return {
            meterId: device.meterId,
            name: device.name,
            location: device.location || 'Local não definido',
            status: isOnline ? 'ONLINE' : 'OFFLINE',
            lastReadingAt: lastReadingDate
              ? lastReadingDate.toLocaleString('pt-BR')
              : 'Nunca',
            lastReading: lastReading ? {
              timestamp: lastReading.timestamp.toLocaleString('pt-BR'),
              qt: lastReading.qt,
            } : null,
          };
        }),
      }));
    } catch (error) {
      this.logger.error('Erro ao buscar usuários:', error);
      throw error;
    }
  }

  async getDevices() {
    try {
      // Determinar tempo limite para considerar dispositivo online (últimos 5 minutos)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      // Buscar todos os dispositivos com suas relações
      // Usar select para escolher apenas campos que existem no banco
      const devices = await this.prisma.device.findMany({
        select: {
          meterId: true,
          name: true,
          location: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              room: true,
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

      return devices.map(device => {
        const lastReading = device.readings[0];
        const lastReadingDate = lastReading ? lastReading.timestamp : null;
        const isOnline = lastReadingDate && lastReadingDate >= fiveMinutesAgo;
        
        return {
          meterId: device.meterId,
          name: device.name,
          location: device.location || 'Local não definido',
          status: isOnline ? 'ONLINE' : 'OFFLINE',
          lastReadingAt: lastReadingDate
            ? lastReadingDate.toLocaleString('pt-BR')
            : 'Nunca',
          lastReading: lastReading ? {
            timestamp: lastReading.timestamp.toLocaleString('pt-BR'),
            qt: lastReading.qt || 0,
          } : null,
          user: device.user ? {
            id: device.user.id,
            email: device.user.email,
            room: device.user.room || null,
          } : null,
        };
      });
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

  async deleteUser(userId: number) {
    try {
      // Verificar se o usuário existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se não é um admin (não permitir deletar admins)
      if (user.role === 'ADMIN') {
        throw new Error('Não é possível deletar um usuário administrador');
      }

      // Desassociar dispositivos do usuário antes de deletar
      await this.prisma.device.updateMany({
        where: { userId },
        data: { userId: null },
      });

      // Deletar o usuário
      await this.prisma.user.delete({
        where: { id: userId },
      });

      this.logger.log(`Usuário ${userId} deletado com sucesso`);
      return { success: true, message: 'Usuário deletado com sucesso' };
    } catch (error) {
      this.logger.error(`Erro ao deletar usuário ${userId}:`, error);
      throw error;
    }
  }

  async createUser(email: string, password: string, role: string = 'USER', room?: string) {
    try {
      // Validar se a sala já existe (case-insensitive) para usuários regulares
      if (room && role === 'USER') {
        const normalizedRoom = room.trim().toLowerCase();
        
        // Buscar todos os usuários com role USER e comparar salas (case-insensitive)
        const users = await this.prisma.user.findMany({
          where: {
            role: 'USER',
            room: {
              not: null,
            },
          },
          select: {
            room: true,
          },
        });

        const roomExists = users.some(user => 
          user.room && user.room.toLowerCase() === normalizedRoom
        );

        if (roomExists) {
          throw new Error(`Já existe um usuário com a sala "${room.trim()}". Cada sala deve ser única.`);
        }
      }

      const user = await this.usersService.create(email, password, role, room);
      
      this.logger.log(`Usuário criado com sucesso: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  async updateUser(userId: number, email?: string, password?: string, room?: string) {
    try {
      // Verificar se o usuário existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se não é um admin (não permitir alterar admins através deste endpoint)
      if (user.role === 'ADMIN') {
        throw new Error('Não é possível alterar um usuário administrador');
      }

      // Validar se a sala já existe (case-insensitive) para usuários regulares
      if (room !== undefined && user.role === 'USER') {
        const normalizedRoom = room?.trim() || null;
        
        // Se está definindo uma sala, verificar se já existe
        if (normalizedRoom) {
          const normalizedRoomLower = normalizedRoom.toLowerCase();
          
          // Buscar todos os usuários com role USER (exceto o atual) e comparar salas (case-insensitive)
          const users = await this.prisma.user.findMany({
            where: {
              role: 'USER',
              id: {
                not: userId, // Excluir o próprio usuário da verificação
              },
              room: {
                not: null,
              },
            },
            select: {
              room: true,
            },
          });

          const roomExists = users.some(u => 
            u.room && u.room.toLowerCase() === normalizedRoomLower
          );

          if (roomExists) {
            throw new Error(`Já existe um usuário com a sala "${normalizedRoom}". Cada sala deve ser única.`);
          }
        }
      }

      const updateData: any = {};
      if (email) updateData.email = email.toLowerCase().trim();
      if (password) {
        const bcrypt = await import('bcrypt');
        updateData.password = await bcrypt.hash(password, 10);
      }
      if (room !== undefined) updateData.room = room?.trim() || null;

      // Se a sala foi alterada, atualizar location de todos os dispositivos associados
      if (room !== undefined && user.room !== room) {
        await this.prisma.device.updateMany({
          where: { userId },
          data: { location: room?.trim() || null },
        });
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      this.logger.log(`Usuário ${userId} atualizado com sucesso`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Erro ao atualizar usuário ${userId}:`, error);
      throw error;
    }
  }

  async associateDeviceToUser(meterId: number, userId: number) {
    try {
      // Verificar se o dispositivo existe
      const device = await this.prisma.device.findUnique({
        where: { meterId },
      });

      if (!device) {
        throw new Error('Dispositivo não encontrado');
      }

      // Verificar se o usuário existe e obter sua sala
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (!user.room) {
        throw new Error('Usuário não possui uma sala associada. Defina uma sala para o usuário antes de associar medidores.');
      }

      // Verificar se o dispositivo já está associado a outro usuário
      if (device.userId && device.userId !== userId) {
        throw new Error('Dispositivo já está associado a outro usuário');
      }

      // Associar o dispositivo ao usuário e atualizar location com a sala do usuário
      await this.prisma.device.update({
        where: { meterId },
        data: { 
          userId,
          location: user.room, // Atualizar location com a sala do usuário
        },
      });

      this.logger.log(`Dispositivo ${meterId} associado ao usuário ${userId} (sala: ${user.room}) com sucesso`);
      return { success: true, message: 'Dispositivo associado com sucesso' };
    } catch (error) {
      this.logger.error(`Erro ao associar dispositivo ${meterId} ao usuário ${userId}:`, error);
      throw error;
    }
  }

  async disassociateDeviceFromUser(meterId: number) {
    try {
      // Verificar se o dispositivo existe
      const device = await this.prisma.device.findUnique({
        where: { meterId },
      });

      if (!device) {
        throw new Error('Dispositivo não encontrado');
      }

      // Desassociar o dispositivo (definir userId como null)
      await this.prisma.device.update({
        where: { meterId },
        data: { userId: null },
      });

      this.logger.log(`Dispositivo ${meterId} desassociado com sucesso`);
      return { success: true, message: 'Dispositivo desassociado com sucesso' };
    } catch (error) {
      this.logger.error(`Erro ao desassociar dispositivo ${meterId}:`, error);
      throw error;
    }
  }
}
