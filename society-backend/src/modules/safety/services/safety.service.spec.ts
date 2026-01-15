import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SafetyService } from './safety.service';
import { PrismaService } from '@/prisma/prisma.service';
import { SosAlertType, SosAlertStatus, TriggerSosDto } from '../dto/safety.dto';
import { BookingStatus } from '@generated/client';

describe('SafetyService', () => {
  let service: SafetyService;

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    emergencyContact: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    emergencyEvent: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafetyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SafetyService>(SafetyService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // EMERGENCY CONTACTS
  // ============================================

  describe('addEmergencyContact', () => {
    it('should add an emergency contact', async () => {
      const mockContact = {
        id: 'contact-1',
        userId: 'user-1',
        name: 'Emergency Contact',
        phone: '+84912345678',
        relationship: 'Parent',
        isPrimary: true,
        createdAt: new Date(),
      };

      mockPrismaService.emergencyContact.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.emergencyContact.create.mockResolvedValue(mockContact);

      const result = await service.addEmergencyContact('user-1', {
        name: 'Emergency Contact',
        phone: '+84912345678',
        relationship: 'Parent',
        isPrimary: true,
      });

      expect(result.id).toBe('contact-1');
      expect(result.name).toBe('Emergency Contact');
      expect(result.isPrimary).toBe(true);
      expect(mockPrismaService.emergencyContact.create).toHaveBeenCalled();
    });

    it('should unset existing primary when setting new primary', async () => {
      const mockContact = {
        id: 'contact-2',
        userId: 'user-1',
        name: 'New Primary',
        phone: '+84987654321',
        relationship: 'Sibling',
        isPrimary: true,
        createdAt: new Date(),
      };

      mockPrismaService.emergencyContact.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.emergencyContact.create.mockResolvedValue(mockContact);

      await service.addEmergencyContact('user-1', {
        name: 'New Primary',
        phone: '+84987654321',
        isPrimary: true,
      });

      expect(mockPrismaService.emergencyContact.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isPrimary: true },
        data: { isPrimary: false },
      });
    });
  });

  describe('getEmergencyContacts', () => {
    it('should return list of emergency contacts', async () => {
      const mockContacts = [
        {
          id: 'contact-1',
          name: 'Primary Contact',
          phone: '+84912345678',
          relationship: 'Parent',
          isPrimary: true,
          createdAt: new Date(),
        },
        {
          id: 'contact-2',
          name: 'Secondary Contact',
          phone: '+84987654321',
          relationship: 'Friend',
          isPrimary: false,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.emergencyContact.findMany.mockResolvedValue(mockContacts);

      const result = await service.getEmergencyContacts('user-1');

      expect(result.contacts).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.contacts[0].name).toBe('Primary Contact');
    });

    it('should return empty list when no contacts', async () => {
      mockPrismaService.emergencyContact.findMany.mockResolvedValue([]);

      const result = await service.getEmergencyContacts('user-1');

      expect(result.contacts).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updateEmergencyContact', () => {
    it('should update an emergency contact', async () => {
      const existingContact = {
        id: 'contact-1',
        userId: 'user-1',
        name: 'Old Name',
        phone: '+84912345678',
        relationship: 'Parent',
        isPrimary: false,
        createdAt: new Date(),
      };

      const updatedContact = {
        ...existingContact,
        name: 'New Name',
        isPrimary: true,
      };

      mockPrismaService.emergencyContact.findFirst.mockResolvedValue(existingContact);
      mockPrismaService.emergencyContact.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.emergencyContact.update.mockResolvedValue(updatedContact);

      const result = await service.updateEmergencyContact('user-1', 'contact-1', {
        name: 'New Name',
        isPrimary: true,
      });

      expect(result.name).toBe('New Name');
      expect(result.isPrimary).toBe(true);
    });

    it('should throw NotFoundException when contact not found', async () => {
      mockPrismaService.emergencyContact.findFirst.mockResolvedValue(null);

      await expect(
        service.updateEmergencyContact('user-1', 'nonexistent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEmergencyContact', () => {
    it('should delete an emergency contact', async () => {
      mockPrismaService.emergencyContact.findFirst.mockResolvedValue({
        id: 'contact-1',
        userId: 'user-1',
      });
      mockPrismaService.emergencyContact.delete.mockResolvedValue({});

      const result = await service.deleteEmergencyContact('user-1', 'contact-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Emergency contact deleted');
    });

    it('should throw NotFoundException when contact not found', async () => {
      mockPrismaService.emergencyContact.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteEmergencyContact('user-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // SOS ALERTS
  // ============================================

  describe('triggerSos', () => {
    const triggerSosDto: TriggerSosDto = {
      bookingId: 'booking-1',
      alertType: SosAlertType.EMERGENCY,
      latitude: 10.762622,
      longitude: 106.660172,
      message: 'Need help',
    };

    it('should trigger SOS alert successfully', async () => {
      const triggeredAt = new Date();
      const mockEvent = {
        id: 'event-1',
        userId: 'user-1',
        bookingId: 'booking-1',
        alertType: SosAlertType.EMERGENCY,
        status: 'ACTIVE',
        locationLat: 10.762622,
        locationLng: 106.660172,
        message: 'Need help',
        triggeredAt,
      };

      mockPrismaService.emergencyEvent.findFirst.mockResolvedValue(null);
      mockPrismaService.emergencyEvent.create.mockResolvedValue(mockEvent);

      const result = await service.triggerSos('user-1', triggerSosDto);

      expect(result.id).toBe('event-1');
      expect(result.status).toBe(SosAlertStatus.ACTIVE);
      expect(result.message).toContain('30 seconds to cancel');
      expect(result.cancelDeadline).toBeDefined();
    });

    it('should throw ConflictException when active alert exists', async () => {
      mockPrismaService.emergencyEvent.findFirst.mockResolvedValue({
        id: 'existing-event',
        status: 'ACTIVE',
      });

      await expect(service.triggerSos('user-1', triggerSosDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('cancelSos', () => {
    it('should cancel SOS within 30-second window', async () => {
      const triggeredAt = new Date(); // Just triggered
      mockPrismaService.emergencyEvent.findFirst.mockResolvedValue({
        id: 'event-1',
        userId: 'user-1',
        status: 'ACTIVE',
        triggeredAt,
      });
      mockPrismaService.emergencyEvent.update.mockResolvedValue({});

      const result = await service.cancelSos('user-1', {
        alertId: 'event-1',
        reason: 'False alarm',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('SOS alert cancelled successfully');
    });

    it('should throw NotFoundException when alert not found', async () => {
      mockPrismaService.emergencyEvent.findFirst.mockResolvedValue(null);

      await expect(
        service.cancelSos('user-1', { alertId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when cancel window expired', async () => {
      const triggeredAt = new Date(Date.now() - 60000); // 60 seconds ago
      mockPrismaService.emergencyEvent.findFirst.mockResolvedValue({
        id: 'event-1',
        userId: 'user-1',
        status: 'ACTIVE',
        triggeredAt,
      });

      await expect(
        service.cancelSos('user-1', { alertId: 'event-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getActiveSosAlerts', () => {
    it('should return active SOS alerts', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          userId: 'user-1',
          bookingId: null,
          alertType: 'EMERGENCY',
          status: 'ACTIVE',
          locationLat: 10.762622,
          locationLng: 106.660172,
          message: 'Help',
          triggeredAt: new Date(),
          escalatedAt: null,
          resolvedAt: null,
        },
      ];

      mockPrismaService.emergencyEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.getActiveSosAlerts('user-1');

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].alertType).toBe(SosAlertType.EMERGENCY);
    });

    it('should return empty array when no active alerts', async () => {
      mockPrismaService.emergencyEvent.findMany.mockResolvedValue([]);

      const result = await service.getActiveSosAlerts('user-1');

      expect(result.alerts).toHaveLength(0);
    });
  });

  describe('updateSosStatus', () => {
    it('should update SOS status to resolved', async () => {
      mockPrismaService.emergencyEvent.findFirst.mockResolvedValue({
        id: 'event-1',
        userId: 'user-1',
        status: 'ACTIVE',
        notes: null,
      });
      mockPrismaService.emergencyEvent.update.mockResolvedValue({});

      const result = await service.updateSosStatus('user-1', 'event-1', {
        status: SosAlertStatus.RESOLVED,
        notes: 'Resolved by support',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(SosAlertStatus.RESOLVED);
    });

    it('should throw NotFoundException when alert not found', async () => {
      mockPrismaService.emergencyEvent.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSosStatus('user-1', 'nonexistent', {
          status: SosAlertStatus.RESOLVED,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolveSos', () => {
    it('should resolve SOS alert', async () => {
      mockPrismaService.emergencyEvent.findFirst.mockResolvedValue({
        id: 'event-1',
        userId: 'user-1',
        status: 'ACTIVE',
      });
      mockPrismaService.emergencyEvent.update.mockResolvedValue({});

      const result = await service.resolveSos('user-1', 'event-1', {
        notes: 'All clear',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('SOS alert resolved successfully');
    });

    it('should throw NotFoundException when alert not found', async () => {
      mockPrismaService.emergencyEvent.findFirst.mockResolvedValue(null);

      await expect(
        service.resolveSos('user-1', 'nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAlertsForEscalation', () => {
    it('should return alerts needing escalation', async () => {
      const oldTriggeredAt = new Date(Date.now() - 6 * 60 * 1000); // 6 minutes ago
      const mockEvents = [
        {
          id: 'event-1',
          userId: 'user-1',
          alertType: 'EMERGENCY',
          status: 'ACTIVE',
          locationLat: 10.762622,
          locationLng: 106.660172,
          triggeredAt: oldTriggeredAt,
          escalatedAt: null,
        },
      ];

      mockPrismaService.emergencyEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.getAlertsForEscalation();

      expect(result).toHaveLength(1);
      expect(result[0].eventId).toBe('event-1');
    });
  });

  // ============================================
  // LOCATION TRACKING
  // ============================================

  describe('updateLocation', () => {
    it('should update location during active booking', async () => {
      const mockBooking = {
        id: 'booking-1',
        hirerId: 'user-1',
        companionId: 'user-2',
        status: BookingStatus.ACTIVE,
        startedAt: new Date(),
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        locationLat: 10.762622,
        locationLng: 106.660172,
      });

      const result = await service.updateLocation('user-1', 'booking-1', {
        latitude: 10.762622,
        longitude: 106.660172,
      });

      expect(result.isTracking).toBe(true);
      expect(result.lastLocation?.latitude).toBe(10.762622);
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { locationLat: 10.762622, locationLng: 106.660172 },
      });
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.updateLocation('user-1', 'booking-1', { latitude: 10.0, longitude: 106.0 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user not part of booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        hirerId: 'other-user',
        companionId: 'another-user',
        status: BookingStatus.ACTIVE,
      });

      await expect(
        service.updateLocation('user-1', 'booking-1', { latitude: 10.0, longitude: 106.0 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLocationHistory', () => {
    it('should return current booking location', async () => {
      const mockBooking = {
        id: 'booking-1',
        hirerId: 'user-1',
        companionId: 'user-2',
        locationLat: 10.762622,
        locationLng: 106.660172,
        updatedAt: new Date(),
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.getLocationHistory('user-1', 'booking-1');

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0].latitude).toBe(10.762622);
    });

    it('should return empty array when booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      const result = await service.getLocationHistory('user-1', 'booking-1');

      expect(result.locations).toHaveLength(0);
    });

    it('should return empty array when user not part of booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        hirerId: 'other-user',
        companionId: 'another-user',
        locationLat: 10.762622,
        locationLng: 106.660172,
        updatedAt: new Date(),
      });

      const result = await service.getLocationHistory('user-1', 'booking-1');

      expect(result.locations).toHaveLength(0);
    });

    it('should return empty array when booking has no location', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        hirerId: 'user-1',
        companionId: 'user-2',
        locationLat: null,
        locationLng: null,
        updatedAt: new Date(),
      });

      const result = await service.getLocationHistory('user-1', 'booking-1');

      expect(result.locations).toHaveLength(0);
    });
  });
});
