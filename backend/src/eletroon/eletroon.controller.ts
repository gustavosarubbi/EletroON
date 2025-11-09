import { Controller, Post, Get, Body, Param, ParseIntPipe, Query, UseGuards, Request, Res, Req, Headers, Logger, BadRequestException, RawBody } from '@nestjs/common';
import { EletroonService } from './eletroon.service';
import type { AuthenticatedUser, IncomingData } from '../types/common.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Response, Request as ExpressRequest } from 'express';
import { MeterDataDto } from './dto/meter-data.dto';
import { TextDataDto } from './dto/text-data.dto';
import { MeterQueryDto } from './dto/meter-query.dto';
import { MeterHeadersDto } from './dto/meter-headers.dto';
import { PaginationDto } from './dto/pagination.dto';
import { MeterRequestResolverService } from './services/meter-request-resolver.service';
import { logDebug } from '../common/utils/logger.util';

// Swagger decorators (opcional - só funciona se @nestjs/swagger estiver instalado)
function getSwaggerDecorators() {
  try {
    return require('@nestjs/swagger');
  } catch {
    // Retornar decorators vazios se Swagger não estiver disponível
    const noop = () => () => {};
    return {
      ApiTags: noop,
      ApiOperation: noop,
      ApiResponse: noop,
      ApiBearerAuth: noop,
      ApiBody: noop,
      ApiQuery: noop,
      ApiParam: noop,
    };
  }
}

const { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery, ApiParam } = getSwaggerDecorators();

@ApiTags('Meters')
@Controller('eletroon')
export class EletroonController {
  private readonly logger = new Logger(EletroonController.name);

  constructor(
    private readonly eletroonService: EletroonService,
    private readonly meterRequestResolver: MeterRequestResolverService,
  ) {}

  /**
   * Endpoint unificado para receber dados do medidor
   * Aceita dados em formato JSON ou texto
   * ID do medidor é OBRIGATÓRIO (body, query ou header)
   */
  @Post('medidor')
  @ApiOperation({ summary: 'Recebe dados do medidor (JSON ou texto)' })
  @ApiResponse({ status: 201, description: 'Dados processados com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou ID do medidor faltando' })
  @ApiBody({ 
    description: 'Dados do medidor em formato JSON ou texto',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/MeterDataDto' },
        { $ref: '#/components/schemas/TextDataDto' },
        { type: 'string' }
      ]
    }
  })
  async receberDadosDoMedidor(
    @Req() req: ExpressRequest,
    @Body() body: MeterDataDto | TextDataDto | string,
    @RawBody() rawBody: Buffer | undefined,
    @Query() query: MeterQueryDto,
    @Headers() headers: MeterHeadersDto,
  ) {
    const normalized = this.meterRequestResolver.resolve({
      request: req,
      body,
      rawBody,
      query: query as Record<string, unknown>,
      headers: headers as Record<string, unknown>,
    });

    const { clientIp, meterId, payload, contentType, baseDate } = normalized;
    logDebug(this.logger, 'Request recebido do medidor', {
      meterId,
      clientIp,
      contentType: contentType || 'desconhecido',
    });

    if (this.isTextPayload(payload, contentType)) {
      const { textData, referenceDate } = this.extractTextPayload(payload, baseDate, query);
      const lineCount = textData.split('\n').filter((line) => line.trim()).length;
      logDebug(this.logger, 'Processando payload texto', {
        meterId,
        lineCount,
      });

      return this.eletroonService.processarDadosTexto(
        textData,
        clientIp,
        meterId,
        referenceDate,
      );
    }

    if (typeof payload === 'string') {
      throw new BadRequestException(
        'Dados JSON esperados, mas uma string foi recebida. Use Content-Type text/plain para payloads texto.',
      );
    }

    const meterData = payload as MeterDataDto;
    const { id, meterId: meterIdFromBody, ...dataWithoutId } = meterData;
    const incomingData: IncomingData = { ...dataWithoutId };

    logDebug(this.logger, 'Processando payload JSON', {
      meterId,
      keys: Object.keys(incomingData).length,
    });
    return this.eletroonService.processarDadosRecebidos(incomingData, clientIp, meterId);
  }

  private isTextPayload(
    payload: MeterDataDto | TextDataDto | string | Record<string, unknown>,
    contentType: string,
  ): boolean {
    if (typeof payload === 'string') {
      return true;
    }

    if (contentType && contentType.includes('text/plain')) {
      return true;
    }

    if (payload && typeof payload === 'object') {
      const textBody = payload as TextDataDto;
      return typeof textBody.data === 'string' || typeof textBody.textData === 'string';
    }

    return false;
  }

  private extractTextPayload(
    payload: MeterDataDto | TextDataDto | string | Record<string, unknown>,
    baseDate: Date | undefined,
    query: MeterQueryDto,
  ) {
    if (typeof payload === 'string') {
      return {
        textData: payload,
        referenceDate: baseDate,
      };
    }

    if (payload && typeof payload === 'object') {
      const textBody = payload as TextDataDto;
      const rawText = textBody.data ?? textBody.textData;

      if (typeof rawText === 'string') {
        const referenceDate = this.resolveDate(textBody.baseDate, baseDate, query?.baseDate);
        return {
          textData: rawText,
          referenceDate,
        };
      }
    }

    throw new BadRequestException(
      'Dados de texto inválidos. Forneça o conteúdo como string ou use os campos "data" / "textData".',
    );
  }

  private resolveDate(
    ...candidates: Array<string | Date | undefined>
  ): Date | undefined {
    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      const value = candidate instanceof Date ? candidate : new Date(candidate);
      if (!Number.isNaN(value.valueOf())) {
        return value;
      }
    }

    return undefined;
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lista todos os dispositivos (com paginação)' })
  @ApiResponse({ status: 200, description: 'Lista de dispositivos retornada com sucesso' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
  async listarDevices(
    @Request() req: { user: AuthenticatedUser },
    @Query() pagination: PaginationDto,
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    return this.eletroonService.listarDevices(page, limit);
  }

  @Get('my-devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lista dispositivos do usuário autenticado (com paginação)' })
  @ApiResponse({ status: 200, description: 'Lista de dispositivos do usuário retornada com sucesso' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
  async listarMeusDevices(
    @Request() req: { user: AuthenticatedUser },
    @Query() pagination: PaginationDto,
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    return this.eletroonService.listarDevicesDoUsuario(req.user.id, page, limit);
  }

  @Get(':meterId/latest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtém a última leitura de um medidor' })
  @ApiParam({ name: 'meterId', type: Number, description: 'ID do medidor' })
  @ApiResponse({ status: 200, description: 'Última leitura retornada com sucesso' })
  @ApiResponse({ status: 404, description: 'Medidor não encontrado' })
  async getLatestReading(
    @Param('meterId', ParseIntPipe) meterId: number,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.eletroonService.getLatestReading(meterId);
  }

  @Get(':meterId/readings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtém leituras de um medidor por período (com paginação)' })
  @ApiParam({ name: 'meterId', type: Number, description: 'ID do medidor' })
  @ApiResponse({ status: 200, description: 'Leituras retornadas com sucesso' })
  @ApiResponse({ status: 404, description: 'Medidor não encontrado' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Data inicial (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Data final (ISO string)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
  async getDeviceReadingsByPeriod(
    @Param('meterId', ParseIntPipe) meterId: number,
    @Request() req: { user: AuthenticatedUser },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 1000;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('page deve ser um número maior que 0');
    }
    if (isNaN(limitNum) || limitNum < 1) {
      throw new BadRequestException('limit deve ser um número maior que 0');
    }
    
    return this.eletroonService.getDeviceReadingsByPeriod(meterId, start, end, pageNum, limitNum);
  }

  @Get('devices/readings/multiple')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtém leituras de múltiplos medidores' })
  @ApiResponse({ status: 200, description: 'Leituras retornadas com sucesso' })
  @ApiQuery({ name: 'meterIds', type: String, description: 'IDs dos medidores separados por vírgula' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Data inicial (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Data final (ISO string)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de registros' })
  async getMultipleDevicesReadings(
    @Request() req: { user: AuthenticatedUser },
    @Query('meterIds') meterIds: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const meterIdsArray = meterIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    const limitNum = limit ? parseInt(limit, 10) : 2000;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.eletroonService.getMultipleDevicesReadings(meterIdsArray, start, end, limitNum);
  }

  @Get('devices/readings/export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Exporta leituras em formato CSV ou JSON' })
  @ApiResponse({ status: 200, description: 'Arquivo exportado com sucesso' })
  @ApiQuery({ name: 'meterIds', required: false, type: String, description: 'IDs dos medidores separados por vírgula' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Data inicial (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Data final (ISO string)' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'], description: 'Formato de exportação' })
  async exportReadingsReport(
    @Request() req: { user: AuthenticatedUser },
    @Res() res: Response,
    @Query('meterIds') meterIds: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format: string = 'csv',
  ) {
    const meterIdsArray = meterIds ? meterIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : [];
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const report = await this.eletroonService.exportReadingsReport(meterIdsArray, start, end, format);
    
    res.setHeader('Content-Type', report.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    res.send(report.content);
  }
}