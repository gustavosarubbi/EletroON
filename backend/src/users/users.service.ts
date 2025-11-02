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
      // Normalizar emails para lowercase
      const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@eletroon.com').toLowerCase().trim();
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      const userEmail = (process.env.DEFAULT_USER_EMAIL || 'usuario@eletroon.com').toLowerCase().trim();
      const userPassword = process.env.DEFAULT_USER_PASSWORD || 'User@123';

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
      } else {
        // Verificar se a senha atual funciona
        const isPasswordValid = await bcrypt.compare(adminPassword, existingAdmin.password);
        if (!isPasswordValid) {
          // Só atualiza se a senha não estiver correta
          this.logger.warn(`⚠️ Senha do admin não corresponde, atualizando...`);
          const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
          await this.prisma.user.update({
            where: { email: adminEmail },
            data: {
              password: hashedAdminPassword,
            },
          });
          this.logger.log(`✅ Senha do admin atualizada: ${adminEmail}`);
        } else {
          this.logger.log(`✅ Senha do admin já está correta: ${adminEmail}`);
        }
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
      } else {
        // Verificar se a senha atual funciona
        const isPasswordValid = await bcrypt.compare(userPassword, existingUser.password);
        if (!isPasswordValid) {
          // Só atualiza se a senha não estiver correta
          this.logger.warn(`⚠️ Senha do usuário não corresponde, atualizando...`);
          const hashedUserPassword = await bcrypt.hash(userPassword, 10);
          await this.prisma.user.update({
            where: { email: userEmail },
            data: {
              password: hashedUserPassword,
            },
          });
          this.logger.log(`✅ Senha do usuário atualizada: ${userEmail}`);
        } else {
          this.logger.log(`✅ Senha do usuário já está correta: ${userEmail}`);
        }
      }

      this.logger.log('Configurações detectadas - ADMIN: ' + adminEmail + ', USER: ' + userEmail);

      // Criar usuário adicional: admin@teste.com
      const testAdminEmail = 'admin@teste.com';
      const testAdminPassword = 'admin123';
      
      const existingTestAdmin = await this.prisma.user.findUnique({
        where: { email: testAdminEmail },
      });

      if (!existingTestAdmin) {
        const hashedTestAdminPassword = await bcrypt.hash(testAdminPassword, 10);
        await this.prisma.user.create({
          data: {
            email: testAdminEmail,
            password: hashedTestAdminPassword,
            role: 'ADMIN',
          },
        });
        this.logger.log(`✅ Usuário admin de teste criado: ${testAdminEmail}`);
      } else {
        // Verificar se a senha atual funciona
        const isPasswordValid = await bcrypt.compare(testAdminPassword, existingTestAdmin.password);
        if (!isPasswordValid) {
          this.logger.warn(`⚠️ Senha do admin de teste não corresponde, atualizando...`);
          const hashedTestAdminPassword = await bcrypt.hash(testAdminPassword, 10);
          await this.prisma.user.update({
            where: { email: testAdminEmail },
            data: {
              password: hashedTestAdminPassword,
            },
          });
          this.logger.log(`✅ Senha do admin de teste atualizada: ${testAdminEmail}`);
        } else {
          this.logger.log(`✅ Senha do admin de teste já está correta: ${testAdminEmail}`);
        }
      }
    } catch (error) {
      this.logger.error('Erro durante inicialização do UsersService:', error);
    }
  }

  async findOneByEmail(email: string) {
    // Normalizar email para lowercase para busca case-insensitive
    const normalizedEmail = email.toLowerCase().trim();
    
    // Tentar primeiro busca exata (mais rápida)
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { devices: { select: { meterId: true } } },
    });
    
    // Se não encontrou, buscar com case-insensitive usando findMany
    if (!user) {
      const users = await this.prisma.user.findMany({
        include: { devices: { select: { meterId: true } } },
      });
      user = users.find(u => u.email.toLowerCase().trim() === normalizedEmail) || null;
    }
    
    return user;
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