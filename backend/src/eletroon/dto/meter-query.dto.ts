import { IsOptional, IsNumber, Min, Max, IsInt, IsDateString } from 'class-validator';

// Swagger decorators (opcional)
function getApiProperty() {
  try {
    return require('@nestjs/swagger').ApiProperty;
  } catch {
    return () => () => {};
  }
}

const ApiProperty = getApiProperty();

export class MeterQueryDto {
  @ApiProperty({ description: 'ID do medidor', example: 438692, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  meterId?: number;

  @ApiProperty({ description: 'Data base para as leituras (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  baseDate?: string;

  @ApiProperty({ description: 'Data inicial do período (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Data final do período (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Limite de registros', example: 1000, required: false, minimum: 1, maximum: 10000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  limit?: number;
}

