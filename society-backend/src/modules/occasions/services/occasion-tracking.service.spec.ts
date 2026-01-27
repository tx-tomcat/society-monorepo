import { Test, TestingModule } from '@nestjs/testing';
import { OccasionTrackingService } from './occasion-tracking.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('OccasionTrackingService', () => {
  let service: OccasionTrackingService;

  const mockPrismaService = {
    raw: {
      occasionInteraction: {
        create: jest.fn(),
        createMany: jest.fn(),
        groupBy: jest.fn(),
      },
      $queryRaw: jest.fn(),
    },
    occasion: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OccasionTrackingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OccasionTrackingService>(OccasionTrackingService);
  });

  describe('trackInteraction', () => {
    it('should track a single interaction with user', async () => {
      mockPrismaService.raw.occasionInteraction.create.mockResolvedValue({
        id: 'test-id',
      });

      await service.trackInteraction('user-123', {
        occasionId: 'occasion-1',
        eventType: 'VIEW',
      });

      expect(
        mockPrismaService.raw.occasionInteraction.create,
      ).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          occasionId: 'occasion-1',
          eventType: 'VIEW',
          sessionId: undefined,
          metadata: {},
        },
      });
    });

    it('should track a single interaction without user (anonymous)', async () => {
      mockPrismaService.raw.occasionInteraction.create.mockResolvedValue({
        id: 'test-id',
      });

      await service.trackInteraction(null, {
        occasionId: 'occasion-1',
        eventType: 'SELECT',
        sessionId: 'session-abc',
      });

      expect(
        mockPrismaService.raw.occasionInteraction.create,
      ).toHaveBeenCalledWith({
        data: {
          userId: null,
          occasionId: 'occasion-1',
          eventType: 'SELECT',
          sessionId: 'session-abc',
          metadata: {},
        },
      });
    });

    it('should include metadata when provided', async () => {
      mockPrismaService.raw.occasionInteraction.create.mockResolvedValue({
        id: 'test-id',
      });

      await service.trackInteraction('user-123', {
        occasionId: 'occasion-1',
        eventType: 'BOOKING_CREATED',
        metadata: { bookingId: 'booking-xyz' },
      });

      expect(
        mockPrismaService.raw.occasionInteraction.create,
      ).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          occasionId: 'occasion-1',
          eventType: 'BOOKING_CREATED',
          sessionId: undefined,
          metadata: { bookingId: 'booking-xyz' },
        },
      });
    });

    it('should silently handle errors (fire-and-forget pattern)', async () => {
      const error = new Error('Database connection failed');
      mockPrismaService.raw.occasionInteraction.create.mockRejectedValue(error);

      // Should not throw - errors are logged but swallowed for fire-and-forget
      await expect(
        service.trackInteraction('user-123', {
          occasionId: 'occasion-1',
          eventType: 'VIEW',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('trackBatch', () => {
    it('should track multiple occasions at once', async () => {
      mockPrismaService.raw.occasionInteraction.createMany.mockResolvedValue({
        count: 3,
      });

      await service.trackBatch('user-123', {
        occasionIds: ['occ-1', 'occ-2', 'occ-3'],
        eventType: 'VIEW',
        sessionId: 'session-abc',
      });

      expect(
        mockPrismaService.raw.occasionInteraction.createMany,
      ).toHaveBeenCalledWith({
        data: [
          {
            userId: 'user-123',
            occasionId: 'occ-1',
            eventType: 'VIEW',
            sessionId: 'session-abc',
            metadata: {},
          },
          {
            userId: 'user-123',
            occasionId: 'occ-2',
            eventType: 'VIEW',
            sessionId: 'session-abc',
            metadata: {},
          },
          {
            userId: 'user-123',
            occasionId: 'occ-3',
            eventType: 'VIEW',
            sessionId: 'session-abc',
            metadata: {},
          },
        ],
        skipDuplicates: true,
      });
    });

    it('should do nothing for empty occasion list', async () => {
      await service.trackBatch('user-123', {
        occasionIds: [],
        eventType: 'VIEW',
      });

      expect(
        mockPrismaService.raw.occasionInteraction.createMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe('trackSelection', () => {
    it('should track SELECT event', async () => {
      mockPrismaService.raw.occasionInteraction.create.mockResolvedValue({
        id: 'test-id',
      });

      await service.trackSelection('user-123', 'occasion-1', 'session-xyz');

      expect(
        mockPrismaService.raw.occasionInteraction.create,
      ).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          occasionId: 'occasion-1',
          eventType: 'SELECT',
          sessionId: 'session-xyz',
          metadata: {},
        },
      });
    });
  });

  describe('trackBookingCreated', () => {
    it('should track BOOKING_CREATED event with booking ID in metadata', async () => {
      mockPrismaService.raw.occasionInteraction.create.mockResolvedValue({
        id: 'test-id',
      });

      await service.trackBookingCreated('user-123', 'occasion-1', 'booking-abc');

      expect(
        mockPrismaService.raw.occasionInteraction.create,
      ).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          occasionId: 'occasion-1',
          eventType: 'BOOKING_CREATED',
          sessionId: undefined,
          metadata: { bookingId: 'booking-abc' },
        },
      });
    });
  });

  describe('getMetrics', () => {
    it('should return metrics for all active occasions using groupBy', async () => {
      mockPrismaService.occasion.findMany.mockResolvedValue([
        { id: 'occ-1', code: 'dinner', nameVi: 'An toi', displayOrder: 0, isActive: true },
        { id: 'occ-2', code: 'coffee', nameVi: 'Ca phe', displayOrder: 1, isActive: true },
      ]);

      // Mock groupBy responses for VIEW, SELECT, BOOKING_CREATED
      mockPrismaService.raw.occasionInteraction.groupBy
        .mockResolvedValueOnce([
          // VIEW counts
          { occasionId: 'occ-1', _count: { id: 100 } },
          { occasionId: 'occ-2', _count: { id: 80 } },
        ])
        .mockResolvedValueOnce([
          // SELECT counts
          { occasionId: 'occ-1', _count: { id: 50 } },
          { occasionId: 'occ-2', _count: { id: 20 } },
        ])
        .mockResolvedValueOnce([
          // BOOKING_CREATED counts
          { occasionId: 'occ-1', _count: { id: 10 } },
          { occasionId: 'occ-2', _count: { id: 5 } },
        ]);

      const metrics = await service.getMetrics();

      // Sorted by bookingCount descending
      expect(metrics).toHaveLength(2);
      expect(metrics[0]).toEqual({
        occasionId: 'occ-1',
        code: 'dinner',
        name: 'An toi',
        viewCount: 100,
        selectCount: 50,
        bookingCount: 10,
        conversionRate: 0.2, // 10/50
      });
      expect(metrics[1]).toEqual({
        occasionId: 'occ-2',
        code: 'coffee',
        name: 'Ca phe',
        viewCount: 80,
        selectCount: 20,
        bookingCount: 5,
        conversionRate: 0.25, // 5/20
      });

      // Verify groupBy was called 3 times (VIEW, SELECT, BOOKING_CREATED)
      expect(mockPrismaService.raw.occasionInteraction.groupBy).toHaveBeenCalledTimes(3);
    });

    it('should handle zero select count (no division by zero)', async () => {
      mockPrismaService.occasion.findMany.mockResolvedValue([
        { id: 'occ-1', code: 'new', nameVi: 'Moi', displayOrder: 0, isActive: true },
      ]);

      // Mock groupBy responses with zero counts
      mockPrismaService.raw.occasionInteraction.groupBy
        .mockResolvedValueOnce([{ occasionId: 'occ-1', _count: { id: 10 } }]) // VIEW
        .mockResolvedValueOnce([]) // SELECT - empty means 0
        .mockResolvedValueOnce([]); // BOOKING_CREATED - empty means 0

      const metrics = await service.getMetrics();

      expect(metrics[0].conversionRate).toBe(0);
    });

    it('should handle occasions with no interactions', async () => {
      mockPrismaService.occasion.findMany.mockResolvedValue([
        { id: 'occ-1', code: 'unused', nameVi: 'Chua dung', displayOrder: 0, isActive: true },
      ]);

      // Mock groupBy responses with no data for this occasion
      mockPrismaService.raw.occasionInteraction.groupBy
        .mockResolvedValueOnce([]) // VIEW - none
        .mockResolvedValueOnce([]) // SELECT - none
        .mockResolvedValueOnce([]); // BOOKING_CREATED - none

      const metrics = await service.getMetrics();

      expect(metrics[0]).toEqual({
        occasionId: 'occ-1',
        code: 'unused',
        name: 'Chua dung',
        viewCount: 0,
        selectCount: 0,
        bookingCount: 0,
        conversionRate: 0,
      });
    });
  });

  describe('getTopOccasions', () => {
    it('should return top occasions by booking count', async () => {
      mockPrismaService.raw.$queryRaw.mockResolvedValue([
        { occasion_id: 'occ-1', count: BigInt(50) },
        { occasion_id: 'occ-2', count: BigInt(30) },
      ]);

      mockPrismaService.occasion.findMany.mockResolvedValue([
        { id: 'occ-1', code: 'dinner', nameVi: 'An toi' },
        { id: 'occ-2', code: 'coffee', nameVi: 'Ca phe' },
      ]);

      const top = await service.getTopOccasions(10, 'BOOKING_CREATED', 30);

      expect(top).toEqual([
        { occasionId: 'occ-1', code: 'dinner', name: 'An toi', count: 50 },
        { occasionId: 'occ-2', code: 'coffee', name: 'Ca phe', count: 30 },
      ]);
    });
  });
});
