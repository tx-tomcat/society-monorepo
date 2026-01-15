import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { ModerationService } from '../services/moderation.service';
import {
  ReportUserDto,
  ReportContentDto,
  ModerationActionDto,
  SuspendUserDto,
  LiftSuspensionDto,
  ReviewAppealDto,
  ModerationQueueFilterDto,
  BulkModerationDto,
} from '../dto/moderation.dto';

@Controller('moderation')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  // User reporting endpoints
  @Post('report/user')
  async reportUser(@Request() req: any, @Body() dto: ReportUserDto) {
    return this.moderationService.reportUser(req.user.id, dto);
  }

  @Post('report/content')
  async reportContent(@Request() req: any, @Body() dto: ReportContentDto) {
    return this.moderationService.reportContent(req.user.id, dto);
  }
}

@Controller('admin/moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'moderator')
export class ModerationAdminController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('queue')
  async getQueue(@Query() filters: ModerationQueueFilterDto) {
    return this.moderationService.getModerationQueue(filters);
  }

  @Get('queue/:id')
  async getQueueItem(@Param('id') id: string) {
    return this.moderationService.getQueueItem(id);
  }

  @Post('queue/:id/action')
  async takeAction(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ModerationActionDto,
  ) {
    return this.moderationService.takeAction(req.user.id, id, dto);
  }

  @Post('queue/bulk')
  async bulkAction(@Request() req: any, @Body() dto: BulkModerationDto) {
    return this.moderationService.bulkAction(req.user.id, dto);
  }

  @Get('suspensions')
  async getSuspensions(
    @Query('active') active?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.moderationService.getSuspensions(
      active !== 'false',
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Post('suspend/:userId')
  async suspendUser(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.moderationService.suspendUser(req.user.id, userId, dto);
  }

  @Post('suspensions/:id/lift')
  async liftSuspension(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: LiftSuspensionDto,
  ) {
    return this.moderationService.liftSuspension(req.user.id, id, dto);
  }

  @Get('appeals')
  async getPendingAppeals(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.moderationService.getPendingAppeals(
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Post('appeals/:id/review')
  async reviewAppeal(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ReviewAppealDto,
  ) {
    return this.moderationService.reviewAppeal(req.user.id, id, dto);
  }

  @Get('stats')
  async getStats() {
    return this.moderationService.getModerationStats();
  }
}
