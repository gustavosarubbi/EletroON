import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { email: string; password: string }) {
    this.logger.log(`📥 Requisição de login recebida para: ${loginDto.email}`);
    try {
      const result = await this.authService.login(loginDto.email, loginDto.password);
      this.logger.log(`✅ Login bem-sucedido para: ${loginDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Erro no login para: ${loginDto.email}`, error);
      throw error;
    }
  }
}
