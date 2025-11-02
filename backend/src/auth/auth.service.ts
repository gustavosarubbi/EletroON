import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

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
    // Normalizar email para lowercase
    const normalizedEmail = email.toLowerCase().trim();
    this.logger.log(`🔐 Tentativa de login para: ${normalizedEmail}`);
    
    const user = (await this.usersService.findOneByEmail(normalizedEmail)) as User;

    if (!user) {
      this.logger.warn(`❌ Usuário não encontrado: ${normalizedEmail}`);
      this.logger.warn(`💡 Verifique se o email está correto. Email esperado: admin@eletroon.com (com dois 'o')`);
      throw new UnauthorizedException('Credenciais inválidas. Verifique seu email e senha.');
    }

    this.logger.log(`✅ Usuário encontrado: ${user.email} (ID: ${user.id}, Role: ${user.role})`);
    
    // Normalizar senha recebida (remover espaços extras)
    const normalizedPass = pass.trim();
    
    // Debug: verificar senha recebida e hash no banco
    this.logger.debug(`🔍 Comparando senha - Senha recebida length: ${normalizedPass.length}, Hash length: ${user.password.length}`);
    this.logger.debug(`🔍 Hash no banco (primeiros 20 chars): ${user.password.substring(0, 20)}...`);
    
    // Verificar se o hash está no formato correto
    if (!user.password.startsWith('$2')) {
      this.logger.error(`❌ Hash de senha inválido! Não começa com $2`);
      throw new UnauthorizedException('Erro no formato da senha. Entre em contato com o administrador.');
    }

    const isPasswordMatching = await this.comparePassword(normalizedPass, user.password);

    if (!isPasswordMatching) {
      this.logger.warn(`❌ Senha incorreta para: ${normalizedEmail}`);
      this.logger.warn(`💡 Senha padrão admin: admin123`);
      this.logger.warn(`💡 Senha recebida (normalizada): "${normalizedPass}" (length: ${normalizedPass.length})`);
      
      // Debug adicional: tentar comparar diretamente para ver se há problema com o hash
      try {
        const directCompare = await bcrypt.compare(normalizedPass, user.password);
        this.logger.debug(`🔍 Comparação direta com bcrypt: ${directCompare}`);
      } catch (error) {
        this.logger.error(`❌ Erro na comparação direta: ${error}`);
      }
      
      throw new UnauthorizedException('Credenciais inválidas. Verifique seu email e senha.');
    }

    this.logger.log(`✅ Senha válida para: ${normalizedEmail}`);

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
    this.logger.log(`✅ Token gerado com sucesso para: ${email}`);
    
    return {
      access_token,
    };
  }

  private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}