import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageService } from './services/storage.service';
import { ImageProcessingService } from './services/image-processing.service';
import { FilesService } from './services/files.service';
import { FilesController, FilesAdminController } from './controllers/files.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [FilesController, FilesAdminController],
  providers: [StorageService, ImageProcessingService, FilesService],
  exports: [FilesService, StorageService, ImageProcessingService],
})
export class FilesModule {}
