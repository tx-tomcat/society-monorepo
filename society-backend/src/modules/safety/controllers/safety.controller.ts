import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  AddEmergencyContactDto,
  CancelSosDto,
  ResolveSosDto,
  TriggerSosDto,
  UpdateEmergencyContactDto,
  UpdateLocationDto,
  UpdateSosStatusDto,
} from '../dto/safety.dto';
import { SafetyService } from '../services/safety.service';

@Controller('safety')
@UseGuards(JwtAuthGuard)
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) { }

  // ============================================
  // EMERGENCY CONTACTS
  // ============================================

  /**
   * Add an emergency contact
   */
  @Post('emergency-contacts')
  async addEmergencyContact(
    @CurrentUser('id') userId: string,
    @Body() dto: AddEmergencyContactDto,
  ) {
    return this.safetyService.addEmergencyContact(userId, dto);
  }

  /**
   * Get user's emergency contacts
   */
  @Get('emergency-contacts')
  async getEmergencyContacts(@CurrentUser('id') userId: string) {
    return this.safetyService.getEmergencyContacts(userId);
  }

  /**
   * Update an emergency contact
   */
  @Put('emergency-contacts/:contactId')
  async updateEmergencyContact(
    @CurrentUser('id') userId: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateEmergencyContactDto,
  ) {
    return this.safetyService.updateEmergencyContact(userId, contactId, dto);
  }

  /**
   * Delete an emergency contact
   */
  @Delete('emergency-contacts/:contactId')
  async deleteEmergencyContact(
    @CurrentUser('id') userId: string,
    @Param('contactId') contactId: string,
  ) {
    return this.safetyService.deleteEmergencyContact(userId, contactId);
  }

  // ============================================
  // SOS ALERTS
  // ============================================

  /**
   * Trigger SOS alert with 30-second cancel window
   */
  @Post('sos')
  async triggerSos(
    @CurrentUser('id') userId: string,
    @Body() dto: TriggerSosDto,
  ) {
    return this.safetyService.triggerSos(userId, dto);
  }

  /**
   * Cancel SOS alert (only within 30-second window)
   */
  @Post('sos/cancel')
  async cancelSos(
    @CurrentUser('id') userId: string,
    @Body() dto: CancelSosDto,
  ) {
    return this.safetyService.cancelSos(userId, dto);
  }

  /**
   * Get active SOS alerts
   */
  @Get('sos/active')
  async getActiveSosAlerts(@CurrentUser('id') userId: string) {
    return this.safetyService.getActiveSosAlerts(userId);
  }

  /**
   * Update SOS alert status (for admin/support)
   */
  @Put('sos/:alertId')
  async updateSosStatus(
    @CurrentUser('id') userId: string,
    @Param('alertId') alertId: string,
    @Body() dto: UpdateSosStatusDto,
  ) {
    return this.safetyService.updateSosStatus(userId, alertId, dto);
  }

  /**
   * Resolve SOS alert (user self-resolve)
   */
  @Post('sos/:alertId/resolve')
  async resolveSos(
    @CurrentUser('id') userId: string,
    @Param('alertId') alertId: string,
    @Body() dto: ResolveSosDto,
  ) {
    return this.safetyService.resolveSos(userId, alertId, dto);
  }

  // ============================================
  // LOCATION TRACKING
  // ============================================

  /**
   * Update location during booking
   */
  @Post('location/:bookingId')
  async updateLocation(
    @CurrentUser('id') userId: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.safetyService.updateLocation(userId, bookingId, dto);
  }

  /**
   * Get location history for a booking
   */
  @Get('location/:bookingId/history')
  async getLocationHistory(
    @CurrentUser('id') userId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.safetyService.getLocationHistory(userId, bookingId);
  }
}
