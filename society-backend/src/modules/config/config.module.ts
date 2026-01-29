import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { ConfigController } from './controllers/config.controller';
import { PlatformConfigService } from './services/config.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConfigController],
  providers: [PlatformConfigService],
  exports: [PlatformConfigService],
})
export class PlatformConfigModule {}
