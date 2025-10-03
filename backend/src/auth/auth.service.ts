import { Injectable, UnauthorizedException } from '@nestjs/common';
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
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = (await this.usersService.findOneByEmail(email)) as User;

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isPasswordMatching = await this.comparePassword(pass, user.password);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const meterIds = Array.isArray(user.devices)
      ? user.devices.map(device => device.meterId)
      : [];
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      meterIds,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}