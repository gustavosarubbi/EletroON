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
}
