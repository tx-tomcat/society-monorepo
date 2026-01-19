import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../common/decorators/current-user.decorator';
import { UpdateCompanionProfileDto, UpdateUserDto } from '../dto/create-user.dto';
import { ProfileService } from '../services/profile.service';

@Controller('users/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Get()
  async getMyProfile(@CurrentUser() user: CurrentUserData) {
    return this.profileService.getProfile(user.id);
  }

  @Put()
  async updateMyProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() updateData: UpdateUserDto,
  ) {
    return this.profileService.updateUserProfile(user.id, updateData);
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
