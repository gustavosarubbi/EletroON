import { Controller, Get, Delete, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
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

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Param('id') id: string, @Request() req: { user: AuthenticatedUser }) {
    return this.adminService.deleteUser(parseInt(id));
  }

  @Post('devices/:meterId/associate')
  @UseGuards(JwtAuthGuard)
  async associateDeviceToUser(
    @Param('meterId') meterId: string,
    @Body() body: { userId: number },
    @Request() req: { user: AuthenticatedUser }
  ) {
    return this.adminService.associateDeviceToUser(parseInt(meterId), body.userId);
  }

  @Patch('devices/:meterId/disassociate')
  @UseGuards(JwtAuthGuard)
  async disassociateDeviceFromUser(
    @Param('meterId') meterId: string,
    @Request() req: { user: AuthenticatedUser }
  ) {
    return this.adminService.disassociateDeviceFromUser(parseInt(meterId));
  }

  @Post('users')
  @UseGuards(JwtAuthGuard)
  async createUser(
    @Body() body: { email: string; password: string; role?: string; rooms?: string[] },
    @Request() req: { user: AuthenticatedUser }
  ) {
    return this.adminService.createUser(
      body.email,
      body.password,
      body.role || 'USER',
      body.rooms
    );
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('id') id: string,
    @Body() body: { email?: string; password?: string; rooms?: string[] },
    @Request() req: { user: AuthenticatedUser }
  ) {
    return this.adminService.updateUser(parseInt(id), body.email, body.password, body.rooms);
  }

  @Post('users/:id/rooms')
  @UseGuards(JwtAuthGuard)
  async addRoomToUser(
    @Param('id') id: string,
    @Body() body: { roomName: string },
    @Request() req: { user: AuthenticatedUser }
  ) {
    return this.adminService.addRoomToUser(parseInt(id), body.roomName);
  }

  @Delete('users/:id/rooms')
  @UseGuards(JwtAuthGuard)
  async removeRoomFromUser(
    @Param('id') id: string,
    @Body() body: { roomName: string },
    @Request() req: { user: AuthenticatedUser }
  ) {
    return this.adminService.removeRoomFromUser(parseInt(id), body.roomName);
  }

  @Get('rooms')
  @UseGuards(JwtAuthGuard)
  async getAllRooms(@Request() req: { user: AuthenticatedUser }) {
    return this.adminService.listAllRooms();
  }
}
