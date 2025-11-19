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
      // Configurações de pool de conexões para evitar timeouts
      log: ['error', 'warn'],
    });
    
    // Agora podemos usar this.logger
    if (!databaseUrl) {
      this.logger.error('❌ DATABASE_URL não configurada! Verifique o arquivo .env');
    } else {
      this.logger.log('🔗 Configurando conexão com banco de dados...');
    }

    // Tratamento de erros de conexão
    this.$on('error' as never, (e: any) => {
      this.logger.error('❌ Erro no Prisma Client:', e);
    });

    // Tratamento de queries lentas (mais de 5 segundos)
    this.$on('query' as never, (e: any) => {
      if (e.duration > 5000) {
        this.logger.warn(`⚠️ Query lenta detectada: ${e.duration}ms - ${e.query}`);
      }
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('🔄 Conectando ao banco de dados...');
      
      // Adicionar timeout de 10 segundos para conexão
      const connectPromise = this.$connect();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout: Conexão com banco de dados excedeu 10 segundos'));
        }, 10000);
      });
      
      await Promise.race([connectPromise, timeoutPromise]);
      this.logger.log('✅ Conectado ao banco de dados com sucesso');
      
      // Configurar reconexão automática em caso de perda de conexão
      this.setupReconnection();
    } catch (error) {
      this.logger.error('❌ Erro ao conectar ao banco de dados:', error);
      throw error;
    }
  }

  private setupReconnection() {
    // Verificar conexão periodicamente (a cada 5 minutos)
    setInterval(async () => {
      try {
        // Fazer uma query simples para manter a conexão ativa
        await this.$queryRaw`SELECT 1`;
      } catch (error) {
        this.logger.warn('⚠️ Conexão com banco perdida, tentando reconectar...');
        try {
          await this.$disconnect();
          await this.$connect();
          this.logger.log('✅ Reconectado ao banco de dados com sucesso');
        } catch (reconnectError) {
          this.logger.error('❌ Erro ao reconectar ao banco de dados:', reconnectError);
        }
      }
    }, 5 * 60 * 1000); // 5 minutos
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
