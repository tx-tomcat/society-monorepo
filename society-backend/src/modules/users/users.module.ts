import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { ProfileController } from './controllers/profile.controller';
import { SettingsController } from './controllers/settings.controller';
import { UsersService } from './services/users.service';
import { ProfileService } from './services/profile.service';
import { SettingsService } from './services/settings.service';

@Module({
  controllers: [UsersController, ProfileController, SettingsController],
  providers: [UsersService, ProfileService, SettingsService],
  exports: [UsersService, ProfileService, SettingsService],
})
export class UsersModule {}
