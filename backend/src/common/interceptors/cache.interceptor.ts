import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
  Optional,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  private cacheManager: any;

  constructor(@Optional() @Inject('CACHE_MANAGER') cacheManager?: any) {
    this.cacheManager = cacheManager;
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Se o cache não estiver configurado, passar direto
    if (!this.cacheManager) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Apenas cachear requisições GET
    if (method !== 'GET') {
      return next.handle();
    }

    // Gerar chave do cache baseada na URL
    const cacheKey = `cache:${url}`;

    try {
      // Tentar obter do cache
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit: ${url}`);
        return of(cached);
      }

      // Se não estiver no cache, processar e cachear
      return next.handle().pipe(
        tap(async (data) => {
          // Cachear por 5 minutos (300 segundos)
          await this.cacheManager.set(cacheKey, data, 300);
          this.logger.debug(`Cache miss: ${url} - cached for 5 minutes`);
        }),
      );
    } catch (error) {
      this.logger.warn(`Erro ao usar cache: ${error.message}`);
      // Se houver erro no cache, continuar normalmente
      return next.handle();
    }
  }
}

