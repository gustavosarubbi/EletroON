import { IsOptional, IsNumber, Min, Max } from 'class-validator';

// Swagger decorators (opcional)
function getApiProperty() {
  try {
    return require('@nestjs/swagger').ApiProperty;
  } catch {
    return () => () => {};
  }
}

const ApiProperty = getApiProperty();

export class MeterDataDto {
  @ApiProperty({ description: 'ID do medidor', example: 438692, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  id?: number;

  @ApiProperty({ description: 'ID do medidor (alternativo)', example: 438692, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  meterId?: number;

  @ApiProperty({ description: 'Potência Ativa Fase A [W]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  @Max(1000000)
  pa?: number;

  @ApiProperty({ description: 'Potência Ativa Fase B [W]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  @Max(1000000)
  pb?: number;

  @ApiProperty({ description: 'Potência Ativa Fase C [W]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  @Max(1000000)
  pc?: number;

  @ApiProperty({ description: 'Potência Ativa Total [W]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  @Max(1000000)
  pt?: number;

  @ApiProperty({ description: 'Potência Reativa Fase A [VAR]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  @Max(1000000)
  qa?: number;

  @ApiProperty({ description: 'Potência Reativa Fase B [VAR]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  @Max(1000000)
  qb?: number;

  @ApiProperty({ description: 'Potência Reativa Fase C [VAR]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  @Max(1000000)
  qc?: number;

  @ApiProperty({ description: 'Potência Reativa Total [VAR]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  @Max(1000000)
  qt?: number;

  @ApiProperty({ description: 'Energia Consumida Fase A [kWh]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  epa_c?: number;

  @ApiProperty({ description: 'Energia Consumida Fase B [kWh]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  epb_c?: number;

  @ApiProperty({ description: 'Energia Consumida Fase C [kWh]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  epc_c?: number;

  @ApiProperty({ description: 'Energia Consumida Total [kWh]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  ept_c?: number;

  @ApiProperty({ description: 'Energia Gerada Fase A [kWh]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  epa_g?: number;

  @ApiProperty({ description: 'Energia Gerada Fase B [kWh]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  epb_g?: number;

  @ApiProperty({ description: 'Energia Gerada Fase C [kWh]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  epc_g?: number;

  @ApiProperty({ description: 'Energia Gerada Total [kWh]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1000000)
  ept_g?: number;

  @ApiProperty({ description: 'Corrente RMS Fase A [A]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  iarms?: number;

  @ApiProperty({ description: 'Corrente RMS Fase B [A]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ibrms?: number;

  @ApiProperty({ description: 'Corrente RMS Fase C [A]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  icrms?: number;

  @ApiProperty({ description: 'Tensão RMS Fase A [V]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  uarms?: number;

  @ApiProperty({ description: 'Tensão RMS Fase B [V]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  ubrms?: number;

  @ApiProperty({ description: 'Tensão RMS Fase C [V]', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  ucrms?: number;

  @ApiProperty({ description: 'Fator de Potência Fase A', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  @Max(1)
  pfa?: number;

  @ApiProperty({ description: 'Fator de Potência Fase B', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  @Max(1)
  pfb?: number;

  @ApiProperty({ description: 'Fator de Potência Fase C', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  @Max(1)
  pfc?: number;

  @ApiProperty({ description: 'Fator de Potência Total', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  @Max(1)
  pft?: number;
}

