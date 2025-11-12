import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import * as express from 'express';
import * as net from 'net';

/**
 * Verifica se uma porta está disponível
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    let resolved = false;
    
    // Timeout para evitar que trave indefinidamente
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        server.close();
        resolve(false);
      }
    }, 1000);
    
    server.listen(port, () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      }
    });
    
    server.on('error', (err: any) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        // EADDRINUSE significa que a porta está em uso
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          // Outro erro, considerar como não disponível
          resolve(false);
        }
      }
    });
  });
}

/**
 * Encontra a próxima porta disponível a partir da porta inicial
 */
async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  const logger = new Logger('PortFinder');
  
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    logger.debug(`Verificando porta ${port}...`);
    
    const available = await isPortAvailable(port);
    
    if (available) {
      if (i > 0) {
        logger.warn(`Porta ${startPort} ocupada, usando porta ${port}`);
      }
      return port;
    }
    
    logger.debug(`Porta ${port} ocupada, tentando próxima...`);
  }
  
  throw new Error(`Não foi possível encontrar uma porta disponível após ${maxAttempts} tentativas (tentou portas ${startPort} até ${startPort + maxAttempts - 1})`);
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  logger.log('🚀 Iniciando aplicação...');
  
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  
  logger.log('✅ Módulo da aplicação criado');

  const textMiddleware = express.text({
    type: (req) => {
      const contentType = req.headers['content-type'] || '';
      if (!contentType) {
        return req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH';
      }
      return (
        contentType.includes('text/plain') ||
        contentType.includes('application/octet-stream')
      );
    },
    limit: '10mb',
  });

  app.use('/api/eletroon/medidor', textMiddleware);

  try {
    const helmet = await import('helmet');
    app.use(helmet.default({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));
    logger.log('Helmet configurado com sucesso');
  } catch (error) {
    logger.warn('Helmet não disponível, pulando configuração de segurança');
  }

  // Configurar CORS
  const corsOrigins = process.env.CORS_ORIGINS;
  const origin = corsOrigins === '*' ? true : corsOrigins?.split(',') || ['http://localhost:3001', 'http://localhost:3004'];
  
  // Configurar CORS - Permitir todos os headers customizados
  const allowedHeaders = [
    'Content-Type',
    'Authorization', 
    'X-Requested-With',
    'x-meter-id',
    'x-device-id',
    'meter-id',
    'device-id',
    'X-Meter-Id',
    'X-Device-Id',
    'Meter-Id',
    'Device-Id',
    'X-METER-ID',
    'X-DEVICE-ID',
    'METER-ID',
    'DEVICE-ID',
    // Permitir qualquer header customizado
  ];
  
  app.enableCors({
    origin: origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: allowedHeaders,
    exposedHeaders: allowedHeaders,
    credentials: true,
    // Permitir headers customizados
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Configurar prefixo global
  app.setGlobalPrefix('api');

  // Configurar Exception Filters globais
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Configurar Interceptors globais
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Configurar Swagger (se disponível)
  try {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('EletroON API')
      .setDescription('API para monitoramento de medidores de energia')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Meters', 'Endpoints para receber e consultar dados de medidores')
      .addTag('Auth', 'Endpoints de autenticação')
      .addTag('Users', 'Endpoints de usuários')
      .addTag('Admin', 'Endpoints administrativos')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
    logger.log('Swagger configurado em /api/docs');
  } catch (error) {
    logger.warn('Swagger não disponível, pulando configuração');
  }

  // Configurar validação global - MAS permitir headers customizados
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false, // Mudado para false para não bloquear headers customizados
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    // Não validar headers customizados
    skipMissingProperties: false,
    skipNullProperties: false,
    skipUndefinedProperties: false,
  }));

  const requestedPort = parseInt(process.env.PORT || '3000', 10);
  
  logger.log(`🔍 Verificando porta ${requestedPort}...`);
  
  // Tentar encontrar uma porta disponível
  let port: number;
  try {
    port = await findAvailablePort(requestedPort);
    
    if (port !== requestedPort) {
      logger.warn(`⚠️  Porta ${requestedPort} ocupada, usando porta ${port} automaticamente`);
    } else {
      logger.log(`✅ Porta ${port} disponível`);
    }
    
    logger.log(`🌐 Iniciando servidor na porta ${port}...`);
    
    // Tentar iniciar o servidor, com fallback se a porta estiver ocupada
    try {
      await app.listen(port);
    } catch (listenError: any) {
      // Se a porta estiver ocupada mesmo após verificação, tentar próxima porta
      if (listenError?.code === 'EADDRINUSE') {
        logger.warn(`⚠️  Porta ${port} foi ocupada durante a inicialização, tentando próxima porta...`);
        port = await findAvailablePort(port + 1, 5);
        await app.listen(port);
        logger.warn(`✅ Servidor iniciado na porta ${port} (porta original ${requestedPort} estava ocupada)`);
      } else {
        throw listenError;
      }
    }
    
    logger.log('');
    logger.log('═══════════════════════════════════════════════════════');
    logger.log(`✅ Aplicação rodando na porta ${port}`);
    logger.log(`🔗 API disponível em: http://localhost:${port}/api`);
    logger.log(`📚 Swagger disponível em: http://localhost:${port}/api/docs`);
    logger.log('═══════════════════════════════════════════════════════');
    logger.log('');
  } catch (error) {
    logger.error('❌ Erro ao iniciar a aplicação:', error);
    process.exit(1);
  }
}
bootstrap().catch((error) => {
  console.error('❌ Erro fatal ao inicializar aplicação:', error);
  process.exit(1);
});