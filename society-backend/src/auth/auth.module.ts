import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../modules/security/security.module';
import { CacheModule } from '../modules/cache/cache.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    SecurityModule,
    CacheModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtAuthGuard,
  ],
  controllers: [AuthController],
  exports: [JwtAuthGuard, AuthService, JwtModule],
})
export class AuthModule {}
