import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { logError } from '../common/utils/logger.util';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string) {
    // Normalizar email para lowercase para busca case-insensitive
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      // Usar query raw para evitar problemas de tipo com role
      const users = await this.prisma.$queryRaw`
        SELECT u.id, u.email, u.password, u.role, u."createdAt", u."updatedAt",
               json_agg(json_build_object('meterId', d."meterId")) FILTER (WHERE d."meterId" IS NOT NULL) as devices
        FROM "User" u
        LEFT JOIN "Device" d ON d."userId" = u.id
        WHERE LOWER(u.email) = ${normalizedEmail}
        GROUP BY u.id, u.email, u.password, u.role, u."createdAt", u."updatedAt"
        LIMIT 1
      `;
      
      if (!users || !Array.isArray(users) || users.length === 0) {
        return null;
      }
      
      const user = users[0];
      
      // Garantir que o role seja uma string válida
      if (user.role && typeof user.role !== 'string') {
        user.role = String(user.role);
      }
      
      // Processar devices se existirem
      if (user.devices && Array.isArray(user.devices)) {
        user.devices = user.devices.map(d => ({ meterId: d.meterId }));
      } else {
        user.devices = [];
      }
      
      return user;
    } catch (error) {
      logError(this.logger, 'Erro ao buscar usuário por email', error, {
        email: normalizedEmail,
      });
      return null;
    }
  }

  async findOneById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { devices: true },
    });
  }

  async create(email: string, password: string, role: string = 'USER') {
    // Normalizar email para lowercase
    const normalizedEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role,
      },
    });
  }
}