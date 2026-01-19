import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/roles.enum';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import {
  BroadcastNotificationDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  UserSearchDto,
  VerificationApprovalDto,
  WithdrawalRejectionDto,
} from '../dto/admin.dto';
import { AdminService } from '../services/admin.service';

interface AuthenticatedRequest {
  user: { id: string; email: string; role: string };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  // Dashboard
  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('health')
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  // User Management
  @Get('users')
  async searchUsers(@Query() filters: UserSearchDto) {
    return this.adminService.searchUsers(filters);
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Put('users/:id/role')
  async updateUserRole(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(req.user.id, id, dto);
  }

  @Put('users/:id/status')
  async updateUserStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(req.user.id, id, dto);
  }

  // Verifications
  @Get('verifications/pending')
  async getPendingVerifications() {
    return this.adminService.getPendingVerifications();
  }

  @Post('verifications/:id/review')
  async reviewVerification(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: VerificationApprovalDto,
  ) {
    return this.adminService.approveVerification(req.user.id, id, dto);
  }

  // Withdrawals
  @Get('withdrawals/pending')
  async getPendingWithdrawals() {
    return this.adminService.getPendingWithdrawals();
  }

  @Post('withdrawals/:id/approve')
  async approveWithdrawal(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.adminService.approveWithdrawal(req.user.id, id);
  }

  @Post('withdrawals/:id/reject')
  async rejectWithdrawal(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: WithdrawalRejectionDto,
  ) {
    return this.adminService.rejectWithdrawal(req.user.id, id, dto.reason);
  }

  // Notifications
  @Post('notifications/broadcast')
  async broadcastNotification(
    @Request() req: AuthenticatedRequest,
    @Body() dto: BroadcastNotificationDto,
  ) {
    return this.adminService.broadcastNotification(req.user.id, dto);
  }

  // Audit Logs
  @Get('audit-logs')
  async getAuditLogs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getAuditLogs(
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }
}
