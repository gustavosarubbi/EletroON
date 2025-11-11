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

  // Função auxiliar para buscar rooms de um usuário (workaround temporário)
  private async getUserRooms(userId: number): Promise<Array<{ id: number; name: string }>> {
    try {
      const rooms = await this.prisma.$queryRaw<Array<{ id: number; name: string }>>`
        SELECT r.id, r.name
        FROM "UserRoom" ur
        INNER JOIN "Room" r ON ur."roomId" = r.id
        WHERE ur."userId" = ${userId}
        ORDER BY r.name
      `;
      return rooms;
    } catch (error) {
      this.logger.error(`Erro ao buscar rooms do usuário ${userId}:`, error);
      return [];
    }
  }

  // Função auxiliar para deletar todas as relações UserRoom de um usuário
  private async deleteUserRooms(userId: number): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM "UserRoom" WHERE "userId" = ${userId}
    `;
  }

  // Função auxiliar para verificar se uma relação UserRoom existe
  private async findUserRoom(userId: number, roomId: number): Promise<{ id: number; userId: number; roomId: number } | null> {
    const result = await this.prisma.$queryRaw<Array<{ id: number; userId: number; roomId: number }>>`
      SELECT id, "userId", "roomId"
      FROM "UserRoom"
      WHERE "userId" = ${userId} AND "roomId" = ${roomId}
      LIMIT 1
    `;
    return result.length > 0 ? result[0] : null;
  }

  // Função auxiliar para criar uma relação UserRoom
  private async createUserRoom(userId: number, roomId: number): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO "UserRoom" ("userId", "roomId", "createdAt")
      VALUES (${userId}, ${roomId}, NOW())
    `;
  }

  // Função auxiliar para deletar uma relação UserRoom
  private async deleteUserRoom(userId: number, roomId: number): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM "UserRoom"
      WHERE "userId" = ${userId} AND "roomId" = ${roomId}
    `;
  }

  // Função auxiliar para buscar todas as salas (workaround temporário)
  private async getAllRooms(): Promise<Array<{ id: number; name: string }>> {
    const rooms = await this.prisma.$queryRaw<Array<{ id: number; name: string }>>`
      SELECT id, name
      FROM "Room"
      ORDER BY name
    `;
    return rooms;
  }

  // Função auxiliar para buscar ou criar uma sala (workaround temporário)
  private async findOrCreateRoom(roomName: string): Promise<{ id: number; name: string }> {
    // Buscar todas as salas e comparar case-insensitive
    const allRooms = await this.getAllRooms();
    let room = allRooms.find(r => r.name.toLowerCase() === roomName.toLowerCase());

    if (!room) {
      // Criar nova sala
      const result = await this.prisma.$queryRaw<Array<{ id: number; name: string }>>`
        INSERT INTO "Room" (name, "createdAt", "updatedAt")
        VALUES (${roomName}, NOW(), NOW())
        RETURNING id, name
      `;
      room = result[0];
    }

    return room;
  }

  // Função auxiliar para buscar uma sala por nome (workaround temporário)
  private async findRoomByName(roomName: string): Promise<{ id: number; name: string } | null> {
    const allRooms = await this.getAllRooms();
    const room = allRooms.find(r => r.name.toLowerCase() === roomName.toLowerCase());
    return room || null;
  }

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
      
      // Buscar usuários com devices (sem rooms por enquanto devido ao Prisma Client desatualizado)
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

      // Buscar rooms separadamente usando query raw (workaround temporário)
      const userIds = users.map(u => u.id);
      const userRooms = userIds.length > 0 
        ? await this.prisma.$queryRaw<Array<{ userId: number; roomName: string }>>`
            SELECT ur."userId", r.name as "roomName"
            FROM "UserRoom" ur
            INNER JOIN "Room" r ON ur."roomId" = r.id
            WHERE ur."userId" = ANY(${userIds}::int[])
            ORDER BY ur."userId", r.name
          `
        : [];

      // Agrupar rooms por userId
      const roomsByUserId = new Map<number, string[]>();
      for (const ur of userRooms) {
        if (!roomsByUserId.has(ur.userId)) {
          roomsByUserId.set(ur.userId, []);
        }
        roomsByUserId.get(ur.userId)!.push(ur.roomName);
      }

      // Transformar dados para o formato esperado pelo frontend
      return users.map(user => ({
        id: user.id,
        email: user.email,
        password: user.password, // Em produção, não retornar senha
        role: user.role.toLowerCase(),
        rooms: roomsByUserId.get(user.id) || [],
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

      // Buscar rooms para usuários que têm dispositivos (workaround temporário)
      const userIds = devices
        .map(d => d.user?.id)
        .filter((id): id is number => id !== null && id !== undefined);
      
      const userRooms = userIds.length > 0
        ? await this.prisma.$queryRaw<Array<{ userId: number; roomName: string }>>`
            SELECT ur."userId", r.name as "roomName"
            FROM "UserRoom" ur
            INNER JOIN "Room" r ON ur."roomId" = r.id
            WHERE ur."userId" = ANY(${userIds}::int[])
            ORDER BY ur."userId", r.name
          `
        : [];

      // Agrupar rooms por userId
      const roomsByUserId = new Map<number, string[]>();
      for (const ur of userRooms) {
        if (!roomsByUserId.has(ur.userId)) {
          roomsByUserId.set(ur.userId, []);
        }
        roomsByUserId.get(ur.userId)!.push(ur.roomName);
      }

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
            rooms: roomsByUserId.get(device.user.id) || [],
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

  async createUser(email: string, password: string, role: string = 'USER', rooms?: string[]) {
    try {
      const user = await this.usersService.create(email, password, role);
      
      // Adicionar salas se fornecidas
      if (rooms && rooms.length > 0 && role === 'USER') {
        for (const roomName of rooms) {
          if (roomName && roomName.trim()) {
            await this.addRoomToUser(user.id, roomName.trim());
          }
        }
      }
      
      // Buscar usuário e suas salas
      const userRooms = await this.getUserRooms(user.id);
      const userWithRooms = {
        ...user,
        rooms: userRooms.map(r => ({ room: { id: r.id, name: r.name } })),
      };
      
      this.logger.log(`Usuário criado com sucesso: ${user.email}`);
      return userWithRooms;
    } catch (error) {
      this.logger.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  async updateUser(userId: number, email?: string, password?: string, rooms?: string[]) {
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

      const updateData: any = {};
      if (email) updateData.email = email.toLowerCase().trim();
      if (password) {
        const bcrypt = await import('bcrypt');
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Atualizar dados básicos do usuário
      if (Object.keys(updateData).length > 0) {
        await this.prisma.user.update({
          where: { id: userId },
          data: updateData,
        });
      }

      // Atualizar salas se fornecido
      if (rooms !== undefined && user.role === 'USER') {
        // Remover todas as salas atuais
        await this.deleteUserRooms(userId);

        // Adicionar novas salas
        for (const roomName of rooms) {
          if (roomName && roomName.trim()) {
            await this.addRoomToUser(userId, roomName.trim());
          }
        }

        // Atualizar location dos dispositivos com a primeira sala (ou null se não houver salas)
        const firstRoom = rooms.length > 0 && rooms[0]?.trim() ? rooms[0].trim() : null;
        await this.prisma.device.updateMany({
          where: { userId },
          data: { location: firstRoom },
        });
      }

      // Buscar usuário atualizado e suas salas
      const updatedUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      const userRooms = await this.getUserRooms(userId);
      const userWithRooms = {
        ...updatedUser!,
        rooms: userRooms.map(r => ({ room: { id: r.id, name: r.name } })),
      };

      this.logger.log(`Usuário ${userId} atualizado com sucesso`);
      return userWithRooms;
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

      // Verificar se o usuário existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Obter salas do usuário
      const userRooms = await this.getUserRooms(userId);
      if (!userRooms || userRooms.length === 0) {
        throw new Error('Usuário não possui salas associadas. Defina pelo menos uma sala para o usuário antes de associar medidores.');
      }

      // Verificar se o dispositivo já está associado a outro usuário
      if (device.userId && device.userId !== userId) {
        throw new Error('Dispositivo já está associado a outro usuário');
      }

      // Associar o dispositivo ao usuário e atualizar location com a primeira sala do usuário
      const firstRoom = userRooms[0]?.name || null;
      await this.prisma.device.update({
        where: { meterId },
        data: { 
          userId,
          location: firstRoom,
        },
      });

      this.logger.log(`Dispositivo ${meterId} associado ao usuário ${userId} (salas: ${userRooms.map(r => r.name).join(', ')}) com sucesso`);
      return { success: true, message: 'Dispositivo associado com sucesso' };
    } catch (error) {
      this.logger.error(`Erro ao associar dispositivo ${meterId} ao usuário ${userId}:`, error);
      throw error;
    }
  }

  async addRoomToUser(userId: number, roomName: string) {
    try {
      // Verificar se o usuário existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (user.role !== 'USER') {
        throw new Error('Apenas usuários regulares podem ter salas associadas');
      }

      const normalizedRoomName = roomName.trim();
      if (!normalizedRoomName) {
        throw new Error('Nome da sala não pode ser vazio');
      }

      // Buscar ou criar a sala (case-insensitive)
      const room = await this.findOrCreateRoom(normalizedRoomName);

      // Verificar se a relação já existe
      const existingRelation = await this.findUserRoom(userId, room.id);

      if (existingRelation) {
        throw new Error(`Usuário já possui a sala "${normalizedRoomName}" associada`);
      }

      // Criar relação
      await this.createUserRoom(userId, room.id);

      this.logger.log(`Sala "${normalizedRoomName}" adicionada ao usuário ${userId} com sucesso`);
      return { success: true, message: `Sala "${normalizedRoomName}" adicionada com sucesso` };
    } catch (error) {
      this.logger.error(`Erro ao adicionar sala ao usuário ${userId}:`, error);
      throw error;
    }
  }

  async removeRoomFromUser(userId: number, roomName: string) {
    try {
      // Verificar se o usuário existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const normalizedRoomName = roomName.trim();
      
      // Encontrar a sala (case-insensitive)
      const room = await this.findRoomByName(normalizedRoomName);

      if (!room) {
        throw new Error(`Sala "${normalizedRoomName}" não encontrada`);
      }

      // Verificar se a relação existe
      const userRoom = await this.findUserRoom(userId, room.id);

      if (!userRoom) {
        throw new Error(`Usuário não possui a sala "${normalizedRoomName}" associada`);
      }

      // Remover relação
      await this.deleteUserRoom(userId, room.id);

      // Atualizar location dos dispositivos se necessário
      const remainingRooms = await this.getUserRooms(userId);
      const newLocation = remainingRooms.length > 0 ? remainingRooms[0].name : null;
      
      await this.prisma.device.updateMany({
        where: { userId },
        data: { location: newLocation },
      });

      this.logger.log(`Sala "${normalizedRoomName}" removida do usuário ${userId} com sucesso`);
      return { success: true, message: `Sala "${normalizedRoomName}" removida com sucesso` };
    } catch (error) {
      this.logger.error(`Erro ao remover sala do usuário ${userId}:`, error);
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
