import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Swagger decorators (opcional)
function getApiProperty() {
  try {
    return require('@nestjs/swagger').ApiProperty;
  } catch {
    return () => () => {};
  }
}

const ApiProperty = getApiProperty();

export class PaginationDto {
  @ApiProperty({ description: 'Número da página', example: 1, required: false, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 10, required: false, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaginatedResponse<T> {
  @ApiProperty({ description: 'Dados da página atual' })
  data: T[];

  @ApiProperty({ description: 'Metadados da paginação' })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

