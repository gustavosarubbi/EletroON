import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    
    // Chamar super() primeiro antes de usar this
    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
    
    // Agora podemos usar this.logger
    if (!databaseUrl) {
      this.logger.error('❌ DATABASE_URL não configurada! Verifique o arquivo .env');
    } else {
      this.logger.log('🔗 Configurando conexão com banco de dados...');
    }
  }

  async onModuleInit() {
    try {
      this.logger.log('🔄 Conectando ao banco de dados...');
      await this.$connect();
      this.logger.log('✅ Conectado ao banco de dados com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao conectar ao banco de dados:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('🔄 Desconectando do banco de dados...');
      await this.$disconnect();
      this.logger.log('✅ Desconectado do banco de dados');
    } catch (error) {
      this.logger.error('❌ Erro ao desconectar do banco de dados:', error);
    }
  }
}
