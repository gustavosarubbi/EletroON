import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { logDebug, logError, logInfo, logWarn } from '../common/utils/logger.util';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    logInfo(this.logger, 'Inicializando UsersService');
    await this.createDefaultUsers();
  }

  private async createDefaultUsers() {
    try {
      // Normalizar emails para lowercase
      const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@eletroon.com').toLowerCase().trim();
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      const userEmail = (process.env.DEFAULT_USER_EMAIL || 'usuario@eletroon.com').toLowerCase().trim();
      const userPassword = process.env.DEFAULT_USER_PASSWORD || 'User@123';

      // Verificar se admin já existe usando query raw para evitar problemas de tipo
      let existingAdmin: { id: number; email: string; password: string; role: string } | null = null;
      try {
        const adminResult = await this.prisma.$queryRaw<Array<{ id: number; email: string; password: string; role: string }>>`
          SELECT id, email, password, role FROM "User" WHERE email = ${adminEmail}
        `;
        if (adminResult && Array.isArray(adminResult) && adminResult.length > 0) {
          existingAdmin = adminResult[0];
          // Garantir que role seja string
          if (existingAdmin && existingAdmin.role && typeof existingAdmin.role !== 'string') {
            existingAdmin.role = String(existingAdmin.role);
          }
        }
      } catch (error) {
        logWarn(this.logger, 'Erro ao buscar administrador padrão', {
          message: (error as Error).message,
        });
      }

      if (!existingAdmin) {
        const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
        // Usar query raw para evitar problemas de tipo
        await this.prisma.$executeRaw`
          INSERT INTO "User" (email, password, role, "createdAt", "updatedAt")
          VALUES (${adminEmail}, ${hashedAdminPassword}, 'ADMIN', NOW(), NOW())
        `;
        logInfo(this.logger, 'Usuário admin criado', { email: adminEmail });
      } else {
        // Verificar se a senha atual funciona
        const isPasswordValid = await bcrypt.compare(adminPassword, existingAdmin.password);
        if (!isPasswordValid) {
          // Só atualiza se a senha não estiver correta
          logWarn(this.logger, 'Senha do admin divergente, atualizando', {
            email: adminEmail,
          });
          const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
          // Usar query raw para evitar problemas de tipo
          await this.prisma.$executeRaw`
            UPDATE "User" 
            SET password = ${hashedAdminPassword}, role = 'ADMIN', "updatedAt" = NOW()
            WHERE email = ${adminEmail}
          `;
          logInfo(this.logger, 'Senha do admin atualizada', { email: adminEmail });
        } else {
          logDebug(this.logger, 'Senha do admin já está atualizada', { email: adminEmail });
        }
      }

      // Verificar se usuário já existe usando query raw
      let existingUser: { id: number; email: string; password: string; role: string } | null = null;
      try {
        const userResult = await this.prisma.$queryRaw<Array<{ id: number; email: string; password: string; role: string }>>`
          SELECT id, email, password, role FROM "User" WHERE email = ${userEmail}
        `;
        if (userResult && Array.isArray(userResult) && userResult.length > 0) {
          existingUser = userResult[0];
          // Garantir que role seja string
          if (existingUser && existingUser.role && typeof existingUser.role !== 'string') {
            existingUser.role = String(existingUser.role);
          }
        }
      } catch (error) {
        logWarn(this.logger, 'Erro ao buscar usuário padrão', {
          message: (error as Error).message,
        });
      }

      if (!existingUser) {
        const hashedUserPassword = await bcrypt.hash(userPassword, 10);
        // Usar query raw para evitar problemas de tipo
        await this.prisma.$executeRaw`
          INSERT INTO "User" (email, password, role, "createdAt", "updatedAt")
          VALUES (${userEmail}, ${hashedUserPassword}, 'USER', NOW(), NOW())
        `;
        logInfo(this.logger, 'Usuário padrão criado', { email: userEmail });
      } else {
        // Verificar se a senha atual funciona
        const isPasswordValid = await bcrypt.compare(userPassword, existingUser.password);
        if (!isPasswordValid) {
          // Só atualiza se a senha não estiver correta
          logWarn(this.logger, 'Senha do usuário divergente, atualizando', {
            email: userEmail,
          });
          const hashedUserPassword = await bcrypt.hash(userPassword, 10);
          // Usar query raw para evitar problemas de tipo
          await this.prisma.$executeRaw`
            UPDATE "User" 
            SET password = ${hashedUserPassword}, role = 'USER', "updatedAt" = NOW()
            WHERE email = ${userEmail}
          `;
          logInfo(this.logger, 'Senha do usuário atualizada', { email: userEmail });
        } else {
          logDebug(this.logger, 'Senha do usuário já está atualizada', { email: userEmail });
        }
      }

      logDebug(this.logger, 'Credenciais padrão configuradas', {
        adminEmail,
        userEmail,
      });

      // Criar usuário adicional: admin@teste.com
      const testAdminEmail = 'admin@teste.com';
      const testAdminPassword = 'admin123';
      
      // Verificar se admin de teste já existe usando query raw
      let existingTestAdmin: { id: number; email: string; password: string; role: string } | null = null;
      try {
        const testAdminResult = await this.prisma.$queryRaw<Array<{ id: number; email: string; password: string; role: string }>>`
          SELECT id, email, password, role FROM "User" WHERE email = ${testAdminEmail}
        `;
        if (testAdminResult && Array.isArray(testAdminResult) && testAdminResult.length > 0) {
          existingTestAdmin = testAdminResult[0];
          // Garantir que role seja string
          if (existingTestAdmin && existingTestAdmin.role && typeof existingTestAdmin.role !== 'string') {
            existingTestAdmin.role = String(existingTestAdmin.role);
          }
        }
      } catch (error) {
        logWarn(this.logger, 'Erro ao buscar admin de teste', {
          message: (error as Error).message,
        });
      }

      if (!existingTestAdmin) {
        const hashedTestAdminPassword = await bcrypt.hash(testAdminPassword, 10);
        // Usar query raw para evitar problemas de tipo
        await this.prisma.$executeRaw`
          INSERT INTO "User" (email, password, role, "createdAt", "updatedAt")
          VALUES (${testAdminEmail}, ${hashedTestAdminPassword}, 'ADMIN', NOW(), NOW())
        `;
        logInfo(this.logger, 'Admin de teste criado', { email: testAdminEmail });
      } else {
        // Verificar se a senha atual funciona
        const isPasswordValid = await bcrypt.compare(testAdminPassword, existingTestAdmin.password);
        if (!isPasswordValid) {
          logWarn(this.logger, 'Senha do admin de teste divergente, atualizando', {
            email: testAdminEmail,
          });
          const hashedTestAdminPassword = await bcrypt.hash(testAdminPassword, 10);
          // Usar query raw para evitar problemas de tipo
          await this.prisma.$executeRaw`
            UPDATE "User" 
            SET password = ${hashedTestAdminPassword}, role = 'ADMIN', "updatedAt" = NOW()
            WHERE email = ${testAdminEmail}
          `;
          logInfo(this.logger, 'Senha do admin de teste atualizada', { email: testAdminEmail });
        } else {
          logDebug(this.logger, 'Senha do admin de teste já está atualizada', { email: testAdminEmail });
        }
      }
    } catch (error) {
      logError(this.logger, 'Erro durante inicialização do UsersService', error);
    }
  }

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