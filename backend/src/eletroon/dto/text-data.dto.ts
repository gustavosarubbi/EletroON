import { IsOptional, IsString, IsNumber, Min, IsDateString } from 'class-validator';

// Swagger decorators (opcional)
function getApiProperty() {
  try {
    return require('@nestjs/swagger').ApiProperty;
  } catch {
    return () => () => {};
  }
}

const ApiProperty = getApiProperty();

export class TextDataDto {
  @ApiProperty({ description: 'Dados em formato texto (linhas separadas por quebra de linha)', required: false })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiProperty({ description: 'Dados em formato texto (alternativo)', required: false })
  @IsOptional()
  @IsString()
  textData?: string;

  @ApiProperty({ description: 'ID do medidor', example: 438692, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  meterId?: number;

  @ApiProperty({ description: 'Data base para as leituras (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  baseDate?: string;
}

