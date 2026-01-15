import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { UpdateCompanionProfileDto } from '../dto/create-user.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../common/decorators/current-user.decorator';

@Controller('users/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getMyProfile(@CurrentUser() user: CurrentUserData) {
    return this.profileService.getProfile(user.id);
  }

  @Get(':id')
  async getPublicProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.profileService.getPublicProfile(id);
  }

  @Put('companion')
  async updateCompanionProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() updateData: UpdateCompanionProfileDto,
  ) {
    return this.profileService.updateCompanionProfile(user.id, updateData);
  }

  @Put('active')
  async setProfileActive(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { isActive: boolean },
  ) {
    return this.profileService.setProfileActive(user.id, body.isActive);
  }

  @Put('hidden')
  async setProfileHidden(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { isHidden: boolean },
  ) {
    return this.profileService.setProfileHidden(user.id, body.isHidden);
  }
}
