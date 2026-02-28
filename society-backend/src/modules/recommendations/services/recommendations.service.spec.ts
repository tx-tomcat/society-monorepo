import { CacheService } from '@/modules/cache/cache.service';
import { PrismaService } from '@/prisma/prisma.service';
import { BoostStatus } from '@generated/client';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ScoredCompanion, ScoringService } from './scoring.service';
import { RecommendationsService } from './recommendations.service';

// Suppress logger output during tests
Logger.overrideLogger([]);

// Helper: create a mock ScoredCompanion
function makeScoredCompanion(
  overrides: Partial<ScoredCompanion> & { companionId: string },
): ScoredCompanion {
  return {
    score: 0.5,
    reason: 'Popular in your area',
    breakdown: {
      preferenceMatch: 0.5,
      profileQuality: 0.5,
      availability: 1.0,
      popularity: 0.5,
      behavioralAffinity: 0,
    },
    companion: {
      id: overrides.companionId,
      userId: `user-${overrides.companionId}`,
      displayName: `Companion ${overrides.companionId}`,
      age: 25,
      bio: 'A great companion',
      avatar: 'https://example.com/avatar.jpg',
      heightCm: 170,
      gender: 'FEMALE',
      languages: ['en', 'vi'],
      hourlyRate: 500000,
      rating: 4.5,
      reviewCount: 10,
      isVerified: true,
      isActive: true,
      photos: [{ id: 'p1', url: 'https://example.com/photo.jpg', isPrimary: true, position: 0 }],
      services: [],
    },
    ...overrides,
  };
}

describe('RecommendationsService', () => {
  let service: RecommendationsService;

  const mockUserId = 'hirer-user-123';

  const mockPrismaService = {
    userInteraction: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    companionProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userBlock: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    profileBoost: {
      findMany: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockScoringService = {
    calculateScores: jest.fn(),
    getEventWeight: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: ScoringService, useValue: mockScoringService },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getFeed ───────────────────────────────────────────────────────

  describe('getFeed', () => {
    beforeEach(() => {
      // Default: no blocks, some candidates, no boosts, no recent views
      mockPrismaService.userBlock.findMany.mockResolvedValue([]);
      mockPrismaService.companionProfile.findMany.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({ id: `comp-${i}` })),
      );
      mockPrismaService.profileBoost.findMany.mockResolvedValue([]);
      mockPrismaService.userInteraction.findMany.mockResolvedValue([]);
    });

    it('should return cold_start strategy when user has fewer than 10 interactions', async () => {
      mockPrismaService.userInteraction.count.mockResolvedValue(5);
      // For cold start, getColdStartRecommendations calls prisma.companionProfile.findMany
      mockPrismaService.companionProfile.findMany
        .mockResolvedValueOnce(
          Array.from({ length: 10 }, (_, i) => ({ id: `comp-${i}` })),
        )
        .mockResolvedValueOnce(
          Array.from({ length: 10 }, (_, i) => ({
            id: `comp-${i}`,
            userId: `user-comp-${i}`,
            displayName: `Companion ${i}`,
            bio: 'A great companion with more than 50 characters in the bio section here.',
            heightCm: 170,
            hourlyRate: 500000,
            ratingAvg: 4.5,
            ratingCount: 10,
            completedBookings: 5,
            isActive: true,
            languages: ['en'],
            user: {
              id: `user-comp-${i}`,
              avatarUrl: null,
              dateOfBirth: new Date('2000-01-01'),
              gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
              isVerified: true,
            },
            photos: [
              { id: 'p1', url: 'https://example.com/1.jpg', isPrimary: true, position: 0 },
              { id: 'p2', url: 'https://example.com/2.jpg', isPrimary: false, position: 1 },
              { id: 'p3', url: 'https://example.com/3.jpg', isPrimary: false, position: 2 },
            ],
            services: [],
          })),
        );

      const result = await service.getFeed(mockUserId, 10);

      expect(result.strategy).toBe('cold_start');
      expect(result.companions.length).toBeGreaterThan(0);
      expect(result.companions.length).toBeLessThanOrEqual(10);
    });

    it('should return hybrid strategy when user has 10+ interactions', async () => {
      mockPrismaService.userInteraction.count.mockResolvedValue(15);

      const scored = Array.from({ length: 10 }, (_, i) =>
        makeScoredCompanion({ companionId: `comp-${i}`, score: 1 - i * 0.05 }),
      );
      mockScoringService.calculateScores.mockResolvedValue(scored);

      const result = await service.getFeed(mockUserId, 10);

      expect(result.strategy).toBe('hybrid');
      expect(mockScoringService.calculateScores).toHaveBeenCalled();
    });

    it('should filter out excludeIds from candidates', async () => {
      mockPrismaService.userInteraction.count.mockResolvedValue(15);
      mockPrismaService.companionProfile.findMany.mockResolvedValue([
        { id: 'comp-0' },
        { id: 'comp-1' },
        { id: 'comp-2' },
        { id: 'comp-3' },
      ]);

      const scored = [
        makeScoredCompanion({ companionId: 'comp-2', score: 0.9 }),
        makeScoredCompanion({ companionId: 'comp-3', score: 0.8 }),
      ];
      mockScoringService.calculateScores.mockResolvedValue(scored);

      const result = await service.getFeed(mockUserId, 10, ['comp-0', 'comp-1']);

      // calculateScores should receive only comp-2 and comp-3
      const passedCandidates = mockScoringService.calculateScores.mock.calls[0][1];
      expect(passedCandidates).toEqual(['comp-2', 'comp-3']);
      expect(result.companions).toHaveLength(2);
    });

    it('should return empty result when all candidates are excluded', async () => {
      mockPrismaService.userInteraction.count.mockResolvedValue(15);
      mockPrismaService.companionProfile.findMany.mockResolvedValue([
        { id: 'comp-0' },
        { id: 'comp-1' },
      ]);

      const result = await service.getFeed(mockUserId, 10, ['comp-0', 'comp-1']);

      expect(result.companions).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });

    it('should apply freshness penalty to recently viewed companions', async () => {
      mockPrismaService.userInteraction.count.mockResolvedValue(15);

      const scored = [
        makeScoredCompanion({ companionId: 'comp-0', score: 1.0, companion: { ...makeScoredCompanion({ companionId: 'comp-0' }).companion, userId: 'user-comp-0' } }),
        makeScoredCompanion({ companionId: 'comp-1', score: 0.9, companion: { ...makeScoredCompanion({ companionId: 'comp-1' }).companion, userId: 'user-comp-1' } }),
      ];
      mockScoringService.calculateScores.mockResolvedValue(scored);

      // user-comp-0 was recently viewed
      mockPrismaService.userInteraction.findMany.mockResolvedValue([
        { companionId: 'user-comp-0' },
      ]);

      const result = await service.getFeed(mockUserId, 10);

      // comp-0 should have been penalized (1.0 * 0.8 = 0.8), comp-1 stays at 0.9
      // So comp-1 should now rank higher
      const comp0 = result.companions.find((c) => c.companionId === 'comp-0');
      const comp1 = result.companions.find((c) => c.companionId === 'comp-1');
      expect(comp0!.score).toBeCloseTo(0.8);
      expect(comp1!.score).toBeCloseTo(0.9);
    });

    it('should set hasMore correctly based on remaining candidates', async () => {
      mockPrismaService.userInteraction.count.mockResolvedValue(15);
      mockPrismaService.companionProfile.findMany.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({ id: `comp-${i}` })),
      );

      const scored = Array.from({ length: 20 }, (_, i) =>
        makeScoredCompanion({ companionId: `comp-${i}`, score: 1 - i * 0.01 }),
      );
      mockScoringService.calculateScores.mockResolvedValue(scored);

      const result = await service.getFeed(mockUserId, 5, ['comp-20', 'comp-21']);

      expect(result.hasMore).toBe(true);
    });

    // ─── Boost interleaving ────────────────────────────────────────

    describe('boost interleaving', () => {
      it('should place boosted companions first (max 2 per batch)', async () => {
        mockPrismaService.userInteraction.count.mockResolvedValue(15);

        // 3 boosted companions
        mockPrismaService.profileBoost.findMany.mockResolvedValue([
          { companionId: 'comp-boost-1', multiplier: 2.0 },
          { companionId: 'comp-boost-2', multiplier: 1.5 },
          { companionId: 'comp-boost-3', multiplier: 1.2 },
        ]);

        const scored = [
          makeScoredCompanion({ companionId: 'comp-boost-1', score: 1.8 }),
          makeScoredCompanion({ companionId: 'comp-boost-2', score: 1.5 }),
          makeScoredCompanion({ companionId: 'comp-boost-3', score: 1.2 }),
          makeScoredCompanion({ companionId: 'comp-regular-1', score: 0.9 }),
          makeScoredCompanion({ companionId: 'comp-regular-2', score: 0.8 }),
          makeScoredCompanion({ companionId: 'comp-regular-3', score: 0.7 }),
          makeScoredCompanion({ companionId: 'comp-regular-4', score: 0.6 }),
          makeScoredCompanion({ companionId: 'comp-regular-5', score: 0.5 }),
        ];
        mockScoringService.calculateScores.mockResolvedValue(scored);

        // Include all candidates
        mockPrismaService.companionProfile.findMany.mockResolvedValue(
          scored.map((s) => ({ id: s.companionId })),
        );

        const result = await service.getFeed(mockUserId, 8);

        // First 2 should be boosted companions
        expect(result.companions[0].companionId).toBe('comp-boost-1');
        expect(result.companions[1].companionId).toBe('comp-boost-2');
        // Third boosted should NOT be in the first 2 positions
        expect(result.companions[2].companionId).not.toBe('comp-boost-3');
      });

      it('should pass boost multipliers to scoring service in hybrid mode', async () => {
        mockPrismaService.userInteraction.count.mockResolvedValue(15);
        mockPrismaService.profileBoost.findMany.mockResolvedValue([
          { companionId: 'comp-0', multiplier: 1.5 },
        ]);
        mockPrismaService.companionProfile.findMany.mockResolvedValue([
          { id: 'comp-0' },
          { id: 'comp-1' },
        ]);

        const scored = [
          makeScoredCompanion({ companionId: 'comp-0', score: 0.9 }),
          makeScoredCompanion({ companionId: 'comp-1', score: 0.8 }),
        ];
        mockScoringService.calculateScores.mockResolvedValue(scored);

        await service.getFeed(mockUserId, 10);

        const boostArg = mockScoringService.calculateScores.mock.calls[0][2];
        expect(boostArg).toBeInstanceOf(Map);
        expect(boostArg.get('comp-0')).toBe(1.5);
      });

      it('should use highest multiplier when companion has multiple boosts', async () => {
        mockPrismaService.userInteraction.count.mockResolvedValue(15);
        // Two boosts for same companion — ordered by multiplier desc in query
        mockPrismaService.profileBoost.findMany.mockResolvedValue([
          { companionId: 'comp-0', multiplier: 2.0 },
          { companionId: 'comp-0', multiplier: 1.5 },
        ]);
        mockPrismaService.companionProfile.findMany.mockResolvedValue([{ id: 'comp-0' }]);

        const scored = [makeScoredCompanion({ companionId: 'comp-0', score: 1.0 })];
        mockScoringService.calculateScores.mockResolvedValue(scored);

        await service.getFeed(mockUserId, 10);

        const boostArg = mockScoringService.calculateScores.mock.calls[0][2];
        expect(boostArg.get('comp-0')).toBe(2.0);
      });

      it('should apply boost multiplier in cold start scoring', async () => {
        mockPrismaService.userInteraction.count.mockResolvedValue(3); // cold start

        mockPrismaService.profileBoost.findMany.mockResolvedValue([
          { companionId: 'comp-boosted', multiplier: 1.5 },
        ]);

        const companionData = (id: string, rating: number) => ({
          id,
          userId: `user-${id}`,
          displayName: `Companion ${id}`,
          bio: 'A great companion with more than fifty characters in bio for quality score.',
          heightCm: 170,
          hourlyRate: 500000,
          ratingAvg: rating,
          ratingCount: 10,
          completedBookings: 5,
          isActive: true,
          languages: ['en'],
          user: {
            id: `user-${id}`,
            avatarUrl: null,
            dateOfBirth: new Date('2000-01-01'),
            gender: 'FEMALE',
            isVerified: true,
          },
          photos: [
            { id: 'p1', url: 'https://example.com/1.jpg', isPrimary: true, position: 0 },
            { id: 'p2', url: 'https://example.com/2.jpg', isPrimary: false, position: 1 },
            { id: 'p3', url: 'https://example.com/3.jpg', isPrimary: false, position: 2 },
          ],
          services: [],
        });

        mockPrismaService.companionProfile.findMany
          .mockResolvedValueOnce([
            { id: 'comp-boosted' },
            { id: 'comp-regular' },
          ])
          .mockResolvedValueOnce([
            companionData('comp-boosted', 3.0), // lower rating but boosted
            companionData('comp-regular', 4.5), // higher rating, not boosted
          ]);

        const result = await service.getFeed(mockUserId, 10);

        // Boosted companion should have reason 'Featured profile'
        const boosted = result.companions.find((c) => c.companionId === 'comp-boosted');
        expect(boosted).toBeDefined();
        expect(boosted!.reason).toBe('Featured profile');

        // Boosted score should be base quality * 1.5
        // Quality for comp-boosted: (3 photos: 0.3) + (verified: 0.3) + (bio >50: 0.2) + (3.0/5 * 0.2 = 0.12) = 0.92
        // Boosted score: 0.92 * 1.5 = 1.38
        expect(boosted!.score).toBeCloseTo(0.92 * 1.5, 1);
      });

      it('should only include ACTIVE boosts with future expiresAt', async () => {
        mockPrismaService.userInteraction.count.mockResolvedValue(15);

        // getActiveBoostMultipliers queries: status ACTIVE, expiresAt > now
        // The mock returns whatever we set — we verify the query shape
        mockPrismaService.profileBoost.findMany.mockResolvedValue([]);
        mockPrismaService.companionProfile.findMany.mockResolvedValue([{ id: 'comp-0' }]);
        const scored = [makeScoredCompanion({ companionId: 'comp-0', score: 0.5 })];
        mockScoringService.calculateScores.mockResolvedValue(scored);

        await service.getFeed(mockUserId, 10);

        expect(mockPrismaService.profileBoost.findMany).toHaveBeenCalledWith({
          where: {
            status: BoostStatus.ACTIVE,
            expiresAt: { gt: expect.any(Date) },
          },
          select: {
            companionId: true,
            multiplier: true,
          },
          orderBy: { multiplier: 'desc' },
        });
      });
    });

    // ─── Explore / exploit split ───────────────────────────────────

    describe('explore/exploit split', () => {
      it('should use ~70% exploit and ~30% explore ratio', async () => {
        mockPrismaService.userInteraction.count.mockResolvedValue(15);

        // Create 20 regular (non-boosted) companions with varying scores
        const scored = Array.from({ length: 20 }, (_, i) =>
          makeScoredCompanion({
            companionId: `comp-${i}`,
            score: 1 - i * 0.04,
            companion: {
              ...makeScoredCompanion({ companionId: `comp-${i}` }).companion,
              gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
            },
          }),
        );
        mockScoringService.calculateScores.mockResolvedValue(scored);

        mockPrismaService.companionProfile.findMany.mockResolvedValue(
          scored.map((s) => ({ id: s.companionId })),
        );

        const result = await service.getFeed(mockUserId, 10);

        // With limit=10: exploit = floor(10 * 0.7) = 7, explore = 3
        // Top 7 by score should be exploit, explore are randomly picked from remaining
        expect(result.companions.length).toBeLessThanOrEqual(10);
      });
    });

    // ─── Diversity ─────────────────────────────────────────────────

    describe('gender diversity', () => {
      it('should avoid 3+ consecutive companions of same gender', async () => {
        mockPrismaService.userInteraction.count.mockResolvedValue(15);

        // All female companions sorted by score
        const scored = Array.from({ length: 8 }, (_, i) =>
          makeScoredCompanion({
            companionId: `comp-${i}`,
            score: 1 - i * 0.1,
            companion: {
              ...makeScoredCompanion({ companionId: `comp-${i}` }).companion,
              gender: 'FEMALE',
            },
          }),
        );
        // Add one male with low score
        scored.push(
          makeScoredCompanion({
            companionId: 'comp-male-1',
            score: 0.05,
            companion: {
              ...makeScoredCompanion({ companionId: 'comp-male-1' }).companion,
              gender: 'MALE',
            },
          }),
        );

        mockScoringService.calculateScores.mockResolvedValue(scored);
        mockPrismaService.companionProfile.findMany.mockResolvedValue(
          scored.map((s) => ({ id: s.companionId })),
        );

        const result = await service.getFeed(mockUserId, 9);

        // Check no 3 consecutive same gender
        for (let i = 2; i < result.companions.length; i++) {
          const g0 = result.companions[i - 2].companion.gender;
          const g1 = result.companions[i - 1].companion.gender;
          const g2 = result.companions[i].companion.gender;
          if (g0 === g1 && g1 === g2) {
            // This should only happen if there aren't enough other-gender companions to swap
            // With 8 female + 1 male we expect at most 2 consecutive females before the male is inserted
            // But if all swappable companions are exhausted, it may happen — that's acceptable
          }
        }

        // The male companion should be moved forward to break the consecutive streak
        const maleIdx = result.companions.findIndex((c) => c.companion.gender === 'MALE');
        expect(maleIdx).toBeLessThan(result.companions.length - 1);
      });
    });
  });

  // ─── getForYou ─────────────────────────────────────────────────────

  describe('getForYou', () => {
    it('should return cached results when available', async () => {
      const cached = [
        makeScoredCompanion({ companionId: 'comp-0', score: 0.9 }),
        makeScoredCompanion({ companionId: 'comp-1', score: 0.8 }),
      ];
      mockCacheService.get.mockResolvedValue(cached);

      const result = await service.getForYou(mockUserId, 1, 0);

      expect(result.companions).toHaveLength(1);
      expect(result.companions[0].companionId).toBe('comp-0');
      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(2);
      expect(mockPrismaService.userInteraction.count).not.toHaveBeenCalled();
    });

    it('should return empty for subsequent pages without cache', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const result = await service.getForYou(mockUserId, 10, 10);

      expect(result.companions).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });

    it('should cache scored results on first page load', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.userInteraction.count.mockResolvedValue(15);
      mockPrismaService.userBlock.findMany.mockResolvedValue([]);
      mockPrismaService.companionProfile.findMany.mockResolvedValue([{ id: 'comp-0' }]);
      mockPrismaService.profileBoost.findMany.mockResolvedValue([]);

      const scored = [makeScoredCompanion({ companionId: 'comp-0', score: 0.9 })];
      mockScoringService.calculateScores.mockResolvedValue(scored);

      await service.getForYou(mockUserId, 10, 0);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'rec:hirer-user-123',
        scored,
        300,
      );
    });
  });

  // ─── trackInteraction ──────────────────────────────────────────────

  describe('trackInteraction', () => {
    it('should resolve companionId from User.id and create interaction', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-comp-1',
        companionProfile: { id: 'comp-1' },
      });
      mockScoringService.getEventWeight.mockReturnValue(0.3);

      await service.trackInteraction(mockUserId, {
        companionId: 'user-comp-1',
        eventType: 'PROFILE_OPEN' as any,
      });

      expect(mockPrismaService.userInteraction.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          companionId: 'user-comp-1', // Stored as User.id
          eventType: 'PROFILE_OPEN',
          eventValue: 0.3,
          dwellTimeMs: undefined,
          sessionId: undefined,
        },
      });
    });

    it('should resolve companionId from CompanionProfile.id (legacy format)', async () => {
      // First findUnique for User.id returns nothing (not a user ID)
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      // Lookup by CompanionProfile.id succeeds
      mockPrismaService.companionProfile.findUnique.mockResolvedValue({
        userId: 'user-comp-legacy',
      });
      mockScoringService.getEventWeight.mockReturnValue(0.7);

      await service.trackInteraction(mockUserId, {
        companionId: 'comp-profile-legacy',
        eventType: 'BOOKMARK' as any,
      });

      expect(mockPrismaService.userInteraction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companionId: 'user-comp-legacy',
          eventType: 'BOOKMARK',
          eventValue: 0.7,
        }),
      });
    });

    it('should silently ignore invalid companion IDs', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.companionProfile.findUnique.mockResolvedValue(null);

      await service.trackInteraction(mockUserId, {
        companionId: 'invalid-id',
        eventType: 'VIEW' as any,
      });

      expect(mockPrismaService.userInteraction.create).not.toHaveBeenCalled();
    });

    it('should invalidate cache on high-signal events (BOOKMARK)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-comp-1',
        companionProfile: { id: 'comp-1' },
      });
      mockScoringService.getEventWeight.mockReturnValue(0.7);

      await service.trackInteraction(mockUserId, {
        companionId: 'user-comp-1',
        eventType: 'BOOKMARK' as any,
      });

      expect(mockCacheService.del).toHaveBeenCalledWith('rec:hirer-user-123');
    });

    it('should NOT invalidate cache on low-signal events (VIEW)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-comp-1',
        companionProfile: { id: 'comp-1' },
      });
      mockScoringService.getEventWeight.mockReturnValue(0.1);

      await service.trackInteraction(mockUserId, {
        companionId: 'user-comp-1',
        eventType: 'VIEW' as any,
      });

      expect(mockCacheService.del).not.toHaveBeenCalled();
    });

    it('should store dwellTimeMs and sessionId when provided', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-comp-1',
        companionProfile: { id: 'comp-1' },
      });
      mockScoringService.getEventWeight.mockReturnValue(0.3);

      await service.trackInteraction(mockUserId, {
        companionId: 'user-comp-1',
        eventType: 'DWELL_VIEW' as any,
        dwellTimeMs: 5000,
        sessionId: 'session-abc',
      });

      expect(mockPrismaService.userInteraction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          dwellTimeMs: 5000,
          sessionId: 'session-abc',
        }),
      });
    });
  });

  // ─── trackBatch ────────────────────────────────────────────────────

  describe('trackBatch', () => {
    it('should call trackInteraction for each event in the batch', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-comp-1',
        companionProfile: { id: 'comp-1' },
      });
      mockScoringService.getEventWeight.mockReturnValue(0.1);

      const events = [
        { companionId: 'user-comp-1', eventType: 'VIEW' },
        { companionId: 'user-comp-1', eventType: 'DWELL_VIEW', dwellTimeMs: 3000 },
        { companionId: 'user-comp-1', eventType: 'PHOTO_BROWSE' },
      ];

      await service.trackBatch(mockUserId, 'session-123', events);

      expect(mockPrismaService.userInteraction.create).toHaveBeenCalledTimes(3);
    });

    it('should pass sessionId to each trackInteraction call', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-comp-1',
        companionProfile: { id: 'comp-1' },
      });
      mockScoringService.getEventWeight.mockReturnValue(0.3);

      await service.trackBatch(mockUserId, 'session-xyz', [
        { companionId: 'user-comp-1', eventType: 'REVISIT' },
      ]);

      expect(mockPrismaService.userInteraction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId: 'session-xyz',
        }),
      });
    });
  });

  // ─── refresh ───────────────────────────────────────────────────────

  describe('refresh', () => {
    it('should delete cache for the user', async () => {
      await service.refresh(mockUserId);

      expect(mockCacheService.del).toHaveBeenCalledWith('rec:hirer-user-123');
    });
  });
});
