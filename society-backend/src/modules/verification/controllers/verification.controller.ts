import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { VerificationService } from '../services/verification.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { CurrentUser, CurrentUserData } from '../../../common/decorators/current-user.decorator';

@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('status')
  async getStatus(@CurrentUser() user: CurrentUserData) {
    return this.verificationService.getStatus(user.id);
  }

  @Post('income/initiate')
  async initiateIncomeVerification(@CurrentUser() user: CurrentUserData, @Body() body: { provider: string }) {
    return this.verificationService.initiateIncomeVerification(user.id, body.provider);
  }

  @Post('education/initiate')
  async initiateEducationVerification(@CurrentUser() user: CurrentUserData, @Body() body: { university: string }) {
    return this.verificationService.initiateEducationVerification(user.id, body.university);
  }

  @Post('identity/initiate')
  async initiateIdentityVerification(@CurrentUser() user: CurrentUserData) {
    return this.verificationService.initiateIdentityVerification(user.id);
  }

  @Get('history')
  async getHistory(@CurrentUser() user: CurrentUserData) {
    return this.verificationService.getHistory(user.id);
  }
}
