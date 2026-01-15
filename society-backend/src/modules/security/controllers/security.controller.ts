import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { SecurityService } from '../services/security.service';
import { RateLimiterService } from '../services/rate-limiter.service';
import { FraudDetectionService } from '../services/fraud-detection.service';
import {
  BlockIpDto,
  ReportFraudDto,
  UpdateRateLimitDto,
  SecurityEventFilterDto,
} from '../dto/security.dto';

@Controller('security')
@UseGuards(JwtAuthGuard)
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly fraudDetectionService: FraudDetectionService,
  ) {}

  @Get('sessions')
  async getMySessions(@Request() req: any) {
    const sessions = await this.securityService.getUserSessions(req.user.id);
    // Mark current session
    return sessions.map((s) => ({
      ...s,
      isCurrent: s.id === req.session?.id,
    }));
  }

  @Delete('sessions/:id')
  async terminateSession(@Request() req: any, @Param('id') id: string) {
    await this.securityService.terminateSession(req.user.id, id);
    return { success: true };
  }

  @Delete('sessions')
  async terminateAllSessions(@Request() req: any) {
    await this.securityService.terminateAllSessions(req.user.id);
    return { success: true };
  }

  @Get('risk-assessment')
  async getMyRiskAssessment(@Request() req: any) {
    return this.fraudDetectionService.assessRisk(req.user.id);
  }
}

@Controller('admin/security')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SecurityAdminController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly rateLimiterService: RateLimiterService,
    private readonly fraudDetectionService: FraudDetectionService,
  ) {}

  @Get('metrics')
  async getSecurityMetrics() {
    return this.securityService.getSecurityMetrics();
  }

  @Get('events')
  async getSecurityEvents(@Query() filters: SecurityEventFilterDto) {
    return this.securityService.getSecurityEvents(filters);
  }

  @Get('config')
  async getSecurityConfig() {
    return this.securityService.getSecurityConfig();
  }

  // IP Blocking
  @Get('blocked-ips')
  async getBlockedIps() {
    return this.securityService.getBlockedIps();
  }

  @Post('blocked-ips')
  async blockIp(@Request() req: any, @Body() dto: BlockIpDto) {
    return this.securityService.blockIp(req.user.id, dto);
  }

  @Delete('blocked-ips/:ip')
  async unblockIp(@Param('ip') ip: string) {
    await this.securityService.unblockIp(ip);
    return { success: true };
  }

  // Rate Limiting
  @Get('rate-limits')
  async getRateLimits() {
    return this.rateLimiterService.getLimits();
  }

  @Post('rate-limits')
  async updateRateLimit(@Body() dto: UpdateRateLimitDto) {
    await this.rateLimiterService.updateLimit(dto.type, {
      maxRequests: dto.maxRequests,
      windowSeconds: dto.windowSeconds,
    });
    return { success: true };
  }

  // Fraud Detection
  @Get('fraud-reports')
  async getPendingFraudReports() {
    return this.fraudDetectionService.getPendingFraudReports();
  }

  @Post('fraud-reports')
  async reportFraud(@Request() req: any, @Body() dto: ReportFraudDto) {
    return this.fraudDetectionService.reportFraud(req.user.id, dto);
  }

  @Post('fraud-reports/:id/review')
  async reviewFraudReport(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { approved: boolean; notes?: string },
  ) {
    return this.fraudDetectionService.reviewFraudReport(
      id,
      req.user.id,
      body.approved,
      body.notes,
    );
  }

  // User Risk Assessment
  @Get('users/:id/risk')
  async getUserRiskAssessment(@Param('id') id: string) {
    return this.fraudDetectionService.assessRisk(id);
  }

  @Get('users/:id/sessions')
  async getUserSessions(@Param('id') id: string) {
    return this.securityService.getUserSessions(id);
  }

  @Delete('users/:id/sessions')
  async terminateUserSessions(@Param('id') id: string) {
    await this.securityService.terminateAllSessions(id);
    return { success: true };
  }
}
