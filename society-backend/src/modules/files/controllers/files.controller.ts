import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
// Using Express.Multer.File type from multer
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import {
  FileFilterDto,
  GetUploadUrlDto,
  ProcessImageDto,
  UploadFileDto,
} from '../dto/file.dto';
import { FilesService } from '../services/files.service';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-url')
  async getUploadUrl(@Request() req: any, @Body() dto: GetUploadUrlDto) {
    return this.filesService.getUploadUrl(req.user.id, dto);
  }

  @Post('upload')
  @UseInterceptors()
  async uploadFile(
    @Request() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 }), // 25MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp|pdf)$/ }),
        ],
      }),
    )
    file: { buffer: Buffer; originalname: string; mimetype: string },
    @Body() dto: UploadFileDto,
  ) {
    return this.filesService.uploadFile(req.user.id, file.buffer, {
      ...dto,
      filename: file.originalname,
      contentType: file.mimetype,
    });
  }

  @Post('process')
  async processImage(@Body() dto: ProcessImageDto) {
    return this.filesService.processImage(dto);
  }

  @Get()
  async getMyFiles(@Request() req: any, @Query() filters: FileFilterDto) {
    return this.filesService.getMyFiles(req.user.id, filters);
  }

  @Get(':id')
  async getFile(@Request() req: any, @Param('id') id: string) {
    return this.filesService.getFile(req.user.id, id);
  }

  @Get(':id/signed-url')
  async getSignedUrl(
    @Request() req: any,
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const url = await this.filesService.getSignedUrl(
      req.user.id,
      id,
      expiresIn ? parseInt(expiresIn) : 3600,
    );
    return { url };
  }

  @Delete(':id')
  async deleteFile(@Request() req: any, @Param('id') id: string) {
    await this.filesService.deleteFile(req.user.id, id);
    return { success: true };
  }

  @Get('stats/me')
  async getMyStorageStats(@Request() req: any) {
    return this.filesService.getStorageStats(req.user.id);
  }
}

@Controller('admin/files')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class FilesAdminController {
  constructor(private readonly filesService: FilesService) {}

  @Get('stats')
  async getGlobalStorageStats() {
    return this.filesService.getStorageStats();
  }
}
