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
}
