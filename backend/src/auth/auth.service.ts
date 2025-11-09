import { Injectable, UnauthorizedException, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { logDebug, logError, logInfo, logWarn } from '../common/utils/logger.util';

interface User {
  id: number;
  email: string;
  password: string;
  role: string;
  devices?: Array<{ meterId: number }>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    try {
      // Normalizar email para lowercase
      const normalizedEmail = email.toLowerCase().trim();
      logInfo(this.logger, 'Tentativa de login', { email: normalizedEmail });
      
      // Validar entrada
      if (!email || !pass) {
        logWarn(this.logger, 'Email ou senha não fornecidos');
        throw new UnauthorizedException('Email e senha são obrigatórios');
      }
      
      const user = (await this.usersService.findOneByEmail(normalizedEmail)) as User;

      if (!user) {
        logWarn(this.logger, 'Usuário não encontrado', { email: normalizedEmail });
        throw new UnauthorizedException('Credenciais inválidas. Verifique seu email e senha.');
      }

      logInfo(this.logger, 'Usuário encontrado', {
        email: user.email,
        userId: user.id,
        role: user.role,
      });
      
      // Normalizar senha recebida (remover espaços extras)
      const normalizedPass = pass.trim();
      
      // Debug: verificar senha recebida e hash no banco
      logDebug(this.logger, 'Comparando senha', {
        passwordLength: normalizedPass.length,
        hashLength: user.password.length,
      });
      
      // Verificar se o hash está no formato correto
      if (!user.password.startsWith('$2')) {
        logError(this.logger, 'Hash de senha em formato inválido');
        throw new UnauthorizedException('Erro no formato da senha. Entre em contato com o administrador.');
      }

      const isPasswordMatching = await this.comparePassword(normalizedPass, user.password);

      if (!isPasswordMatching) {
        logWarn(this.logger, 'Senha incorreta', {
          email: normalizedEmail,
          length: normalizedPass.length,
        });
        
        // Debug adicional: tentar comparar diretamente para ver se há problema com o hash
        try {
          const directCompare = await bcrypt.compare(normalizedPass, user.password);
          logDebug(this.logger, 'Comparação direta com bcrypt', { directCompare });
        } catch (error) {
          logError(this.logger, 'Erro na comparação direta com bcrypt', error);
        }
        
        throw new UnauthorizedException('Credenciais inválidas. Verifique seu email e senha.');
      }

      logInfo(this.logger, 'Senha válida', { email: normalizedEmail });

      const meterIds = Array.isArray(user.devices)
        ? user.devices.map(device => device.meterId)
        : [];
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        meterIds,
      };
      
      const access_token = this.jwtService.sign(payload);
      logInfo(this.logger, 'Token gerado com sucesso', { email: normalizedEmail });
      
      return {
        access_token,
      };
    } catch (error) {
      logError(this.logger, 'Erro no método login', error);
      
      // Se já é uma UnauthorizedException, re-lançar
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Para outros erros, lançar como erro interno
      throw new InternalServerErrorException('Erro ao processar login.');
    }
  }

  private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}