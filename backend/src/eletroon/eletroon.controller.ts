import { Controller, Post, Get, Body, Param, ParseIntPipe, Query, UseGuards, Request, Res } from '@nestjs/common';
import { EletroonService } from './eletroon.service';
import type { IncomingData, AuthenticatedUser } from '../types/common.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';

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

  @Get(':meterId/readings')
  @UseGuards(JwtAuthGuard)
  async getDeviceReadingsByPeriod(
    @Param('meterId', ParseIntPipe) meterId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Request() req: { user: AuthenticatedUser },
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 1000;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.eletroonService.getDeviceReadingsByPeriod(meterId, start, end, limitNum);
  }

  @Get('devices/readings/multiple')
  @UseGuards(JwtAuthGuard)
  async getMultipleDevicesReadings(
    @Query('meterIds') meterIds: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Request() req: { user: AuthenticatedUser },
  ) {
    const meterIdsArray = meterIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    const limitNum = limit ? parseInt(limit, 10) : 2000;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.eletroonService.getMultipleDevicesReadings(meterIdsArray, start, end, limitNum);
  }

  @Get('devices/readings/export')
  @UseGuards(JwtAuthGuard)
  async exportReadingsReport(
    @Query('meterIds') meterIds: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format: string = 'csv',
    @Request() req: { user: AuthenticatedUser },
    @Res() res: Response,
  ) {
    const meterIdsArray = meterIds ? meterIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : [];
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const report = await this.eletroonService.exportReadingsReport(meterIdsArray, start, end, format);
    
    res.setHeader('Content-Type', report.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    res.send(report.content);
  }