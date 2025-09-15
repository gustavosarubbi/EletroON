import { Controller, Post, Get, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { EletroonService } from './eletroon.service';
import type { IncomingData, AuthenticatedUser } from '../types/common.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('eletroon')
export class EletroonController {
  constructor(private eletroonService: EletroonService) {}

  @Post('medidor')
  async receberDadosDoMedidor(@Body() rawData: IncomingData) {
    return this.eletroonService.processarDadosRecebidos(rawData);
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  async listarDevices(@Request() req: { user: AuthenticatedUser }) {
    return this.eletroonService.listarDevices();
  }

  @Get('my-devices')
  @UseGuards(JwtAuthGuard)
  async listarMeusDevices(@Request() req: { user: AuthenticatedUser }) {
    return this.eletroonService.listarDevicesDoUsuario(req.user.sub);
  }

  @Get(':meterId/latest')
  @UseGuards(JwtAuthGuard)
  async getLatestReading(
    @Param('meterId', ParseIntPipe) meterId: number,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.eletroonService.getLatestReading(meterId);
  }

  @Get(':meterId')
  @UseGuards(JwtAuthGuard)
  async getDeviceReadings(
    @Param('meterId', ParseIntPipe) meterId: number,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.eletroonService.getDeviceReadings(meterId);
  }
}