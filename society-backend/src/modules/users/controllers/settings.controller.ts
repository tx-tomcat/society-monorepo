import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { UpdateSettingsDto, PrivacySettingsDto } from '../dto/settings.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../common/decorators/current-user.decorator';

@Controller('users/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@CurrentUser() user: CurrentUserData) {
    return this.settingsService.getSettings(user.id);
  }

  @Put()
  async updateSettings(
    @CurrentUser() user: CurrentUserData,
    @Body() updateData: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(user.id, updateData);
  }

  @Get('notifications')
  async getNotificationPreferences(@CurrentUser() user: CurrentUserData) {
    return this.settingsService.getNotificationPreferences(user.id);
  }

  @Put('notifications')
  async updateNotificationPreferences(
    @CurrentUser() user: CurrentUserData,
    @Body()
    preferences: {
      pushNotifications?: boolean;
      emailNotifications?: boolean;
      smsNotifications?: boolean;
    },
  ) {
    return this.settingsService.updateNotificationPreferences(
      user.id,
      preferences,
    );
  }

  @Get('privacy')
  async getPrivacySettings(@CurrentUser() user: CurrentUserData) {
    return this.settingsService.getPrivacySettings(user.id);
  }

  @Put('privacy')
  async updatePrivacySettings(
    @CurrentUser() user: CurrentUserData,
    @Body() privacy: PrivacySettingsDto,
  ) {
    return this.settingsService.updatePrivacySettings(user.id, privacy);
  }

}
