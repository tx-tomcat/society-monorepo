import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { ApplyReferralDto } from './dto/apply-referral.dto';
import { ReferralService } from './referral.service';

@Controller('referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) { }

  @Get('my-code')
  async getMyCode(@CurrentUser() user: CurrentUserData) {
    const code = await this.referralService.generateCode(user.id);
    return { code };
  }

  @Get('stats')
  async getStats(@CurrentUser() user: CurrentUserData) {
    return this.referralService.getStats(user.id);
  }

  @Get('info')
  async getInfo(@CurrentUser() user: CurrentUserData) {
    return this.referralService.getReferralInfo(user.id);
  }

  @Post('apply')
  async applyReferralCode(@CurrentUser() user: CurrentUserData, @Body() dto: ApplyReferralDto) {
    await this.referralService.applyReferralCode(user.id, dto.code);
    return { success: true, message: 'Referral code applied successfully' };
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.referralService.getLeaderboard(10);
  }

  @Get('history')
  async getHistory(@CurrentUser() user: CurrentUserData) {
    const info = await this.referralService.getReferralInfo(user.id);
    return info?.referredUsers || [];
  }
}
