import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';

@Controller('companion/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  /**
   * Get companion dashboard
   */
  @Get()
  async getDashboard(@CurrentUser('id') userId: string) {
    return this.dashboardService.getDashboard(userId);
  }
}
