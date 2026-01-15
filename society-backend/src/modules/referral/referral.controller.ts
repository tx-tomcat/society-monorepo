import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { ApplyReferralDto } from './dto/apply-referral.dto';
import { ReferralService } from './referral.service';

@Controller('referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('my-code')
  async getMyCode(@User() userId: string) {
    const code = await this.referralService.generateCode(userId);
    return { code };
  }

  @Get('stats')
  async getStats(@User() userId: string) {
    return this.referralService.getStats(userId);
  }

  @Get('info')
  async getInfo(@User() userId: string) {
    return this.referralService.getReferralInfo(userId);
  }

  @Post('apply')
  async applyReferralCode(@User() userId: string, @Body() dto: ApplyReferralDto) {
    await this.referralService.applyReferralCode(userId, dto.code);
    return { success: true, message: 'Referral code applied successfully' };
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.referralService.getLeaderboard(10);
  }

  @Get('history')
  async getHistory(@User() userId: string) {
    const info = await this.referralService.getReferralInfo(userId);
    return info?.referredUsers || [];
  }
}
