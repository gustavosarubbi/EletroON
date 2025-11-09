import { IsOptional, IsString } from 'class-validator';

export class MeterHeadersDto {
  @IsOptional()
  @IsString()
  'x-meter-id'?: string;

  @IsOptional()
  @IsString()
  'x-device-id'?: string;

  @IsOptional()
  @IsString()
  'meter-id'?: string;

  @IsOptional()
  @IsString()
  'device-id'?: string;

  @IsOptional()
  @IsString()
  'content-type'?: string;

  @IsOptional()
  @IsString()
  'Content-Type'?: string;
}

