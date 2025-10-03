import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Inicializando UsersService...');
    await this.createDefaultUsers();
  }

  private async createDefaultUsers() {
    try {
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@eletroon.com';
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      const userEmail = process.env.DEFAULT_USER_EMAIL || 'usuario@eletroon.com';
      const userPassword = process.env.DEFAULT_USER_PASSWORD || 'usuario123';

      // Verificar se admin já existe
      const existingAdmin = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (!existingAdmin) {
        const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
        await this.prisma.user.create({
          data: {
            email: adminEmail,
            password: hashedAdminPassword,
            role: 'ADMIN',
          },
        });
        this.logger.log(`Usuário admin criado: ${adminEmail}`);
      }

      // Verificar se usuário já existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!existingUser) {
        const hashedUserPassword = await bcrypt.hash(userPassword, 10);
        await this.prisma.user.create({
          data: {
            email: userEmail,
            password: hashedUserPassword,
            role: 'USER',
          },
        });
        this.logger.log(`Usuário padrão criado: ${userEmail}`);
      }

      this.logger.log('Configurações detectadas - ADMIN: ' + adminEmail + ', USER: ' + userEmail);
    } catch (error) {
      this.logger.error('Erro durante inicialização do UsersService:', error);
    }
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { devices: { select: { meterId: true } } },
    });
  }

  async findOneById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { devices: true },
    });
  }

  async create(email: string, password: string, role: string = 'USER') {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });
  }
}