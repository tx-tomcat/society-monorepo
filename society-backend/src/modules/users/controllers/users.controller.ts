import { ReportType, UserStatus } from '@generated/client';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/roles.enum';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  CreateCompanionProfileDto,
  RegisterUserDto,
  UpdateUserDto,
} from '../dto/create-user.dto';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  async registerUser(@Body() registerData: RegisterUserDto) {
    const user = await this.usersService.registerUser(registerData);
    return {
      success: true,
      data: user,
    };
  }

  @Post('companion-profile')
  @UseGuards(JwtAuthGuard)
  async createCompanionProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() profileData: CreateCompanionProfileDto,
  ) {
    const updatedUser = await this.usersService.createCompanionProfile(
      user.id,
      profileData,
    );

    return {
      success: true,
      data: updatedUser,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: CurrentUserData) {
    return this.usersService.findById(user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: CurrentUserData,
    @Body() updateData: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.updateUser(user.id, updateData);
    return {
      success: true,
      data: updatedUser,
    };
  }

  @Post('onboarding/complete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(@CurrentUser() user: CurrentUserData) {
    const updatedUser = await this.usersService.completeOnboarding(user.id);
    return {
      success: true,
      data: updatedUser,
    };
  }

  @Post('onboarding/reset')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resetOnboarding(@CurrentUser() user: CurrentUserData) {
    const updatedUser = await this.usersService.resetOnboarding(user.id);
    return {
      success: true,
      data: updatedUser,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Post('batch')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUsersBatch(@Body() body: { userIds: string[] }) {
    return this.usersService.findByIds(body.userIds);
  }

  @Post('block/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async blockUser(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) blockedId: string,
  ) {
    return this.usersService.blockUser(user.id, blockedId);
  }

  @Delete('block/:id')
  @UseGuards(JwtAuthGuard)
  async unblockUser(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) blockedId: string,
  ) {
    return this.usersService.unblockUser(user.id, blockedId);
  }

  @Get('blocked/list')
  @UseGuards(JwtAuthGuard)
  async getBlockedUsers(@CurrentUser() user: CurrentUserData) {
    return this.usersService.getBlockedUsers(user.id);
  }

  @Post('report/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async reportUser(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) reportedId: string,
    @Body()
    body: {
      type: ReportType;
      description: string;
      evidenceUrls?: string[];
      bookingId?: string;
    },
  ) {
    return this.usersService.reportUser(
      user.id,
      reportedId,
      body.type,
      body.description,
      body.evidenceUrls,
      body.bookingId,
    );
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@CurrentUser() user: CurrentUserData) {
    return this.usersService.deleteAccount(user.id);
  }

  /**
   * GDPR Data Export - Export all user's personal data
   * Returns a comprehensive JSON object with all user data
   */
  @Get('gdpr/export')
  @UseGuards(JwtAuthGuard)
  async exportUserData(@CurrentUser() user: CurrentUserData) {
    const exportData = await this.usersService.exportUserData(user.id);
    return {
      success: true,
      data: exportData,
    };
  }

  // Admin endpoints
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string },
  ) {
    return this.usersService.updateStatus(id, body.status as UserStatus);
  }

  @Put(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async activateUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.activateUser(id);
  }

  @Put(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async verifyUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.verifyUser(id);
  }
}
