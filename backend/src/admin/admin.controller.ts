import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import type { AuthenticatedUser } from '../types/common.types';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Request() req: { user: AuthenticatedUser }) {
    return this.adminService.getStats();
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  async getUsers(@Request() req: { user: AuthenticatedUser }) {
    return this.adminService.getUsers();
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  async getDevices(@Request() req: { user: AuthenticatedUser }) {
    return this.adminService.getDevices();
  }

  @Get('consumption/last24h')
  @UseGuards(JwtAuthGuard)
  async getConsumptionLast24Hours(@Request() req: { user: AuthenticatedUser }) {
    return this.adminService.getConsumptionLast24Hours();
  }

  @Get('readings/weekly')
  @UseGuards(JwtAuthGuard)
  async getWeeklyReadings(@Request() req: { user: AuthenticatedUser }) {
    return this.adminService.getWeeklyReadings();
  }

  @Get('activity-logs')
  @UseGuards(JwtAuthGuard)
  async getActivityLogs(@Request() req: { user: AuthenticatedUser }) {
    return this.adminService.getRecentActivityLogs(5);
  }
}
