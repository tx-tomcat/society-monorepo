import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../modules/security/security.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    SecurityModule,
  ],
  providers: [
    AuthService,
    JwtAuthGuard,
  ],
  controllers: [AuthController],
  exports: [JwtAuthGuard, AuthService],
})
export class AuthModule {}
