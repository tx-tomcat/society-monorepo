import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { MembershipTier } from '@generated/client';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PurchaseMembershipDto } from './dto/membership.dto';
import { MembershipService } from './membership.service';

@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  /**
   * Get all membership pricing tiers (public)
   */
  @Get('pricing')
  async getPricing() {
    return this.membershipService.getPricing();
  }

  /**
   * Get current user's active membership and history
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    const [active, history] = await Promise.all([
      this.membershipService.getActiveMembership(userId),
      this.membershipService.getMembershipHistory(userId),
    ]);
    return { active, history };
  }

  /**
   * Purchase a membership tier
   */
  @UseGuards(JwtAuthGuard)
  @Post('purchase')
  async purchase(
    @CurrentUser('id') userId: string,
    @Body() dto: PurchaseMembershipDto,
  ) {
    return this.membershipService.purchaseMembership(
      userId,
      dto.tier as MembershipTier,
    );
  }

  /**
   * Get current user's membership benefits
   */
  @UseGuards(JwtAuthGuard)
  @Get('benefits')
  async getBenefits(@CurrentUser('id') userId: string) {
    return this.membershipService.getUserBenefits(userId);
  }
}
