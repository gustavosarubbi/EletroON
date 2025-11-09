import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EletroonModule } from './eletroon/eletroon.module';
import { AdminModule } from './admin/admin.module';
import appConfig from './config/app.config';
import meterConfig from './config/meter.config';
import validationConfig from './config/validation.config';
import { RawBodyMiddleware } from './common/middleware/raw-body.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      load: [appConfig, meterConfig, validationConfig],
    }),
    // Rate Limiting (se disponível)
    // ThrottlerModule.forRoot([{
    //   ttl: 60000, // 1 minuto
    //   limit: 100, // 100 requisições por minuto
    // }]),
    // Cache (se disponível)
    // CacheModule.register({
    //   isGlobal: true,
    //   ttl: 300, // 5 minutos
    //   max: 100, // máximo de 100 itens no cache
    // }),
    PrismaModule,
    UsersModule,
    AuthModule,
    EletroonModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, RawBodyMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar middleware de raw body apenas na rota de medidor
    consumer
      .apply(RawBodyMiddleware)
      .forRoutes('api/eletroon/medidor');
  }
}