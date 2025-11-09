import { Controller, Post, Body, HttpCode, HttpStatus, Logger, HttpException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { logError, logInfo } from '../common/utils/logger.util';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { email: string; password: string }) {
    logInfo(this.logger, 'Requisição de login recebida', {
      email: loginDto?.email,
    });
    
    try {
      // Validar dados de entrada
      if (!loginDto || !loginDto.email || !loginDto.password) {
        logError(this.logger, 'Dados de login inválidos ou incompletos');
        throw new BadRequestException('Email e senha são obrigatórios');
      }

      const result = await this.authService.login(loginDto.email, loginDto.password);
      logInfo(this.logger, 'Login bem-sucedido', { email: loginDto.email });
      return result;
    } catch (error) {
      logError(this.logger, 'Erro no login', error, {
        email: loginDto?.email,
      });
      
      // Re-lançar erros de autenticação como estão
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Para outros erros, lançar como Internal Server Error 500
      throw new InternalServerErrorException('Erro interno no servidor.');
    }
  }
}
