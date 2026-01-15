import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

// Local enum definition (matches schema.prisma EmergencyEventStatus)
// This allows the service to work before prisma generate is run
const EmergencyEventStatus = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  RESOLVED: 'RESOLVED',
  ESCALATED: 'ESCALATED',
} as const;

// Type definitions for Prisma models (until prisma generate is run)
// These match the schema.prisma definitions
interface EmergencyContactRecord {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface EmergencyEventRecord {
  id: string;
  userId: string;
  bookingId: string | null;
  alertType: string;
  status: string;
  locationLat: number | null;
  locationLng: number | null;
  message: string | null;
  triggeredAt: Date;
  cancelledAt: Date | null;
  escalatedAt: Date | null;
  resolvedAt: Date | null;
  resolvedById: string | null;
  notes: string | null;
  user?: {
    fullName: string;
    emergencyContacts: EmergencyContactRecord[];
  };
}

// Prisma delegate interface for type-safe model access
interface PrismaDelegate<T> {
  findFirst: (args: unknown) => Promise<T | null>;
  findUnique: (args: unknown) => Promise<T | null>;
  findMany: (args: unknown) => Promise<T[]>;
  create: (args: unknown) => Promise<T>;
  update: (args: unknown) => Promise<T>;
  updateMany: (args: unknown) => Promise<{ count: number }>;
  delete: (args: unknown) => Promise<T>;
}

import {
  TriggerSosDto,
  UpdateSosStatusDto,
  UpdateLocationDto,
  AddEmergencyContactDto,
  UpdateEmergencyContactDto,
  CancelSosDto,
  ResolveSosDto,
  SosAlertResponse,
  SosAlertStatus,
  SosAlertType,
  LocationTrackingResponse,
  EmergencyContactResponse,
  EmergencyContactListResponse,
  TriggerSosResponse,
  CancelSosResponse,
} from '../dto/safety.dto';

// Cancel window in milliseconds (30 seconds)
const SOS_CANCEL_WINDOW_MS = 30 * 1000;

// Escalation time in milliseconds (5 minutes)
const SOS_ESCALATION_TIME_MS = 5 * 60 * 1000;

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Type-safe accessors for new models (until prisma generate is run)
  private get emergencyContact(): PrismaDelegate<EmergencyContactRecord> {
    return (this.prisma as unknown as { emergencyContact: PrismaDelegate<EmergencyContactRecord> }).emergencyContact;
  }

  private get emergencyEvent(): PrismaDelegate<EmergencyEventRecord> {
    return (this.prisma as unknown as { emergencyEvent: PrismaDelegate<EmergencyEventRecord> }).emergencyEvent;
  }

  // ============================================
  // EMERGENCY CONTACTS
  // ============================================

  /**
   * Add an emergency contact
   */
  async addEmergencyContact(
    userId: string,
    dto: AddEmergencyContactDto,
  ): Promise<EmergencyContactResponse> {
    // If setting as primary, unset any existing primary
    if (dto.isPrimary) {
      await this.emergencyContact.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await this.emergencyContact.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        relationship: dto.relationship || null,
        isPrimary: dto.isPrimary ?? false,
      },
    });

    return {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      isPrimary: contact.isPrimary,
      createdAt: contact.createdAt.toISOString(),
    };
  }

  /**
   * Get user's emergency contacts
   */
  async getEmergencyContacts(userId: string): Promise<EmergencyContactListResponse> {
    const contacts = await this.emergencyContact.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return {
      contacts: contacts.map((contact: EmergencyContactRecord) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship,
        isPrimary: contact.isPrimary,
        createdAt: contact.createdAt.toISOString(),
      })),
      total: contacts.length,
    };
  }

  /**
   * Update an emergency contact
   */
  async updateEmergencyContact(
    userId: string,
    contactId: string,
    dto: UpdateEmergencyContactDto,
  ): Promise<EmergencyContactResponse> {
    const contact = await this.emergencyContact.findFirst({
      where: { id: contactId, userId },
    });

    if (!contact) {
      throw new NotFoundException('Emergency contact not found');
    }

    // If setting as primary, unset any existing primary
    if (dto.isPrimary) {
      await this.emergencyContact.updateMany({
        where: { userId, isPrimary: true, id: { not: contactId } },
        data: { isPrimary: false },
      });
    }

    const updated = await this.emergencyContact.update({
      where: { id: contactId },
      data: {
        name: dto.name ?? contact.name,
        phone: dto.phone ?? contact.phone,
        relationship: dto.relationship !== undefined ? dto.relationship : contact.relationship,
        isPrimary: dto.isPrimary ?? contact.isPrimary,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      relationship: updated.relationship,
      isPrimary: updated.isPrimary,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Delete an emergency contact
   */
  async deleteEmergencyContact(
    userId: string,
    contactId: string,
  ): Promise<{ success: boolean; message: string }> {
    const contact = await this.emergencyContact.findFirst({
      where: { id: contactId, userId },
    });

    if (!contact) {
      throw new NotFoundException('Emergency contact not found');
    }

    await this.emergencyContact.delete({
      where: { id: contactId },
    });

    return {
      success: true,
      message: 'Emergency contact deleted',
    };
  }

  // ============================================
  // SOS ALERTS
  // ============================================

  /**
   * Trigger SOS alert with 30-second cancel window
   */
  async triggerSos(userId: string, dto: TriggerSosDto): Promise<TriggerSosResponse> {
    // Check for existing active alert
    const existingAlert = await this.emergencyEvent.findFirst({
      where: {
        userId,
        status: EmergencyEventStatus.ACTIVE,
      },
    });

    if (existingAlert) {
      throw new ConflictException('An active SOS alert already exists. Cancel it first or wait for resolution.');
    }

    // Create the emergency event
    const event = await this.emergencyEvent.create({
      data: {
        userId,
        bookingId: dto.bookingId,
        alertType: dto.alertType,
        status: EmergencyEventStatus.ACTIVE,
        locationLat: dto.latitude,
        locationLng: dto.longitude,
        message: dto.message || null,
      },
    });

    const cancelDeadline = new Date(event.triggeredAt.getTime() + SOS_CANCEL_WINDOW_MS);

    this.logger.warn(`SOS ALERT TRIGGERED: User ${userId}, Event ${event.id}, Type: ${dto.alertType}`);

    // Note: In production, this would queue a job to check for escalation after 5 minutes
    // For now, we'll handle escalation checks in a scheduled task

    return {
      id: event.id,
      status: SosAlertStatus.ACTIVE,
      message: 'SOS alert triggered. You have 30 seconds to cancel if this was accidental.',
      cancelDeadline: cancelDeadline.toISOString(),
    };
  }

  /**
   * Cancel SOS alert (only within 30-second window)
   */
  async cancelSos(userId: string, dto: CancelSosDto): Promise<CancelSosResponse> {
    const event = await this.emergencyEvent.findFirst({
      where: {
        id: dto.alertId,
        userId,
        status: EmergencyEventStatus.ACTIVE,
      },
    });

    if (!event) {
      throw new NotFoundException('Active SOS alert not found');
    }

    const now = new Date();
    const cancelDeadline = new Date(event.triggeredAt.getTime() + SOS_CANCEL_WINDOW_MS);

    if (now > cancelDeadline) {
      throw new BadRequestException(
        'Cancel window has expired. Emergency contacts may have been notified. Please contact support if this was a false alarm.',
      );
    }

    await this.emergencyEvent.update({
      where: { id: event.id },
      data: {
        status: EmergencyEventStatus.CANCELLED,
        cancelledAt: now,
        notes: dto.reason || 'Cancelled by user within 30-second window',
      },
    });

    this.logger.log(`SOS CANCELLED: User ${userId}, Event ${event.id}`);

    return {
      success: true,
      message: 'SOS alert cancelled successfully',
    };
  }

  /**
   * Get active SOS alerts for user
   */
  async getActiveSosAlerts(userId: string): Promise<{ alerts: SosAlertResponse[] }> {
    const events = await this.emergencyEvent.findMany({
      where: {
        userId,
        status: {
          in: [EmergencyEventStatus.ACTIVE, EmergencyEventStatus.ESCALATED],
        },
      },
      orderBy: { triggeredAt: 'desc' },
    });

    const alerts: SosAlertResponse[] = [];

    for (const event of events) {
      // Get booking details if available
      let bookingDetails = null;
      if (event.bookingId) {
        const booking = await this.prisma.booking.findUnique({
          where: { id: event.bookingId },
          include: {
            hirer: { select: { fullName: true, phone: true } },
            companion: { select: { fullName: true, phone: true } },
          },
        });

        if (booking) {
          const isHirer = booking.hirerId === userId;
          const otherParty = isHirer ? booking.companion : booking.hirer;

          bookingDetails = {
            id: booking.id,
            occasion: booking.occasionType,
            location: booking.locationAddress,
            otherParty: {
              displayName: otherParty.fullName,
              phone: otherParty.phone,
            },
          };
        }
      }

      alerts.push({
        id: event.id,
        alertType: event.alertType as SosAlertType,
        status: event.status === EmergencyEventStatus.ESCALATED
          ? SosAlertStatus.ACKNOWLEDGED
          : SosAlertStatus.ACTIVE,
        latitude: event.locationLat ? Number(event.locationLat) : 0,
        longitude: event.locationLng ? Number(event.locationLng) : 0,
        message: event.message,
        booking: bookingDetails || {
          id: '',
          occasion: 'Unknown',
          location: 'Unknown',
          otherParty: { displayName: 'Unknown', phone: null },
        },
        createdAt: event.triggeredAt.toISOString(),
        acknowledgedAt: event.escalatedAt?.toISOString() || null,
        resolvedAt: event.resolvedAt?.toISOString() || null,
      });
    }

    return { alerts };
  }

  /**
   * Update SOS alert status (for admin/support)
   */
  async updateSosStatus(
    userId: string,
    alertId: string,
    dto: UpdateSosStatusDto,
  ): Promise<{ success: boolean; status: SosAlertStatus }> {
    const event = await this.emergencyEvent.findFirst({
      where: { id: alertId, userId },
    });

    if (!event) {
      throw new NotFoundException('SOS alert not found');
    }

    const updateData: Record<string, unknown> = {
      notes: dto.notes || event.notes,
    };

    if (dto.status === SosAlertStatus.RESOLVED) {
      updateData.status = EmergencyEventStatus.RESOLVED;
      updateData.resolvedAt = new Date();
      updateData.resolvedById = userId;
    } else if (dto.status === SosAlertStatus.ACKNOWLEDGED) {
      updateData.status = EmergencyEventStatus.ESCALATED;
      updateData.escalatedAt = new Date();
    } else if (dto.status === SosAlertStatus.CANCELLED) {
      updateData.status = EmergencyEventStatus.CANCELLED;
      updateData.cancelledAt = new Date();
    }

    await this.emergencyEvent.update({
      where: { id: alertId },
      data: updateData,
    });

    return {
      success: true,
      status: dto.status,
    };
  }

  /**
   * Resolve SOS alert (user self-resolve)
   */
  async resolveSos(
    userId: string,
    alertId: string,
    dto: ResolveSosDto,
  ): Promise<{ success: boolean; message: string }> {
    const event = await this.emergencyEvent.findFirst({
      where: {
        id: alertId,
        userId,
        status: {
          in: [EmergencyEventStatus.ACTIVE, EmergencyEventStatus.ESCALATED],
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Active SOS alert not found');
    }

    await this.emergencyEvent.update({
      where: { id: alertId },
      data: {
        status: EmergencyEventStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedById: userId,
        notes: dto.notes || 'Resolved by user',
      },
    });

    this.logger.log(`SOS RESOLVED: User ${userId}, Event ${alertId}`);

    return {
      success: true,
      message: 'SOS alert resolved successfully',
    };
  }

  /**
   * Check for alerts that need escalation (to be called by scheduled task)
   * Returns alerts that are past the 5-minute mark and not yet escalated
   */
  async getAlertsForEscalation(): Promise<
    Array<{
      eventId: string;
      userId: string;
      alertType: string;
      locationLat: number | null;
      locationLng: number | null;
    }>
  > {
    const escalationThreshold = new Date(Date.now() - SOS_ESCALATION_TIME_MS);

    const events = await this.emergencyEvent.findMany({
      where: {
        status: EmergencyEventStatus.ACTIVE,
        triggeredAt: { lte: escalationThreshold },
        escalatedAt: null,
      },
    });

    return events.map((event: EmergencyEventRecord) => ({
      eventId: event.id,
      userId: event.userId,
      alertType: event.alertType,
      locationLat: event.locationLat ? Number(event.locationLat) : null,
      locationLng: event.locationLng ? Number(event.locationLng) : null,
    }));
  }

  /**
   * Mark alert as escalated and notify contacts
   */
  async escalateAlert(eventId: string): Promise<void> {
    const event = await this.emergencyEvent.findUnique({
      where: { id: eventId },
      include: {
        user: {
          include: {
            emergencyContacts: {
              orderBy: [{ isPrimary: 'desc' }],
            },
          },
        },
      },
    });

    if (!event) {
      this.logger.error(`Escalation failed: Event ${eventId} not found`);
      return;
    }

    // Mark as escalated
    await this.emergencyEvent.update({
      where: { id: eventId },
      data: {
        status: EmergencyEventStatus.ESCALATED,
        escalatedAt: new Date(),
      },
    });

    this.logger.warn(
      `SOS ESCALATED: User ${event.userId}, Event ${eventId}. ` +
        `Notifying ${event.user.emergencyContacts.length} contacts.`,
    );

    // Note: In production, this would send SMS/push notifications to emergency contacts
    // For now, we log the escalation
    for (const contact of event.user.emergencyContacts) {
      this.logger.warn(
        `NOTIFY EMERGENCY CONTACT: ${contact.name} (${contact.phone}) for user ${event.user.fullName}`,
      );
    }
  }

  // ============================================
  // LOCATION TRACKING
  // ============================================

  /**
   * Update location during booking
   */
  async updateLocation(
    userId: string,
    bookingId: string,
    dto: UpdateLocationDto,
  ): Promise<LocationTrackingResponse> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isHirer = booking.hirerId === userId;
    const isCompanion = booking.companionId === userId;

    if (!isHirer && !isCompanion) {
      throw new BadRequestException('Access denied');
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        locationLat: dto.latitude,
        locationLng: dto.longitude,
      },
    });

    return {
      bookingId,
      isTracking: true,
      lastLocation: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        timestamp: new Date().toISOString(),
      },
      trackingStartedAt: booking.startedAt?.toISOString() || null,
    };
  }

  /**
   * Get location history for a booking
   */
  async getLocationHistory(
    userId: string,
    bookingId: string,
  ): Promise<{ locations: Array<{ latitude: number; longitude: number; timestamp: string }> }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { locations: [] };
    }

    const isHirer = booking.hirerId === userId;
    const isCompanion = booking.companionId === userId;

    if (!isHirer && !isCompanion) {
      return { locations: [] };
    }

    if (booking.locationLat && booking.locationLng) {
      return {
        locations: [
          {
            latitude: Number(booking.locationLat),
            longitude: Number(booking.locationLng),
            timestamp: booking.updatedAt.toISOString(),
          },
        ],
      };
    }

    return { locations: [] };
  }
}
