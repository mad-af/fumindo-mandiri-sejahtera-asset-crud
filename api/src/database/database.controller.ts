import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from './database.service.js';

/** Query parameter untuk membaca baris tabel. */
export class QueryTableRowsDto {
  @ApiProperty({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 25, minimum: 1, maximum: 200, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 25;
}

/** Body untuk query runner. */
export class RunQueryDto {
  @ApiProperty({
    example: "SELECT * FROM asset WHERE category = 'Consumable';",
    description: 'Hanya query SELECT yang diizinkan (read-only).',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  sql: string;
}

@ApiTags('database')
@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('tables')
  @ApiOperation({ summary: 'Daftar tabel beserta jumlah baris' })
  @ApiOkResponse({ description: 'Tabel yang ada pada schema public' })
  listTables() {
    return this.databaseService.listTables();
  }

  @Get('tables/:table/schema')
  @ApiOperation({ summary: 'Struktur tabel: kolom, constraint, index, enum' })
  @ApiOkResponse({ description: 'Definisi skema tabel' })
  getSchema(@Param('table') table: string) {
    return this.databaseService.getSchema(table);
  }

  @Get('tables/:table/rows')
  @ApiOperation({ summary: 'Baca baris mentah dari tabel (read-only)' })
  @ApiOkResponse({ description: 'Data baris beserta metadata pagination' })
  getRows(@Param('table') table: string, @Query() query: QueryTableRowsDto) {
    return this.databaseService.getRows(table, query.page, query.limit);
  }

  @Post('query')
  @ApiOperation({
    summary: 'Jalankan query SELECT (read-only, dibatasi 500 baris)',
  })
  @ApiOkResponse({ description: 'Hasil query' })
  runQuery(@Body() dto: RunQueryDto) {
    return this.databaseService.runQuery(dto.sql);
  }
}
