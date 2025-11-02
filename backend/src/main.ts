import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as net from 'net';

/**
 * Verifica se uma porta está disponível
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Encontra a próxima porta disponível a partir da porta inicial
 */
async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    
    if (available) {
      return port;
    }
    
    console.log(`⚠️  Porta ${port} ocupada, tentando ${port + 1}...`);
  }
  
  throw new Error(`Não foi possível encontrar uma porta disponível após ${maxAttempts} tentativas`);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS
  const corsOrigins = process.env.CORS_ORIGINS;
  const origin = corsOrigins === '*' ? true : corsOrigins?.split(',') || ['http://localhost:3001', 'http://localhost:3004'];
  
  app.enableCors({
    origin: origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Configurar prefixo global
  app.setGlobalPrefix('api');

  // Configurar validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const requestedPort = parseInt(process.env.PORT || '3000', 10);
  
  // Tentar encontrar uma porta disponível
  let port: number;
  try {
    port = await findAvailablePort(requestedPort);
    
    if (port !== requestedPort) {
      console.log(`ℹ️  Porta ${requestedPort} ocupada, usando porta ${port} automaticamente`);
    }
    
    await app.listen(port);
    console.log(`🚀 Aplicação rodando na porta ${port}`);
    console.log(`📡 API disponível em: http://localhost:${port}/api`);
  } catch (error) {
    console.error('❌ Erro ao iniciar a aplicação:', error);
    process.exit(1);
  }
}
bootstrap();