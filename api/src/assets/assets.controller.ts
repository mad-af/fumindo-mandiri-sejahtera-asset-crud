import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AssetsService } from './assets.service.js';
import { CreateAssetDto, QueryAssetsDto, UpdateAssetDto } from './dto/asset.dto.js';
import { PaginatedAssets } from './dto/asset-response.dto.js';

@ApiTags('assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'List asset (filter kategori, pencarian, pagination)' })
  @ApiQuery({ name: 'search', required: false, description: 'Cari nama asset' })
  @ApiQuery({ name: 'category', required: false, enum: ['Consumable', 'Non-Consumable'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Daftar asset beserta metadata pagination' })
  findAll(@Query() query: QueryAssetsDto): Promise<PaginatedAssets> {
    return this.assetsService.findAll(query);
  }

  // Route literal harus didaftarkan SEBELUM route parametrik (`:id`),
  // supaya "stats" tidak tertangkap sebagai id.
  @Get('stats')
  @ApiOperation({ summary: 'Ringkasan jumlah & stok asset' })
  @ApiOkResponse({ description: 'Agregat untuk kartu dashboard' })
  getStats() {
    return this.assetsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu asset' })
  @ApiOkResponse({ description: 'Data asset' })
  @ApiNotFoundResponse({ description: 'Asset tidak ditemukan' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assetsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tambah asset baru' })
  @ApiCreatedResponse({ description: 'Asset berhasil dibuat' })
  create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetsService.create(createAssetDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui asset' })
  @ApiOkResponse({ description: 'Asset berhasil diperbarui' })
  @ApiNotFoundResponse({ description: 'Asset tidak ditemukan' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssetDto: UpdateAssetDto,
  ) {
    return this.assetsService.update(id, updateAssetDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus asset' })
  @ApiNoContentResponse({ description: 'Asset berhasil dihapus' })
  @ApiNotFoundResponse({ description: 'Asset tidak ditemukan' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.assetsService.remove(id);
  }
}
