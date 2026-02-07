import { DateUtils } from "@/common/utils/date.utils";
import { StringUtils } from "@/common/utils/string.utils";
import {
  CACHE_KEYS,
  CACHE_TTL,
  CachePatternsService,
} from "@/modules/cache/cache-patterns.service";
import { WalletService } from "@/modules/wallet/wallet.service";
import { PrismaService } from "@/prisma/prisma.service";
import {
  BoostStatus,
  BoostTier,
  CompanionAvailability,
  Prisma,
  UserRole,
  VerificationStatus,
} from "@generated/client";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { BoostPaymentCompletedEvent, WALLET_EVENTS } from '@/modules/wallet/events/wallet.events';
import {
  ActiveBoostInfo,
  BoostHistoryItem,
  BoostPricing,
  BoostPurchaseResult,
  BoostTierEnum,
  BrowseCompanionsQueryDto,
  CompanionListItem,
  CompanionProfileResponse,
  DayAvailabilityDetail,
  PhotoVerificationResponse,
  PurchaseBoostDto,
  SubmitPhotoVerificationDto,
  UpdateAvailabilityDto,
  UpdateCompanionProfileDto,
} from "../dto/companion.dto";

@Injectable()
export class CompanionsService {
  private readonly logger = new Logger(CompanionsService.name);

  private readonly r2DevUrlRe = /^https:\/\/pub-[a-z0-9]+\.r2\.dev\//;
  private readonly r2PublicUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cachePatterns: CachePatternsService,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
  ) {
    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL', '');
    this.r2PublicUrl = publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`;
  }

  /** Rewrite legacy R2 dev URLs to the custom domain */
  private normalizeUrl(url: string | null | undefined): string | null {
    if (!url || !this.r2PublicUrl) return url ?? null;
    return url.replace(this.r2DevUrlRe, this.r2PublicUrl);
  }

  @OnEvent(WALLET_EVENTS.BOOST_PAYMENT_COMPLETED)
  async handleBoostPaymentCompleted(event: BoostPaymentCompletedEvent): Promise<void> {
    await this.activateBoost(event.boostId);
  }

  /**
   * Browse companions with filters
   * Optionally filters out blocked users when userId is provided
   * Note: Location-based filtering requires companion location data in the database.
   * Currently, location fields (latitude, longitude) are stored on bookings, not user profiles.
   * To enable location-based discovery, add locationLat/locationLng to User or CompanionProfile model.
   */
  async browseCompanions(query: BrowseCompanionsQueryDto, userId?: string) {
    const {
      occasionId,
      minPrice,
      maxPrice,
      rating,
      verified,
      province,
      // Lat/lng params are accepted for future GPS-based filtering
      latitude,
      longitude,
      radiusKm = 25,
      page = 1,
      limit = 20,
      sort = "popular",
    } = query;

    // Get blocked user IDs if user is authenticated
    let blockedUserIds: string[] = [];
    if (userId) {
      const blocks = await this.prisma.userBlock.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedId: userId }],
        },
        select: { blockerId: true, blockedId: true },
      });

      const blockedSet = new Set<string>();
      blocks.forEach((b) => {
        blockedSet.add(b.blockerId);
        blockedSet.add(b.blockedId);
      });
      blockedSet.delete(userId); // Don't exclude self
      blockedUserIds = Array.from(blockedSet);
    }

    const where: Prisma.CompanionProfileWhereInput = {
      isActive: true,
      isHidden: false,
      user: {
        status: "ACTIVE",
        // Exclude blocked users from results
        ...(blockedUserIds.length > 0 && { id: { notIn: blockedUserIds } }),
      },
    };

    if (occasionId) {
      where.services = {
        some: {
          occasionId: occasionId,
          isEnabled: true,
        },
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.hourlyRate = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      };
    }

    if (rating !== undefined) {
      where.ratingAvg = { gte: rating };
    }

    if (verified !== undefined) {
      if (verified) {
        where.verificationStatus = VerificationStatus.VERIFIED;
      }
    }

    // Province-based location filtering
    if (province) {
      where.province = province;
    }

    // Build orderBy
    let orderBy:
      | Prisma.CompanionProfileOrderByWithRelationInput
      | Prisma.CompanionProfileOrderByWithRelationInput[] = {};
    switch (sort) {
      case "rating":
        orderBy = { ratingAvg: "desc" };
        break;
      case "price_asc":
        orderBy = { hourlyRate: "asc" };
        break;
      case "price_desc":
        orderBy = { hourlyRate: "desc" };
        break;
      case "distance":
        // Distance sorting requires location data in schema - fall back to popular
        // TODO: Add locationLat/locationLng to CompanionProfile to enable distance sorting
        orderBy = [{ totalBookings: "desc" }, { ratingAvg: "desc" }];
        break;
      case "popular":
      default:
        orderBy = [{ totalBookings: "desc" }, { ratingAvg: "desc" }];
        break;
    }

    // Get boosted companion IDs to prioritize them in results
    const boostedCompanions = await this.getBoostedCompanionIds();

    const [companions, total] = await Promise.all([
      this.prisma.companionProfile.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              dateOfBirth: true,
              gender: true,
              isVerified: true,
            },
          },
          // Only fetch first 3 photos with minimal fields for list view
          photos: {
            orderBy: { position: "asc" },
            take: 3,
            select: { url: true },
          },
          // Fetch occasion info for list view
          services: {
            where: { isEnabled: true },
            select: {
              occasionId: true,
              occasion: {
                select: {
                  id: true,
                  code: true,
                  nameEn: true,
                  nameVi: true,
                  emoji: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.companionProfile.count({ where }),
    ]);

    let companionList: CompanionListItem[] = companions.map((c) => ({
      id: c.id,
      userId: c.userId,
      displayName: c.user.fullName,
      age: c.user.dateOfBirth
        ? DateUtils.calculateAge(c.user.dateOfBirth as Date)
        : null,
      avatar: this.normalizeUrl(
        c.user.avatarUrl || (c.photos.length > 0 ? c.photos[0].url : null),
      ),
      gender: c.user.gender,
      hourlyRate: c.hourlyRate,
      halfDayRate: c.halfDayRate,
      fullDayRate: c.fullDayRate,
      rating: Number(c.ratingAvg),
      reviewCount: c.ratingCount,
      isVerified: c.verificationStatus === VerificationStatus.VERIFIED,
      isFeatured: c.isFeatured,
      isBoosted: boostedCompanions.has(c.id),
      boostMultiplier: boostedCompanions.get(c.id) || null,
      services: c.services.map((s) => ({
        id: s.occasion.id,
        code: s.occasion.code,
        name: s.occasion.nameEn, // TODO: Use language from request
        emoji: s.occasion.emoji,
      })),
      photos: c.photos.map((p) => this.normalizeUrl(p.url)!),
      isAvailable: c.isActive && !c.isHidden,
      distanceKm: null, // Location data not yet available in schema
    }));

    // Re-sort to prioritize boosted profiles (only for popular/default sort)
    // Boosted profiles appear first, sorted by their multiplier (highest first)
    if (sort === "popular" || !sort) {
      companionList = companionList.sort((a, b) => {
        const aMultiplier = a.boostMultiplier || 0;
        const bMultiplier = b.boostMultiplier || 0;

        // If both are boosted, sort by multiplier (higher first)
        if (aMultiplier > 0 && bMultiplier > 0) {
          return bMultiplier - aMultiplier;
        }

        // Boosted profiles come first
        if (aMultiplier > 0) return -1;
        if (bMultiplier > 0) return 1;

        // For non-boosted, maintain original order (by totalBookings/rating)
        return 0;
      });
    }

    return {
      companions: companionList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get companion profile by ID (public view)
   */
  async getCompanionProfile(
    companionId: string,
  ): Promise<CompanionProfileResponse> {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { id: companionId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            dateOfBirth: true,
            gender: true,
            isVerified: true,
            createdAt: true,
          },
        },
        photos: {
          orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        },
        services: {
          where: { isEnabled: true },
          include: {
            occasion: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameVi: true,
                emoji: true,
              },
            },
          },
        },
        availability: {
          where: { isAvailable: true },
        },
      },
    });

    if (!companion) {
      throw new NotFoundException("Companion not found");
    }

    if (!companion.isActive || companion.isHidden) {
      throw new NotFoundException("Companion profile not available");
    }

    // Fetch reviews separately using the Review model
    const reviews = await this.prisma.review.findMany({
      where: {
        revieweeId: companion.userId,
        isVisible: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        reviewer: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
        booking: {
          select: {
            occasionType: true,
          },
        },
      },
    });

    return {
      id: companion.id,
      userId: companion.userId,
      displayName: companion.displayName || "Anonymous",
      age: companion.user.dateOfBirth
        ? DateUtils.calculateAge(companion.user.dateOfBirth)
        : null,
      bio: companion.bio,
      avatar: this.normalizeUrl(companion.photos[0]?.url || companion.user.avatarUrl),
      photos: companion.photos.map((p) => this.normalizeUrl(p.url)!),
      gender: companion.user.gender,
      heightCm: companion.heightCm,
      languages: companion.languages,
      hourlyRate: companion.hourlyRate,
      halfDayRate: companion.halfDayRate,
      fullDayRate: companion.fullDayRate,
      rating: Number(companion.ratingAvg),
      reviewCount: companion.ratingCount,
      responseRate: companion.responseRate,
      acceptanceRate: companion.acceptanceRate,
      completedBookings: companion.completedBookings,
      isVerified: companion.verificationStatus === VerificationStatus.VERIFIED,
      isFeatured: companion.isFeatured,
      services: companion.services.map((s: any) => ({
        occasionId: s.occasionId,
        occasion: {
          id: s.occasion.id,
          code: s.occasion.code,
          name: s.occasion.nameEn, // TODO: Use language from request
          emoji: s.occasion.emoji,
        },
        description: s.description,
        priceAdjustment: s.priceAdjustment,
      })),
      memberSince: this.formatDateToString(companion.user.createdAt),
      reviews: reviews.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        occasion: r.booking.occasion
          ? {
            id: r.booking.occasion.id,
            code: r.booking.occasion.code,
            name: r.booking.occasion.nameEn,
            emoji: r.booking.occasion.emoji,
          }
          : null,
        date: this.formatDateToString(r.createdAt),
        reviewer: {
          name: r.reviewer.fullName || "Anonymous",
          avatar: this.normalizeUrl(r.reviewer.avatarUrl),
        },
      })),
      availability: {
        nextAvailable: null, // TODO: Calculate
        thisWeek: this.getThisWeekAvailability(companion.availability),
      },
    };
  }

  /**
   * Get companion availability for date range
   */
  async getCompanionAvailability(
    companionId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    companionId: string;
    timezone: string;
    availability: DayAvailabilityDetail[];
  }> {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { id: companionId },
      include: {
        availability: true,
      },
    });

    if (!companion) {
      throw new NotFoundException("Companion not found");
    }

    // Get bookings for the date range
    const bookings = await this.prisma.booking.findMany({
      where: {
        companionId: companion.userId,
        startDatetime: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        status: {
          in: ["CONFIRMED", "ACTIVE"],
        },
      },
      select: {
        startDatetime: true,
        endDatetime: true,
      },
    });

    const availability: DayAvailabilityDetail[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const dateStr = d.toISOString().split("T")[0];

      // Find recurring availability for this day
      const dayAvailability = companion.availability.filter(
        (a) => a.isRecurring && a.dayOfWeek === dayOfWeek && a.isAvailable,
      );

      // Find specific date exceptions
      const specificDate = companion.availability.find(
        (a) =>
          !a.isRecurring &&
          a.specificDate?.toISOString().split("T")[0] === dateStr,
      );

      // Get booked slots for this date
      const bookedForDate = bookings.filter(
        (b) => b.startDatetime.toISOString().split("T")[0] === dateStr,
      );

      const slots: { start: string; end: string }[] = dayAvailability.map(
        (a) => ({
          start: a.startTime,
          end: a.endTime,
        }),
      );

      const bookedSlots = bookedForDate.map((b) => ({
        start: b.startDatetime.toISOString().split("T")[1].substring(0, 5),
        end: b.endDatetime.toISOString().split("T")[1].substring(0, 5),
      }));

      availability.push({
        date: dateStr,
        isAvailable: specificDate ? specificDate.isAvailable : slots.length > 0,
        slots,
        bookedSlots,
      });
    }

    return {
      companionId,
      timezone: "Asia/Ho_Chi_Minh",
      availability,
    };
  }

  /**
   * Update companion profile
   */
  async updateCompanionProfile(userId: string, dto: UpdateCompanionProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companionProfile: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role !== UserRole.COMPANION) {
      throw new BadRequestException("User is not a companion");
    }

    if (!user.companionProfile) {
      throw new NotFoundException("Companion profile not found");
    }

    const updated = await this.prisma.companionProfile.update({
      where: { userId },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.heightCm !== undefined && { heightCm: dto.heightCm }),
        ...(dto.languages !== undefined && { languages: dto.languages }),
        ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
        ...(dto.halfDayRate !== undefined && { halfDayRate: dto.halfDayRate }),
        ...(dto.fullDayRate !== undefined && { fullDayRate: dto.fullDayRate }),
      },
    });

    // Invalidate the exact cached query for getMyCompanionProfile
    await this.prisma.invalidateExactQuery('user', 'findUnique', this.myProfileQueryArgs(userId));

    return updated;
  }

  /**
   * Get own companion profile (authenticated)
   */
  /**
   * Build the query args for getMyCompanionProfile.
   * Shared between the query and cache invalidation to ensure key match.
   */
  private myProfileQueryArgs(userId: string) {
    return {
      where: { id: userId },
      include: {
        companionProfile: {
          include: {
            photos: {
              orderBy: { position: "asc" as const },
            },
            services: {
              include: {
                occasion: true,
              },
            },
            availability: true,
            bankAccounts: true,
          },
        },
      },
    };
  }

  async getMyCompanionProfile(userId: string) {
    const user = await this.prisma.user.findUnique(this.myProfileQueryArgs(userId));

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.companionProfile) {
      throw new NotFoundException("Companion profile not found");
    }

    const profile = user.companionProfile;

    return {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName || user.fullName,
      bio: profile.bio,
      heightCm: profile.heightCm,
      languages: profile.languages,
      hourlyRate: profile.hourlyRate,
      halfDayRate: profile.halfDayRate,
      fullDayRate: profile.fullDayRate,
      photos: profile.photos.map((p) => ({
        id: p.id,
        url: this.normalizeUrl(p.url)!,
        position: p.position,
        isVerified: p.isVerified,
        isPrimary: p.isPrimary,
      })),
      services: profile.services.map((s) => ({
        id: s.id,
        occasionId: s.occasionId,
        occasion: {
          id: s.occasion.id,
          code: s.occasion.code,
          name: s.occasion.nameEn, // TODO: Use language from request
          emoji: s.occasion.emoji,
        },
        description: s.description,
        priceAdjustment: s.priceAdjustment,
        isEnabled: s.isEnabled,
      })),
      verificationStatus: profile.verificationStatus,
      isFeatured: profile.isFeatured,
      isActive: profile.isActive,
      isHidden: profile.isHidden,
      stats: {
        rating: Number(profile.ratingAvg),
        reviewCount: profile.ratingCount,
        responseRate: profile.responseRate,
        acceptanceRate: profile.acceptanceRate,
        totalBookings: profile.totalBookings,
        completedBookings: profile.completedBookings,
      },
      bankAccounts: profile.bankAccounts.map((b) => ({
        id: b.id,
        bankName: b.bankName,
        accountNumber: StringUtils.maskSensitiveData(b.accountNumber, 4),
        accountHolder: b.accountHolder,
        isPrimary: b.isPrimary,
        isVerified: b.isVerified,
      })),
    };
  }

  /**
   * Get own companion availability (authenticated)
   */
  async getMyAvailability(userId: string) {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
      include: {
        availability: {
          where: { isRecurring: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    if (!profile) {
      throw new NotFoundException("Companion profile not found");
    }

    return {
      recurring: profile.availability.map((a) => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isAvailable: a.isAvailable,
      })),
    };
  }

  /**
   * Update availability
   */
  async updateAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Companion profile not found");
    }

    // Delete existing recurring availability
    await this.prisma.companionAvailability.deleteMany({
      where: {
        companionId: profile.id,
        isRecurring: true,
      },
    });

    // Create new recurring availability
    const recurringData = dto.recurring.map((slot) => ({
      companionId: profile.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isRecurring: true,
      isAvailable: true,
    }));

    await this.prisma.companionAvailability.createMany({
      data: recurringData,
    });

    // Handle exceptions if provided - batch fetch to avoid N+1
    if (dto.exceptions && dto.exceptions.length > 0) {
      const exceptionDates = dto.exceptions.map((e) => new Date(e.date));

      // Fetch all existing exceptions in a single query
      const existingExceptions =
        await this.prisma.companionAvailability.findMany({
          where: {
            companionId: profile.id,
            isRecurring: false,
            specificDate: { in: exceptionDates },
          },
        });

      // Create a map for quick lookup
      const existingMap = new Map(
        existingExceptions.map((e) => [
          e.specificDate?.toISOString().split("T")[0],
          e,
        ]),
      );

      // Separate into updates and creates
      const toUpdate: { id: string; isAvailable: boolean }[] = [];
      const toCreate: {
        companionId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isRecurring: boolean;
        specificDate: Date;
        isAvailable: boolean;
      }[] = [];

      for (const exception of dto.exceptions) {
        const dateKey = new Date(exception.date).toISOString().split("T")[0];
        const existing = existingMap.get(dateKey);

        if (existing) {
          toUpdate.push({ id: existing.id, isAvailable: exception.available });
        } else {
          toCreate.push({
            companionId: profile.id,
            dayOfWeek: new Date(exception.date).getDay(),
            startTime: "00:00",
            endTime: "23:59",
            isRecurring: false,
            specificDate: new Date(exception.date),
            isAvailable: exception.available,
          });
        }
      }

      // Batch update existing exceptions
      // Note: Using Promise.all with individual updates because each exception
      // has a different isAvailable value. Prisma's updateMany doesn't support
      // different values per record. This approach sends updates in parallel.
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((u) =>
            this.prisma.companionAvailability.update({
              where: { id: u.id },
              data: { isAvailable: u.isAvailable },
            }),
          ),
        );
      }

      // Batch create new exceptions
      if (toCreate.length > 0) {
        await this.prisma.companionAvailability.createMany({
          data: toCreate,
        });
      }
    }

    // Invalidate the exact cached query for getMyCompanionProfile
    await this.prisma.invalidateExactQuery('user', 'findUnique', this.myProfileQueryArgs(userId));
    await this.prisma.invalidateModelCache('companionAvailability');

    return { success: true, message: "Availability updated" };
  }

  /**
   * Get companion reviews
   */
  async getCompanionReviews(
    companionId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { id: companionId },
    });

    if (!companion) {
      throw new NotFoundException("Companion not found");
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          revieweeId: companion.userId,
          isVisible: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reviewer: {
            select: {
              fullName: true,
              avatarUrl: true,
            },
          },
          booking: {
            select: {
              occasionType: true,
            },
          },
        },
      }),
      this.prisma.review.count({
        where: {
          revieweeId: companion.userId,
          isVisible: true,
        },
      }),
    ]);

    // Calculate rating breakdown
    const ratingBreakdown = await this.prisma.review.groupBy({
      by: ["rating"],
      where: { revieweeId: companion.userId, isVisible: true },
      _count: { rating: true },
    });

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingBreakdown.forEach((r) => {
      breakdown[r.rating] = r._count.rating;
    });

    return {
      averageRating: Number(companion.ratingAvg),
      total: total,
      ratingDistribution: breakdown,
      reviews: reviews.map((r) => {
        // Handle both Date objects and string dates (from Redis cache)
        const createdAt =
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt);

        // Mask reviewer name for privacy (e.g., "Nguyễn Văn A" → "N****A")
        const maskName = (name: string | null): string => {
          if (!name || name.length < 2) return "A****";
          const firstChar = name.charAt(0);
          const lastChar = name.charAt(name.length - 1);
          return `${firstChar}****${lastChar}`;
        };

        return {
          id: r.id,
          bookingId: r.bookingId,
          reviewerId: r.reviewerId,
          rating: r.rating,
          comment: r.comment,
          tags: r.tags,
          createdAt,
          reviewer: {
            id: r.reviewerId,
            fullName: maskName(r.reviewer.fullName),
            avatarUrl: this.normalizeUrl(r.reviewer.avatarUrl),
          },
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Add a photo to companion profile
   */
  private readonly MAX_PHOTOS = 6;

  async addPhoto(userId: string, photoUrl: string, isPrimary: boolean = false) {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
      include: { photos: true },
    });

    if (!profile) {
      throw new NotFoundException("Companion profile not found");
    }

    if (profile.photos.length >= this.MAX_PHOTOS) {
      throw new BadRequestException(`Maximum ${this.MAX_PHOTOS} photos allowed`);
    }

    const nextPosition = profile.photos.length;

    // If this is primary, unset other primary photos
    if (isPrimary) {
      await this.prisma.companionPhoto.updateMany({
        where: { companionId: profile.id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const photo = await this.prisma.companionPhoto.create({
      data: {
        companionId: profile.id,
        url: photoUrl,
        position: nextPosition,
        isPrimary: isPrimary || nextPosition === 0,
      },
    });

    // Invalidate the exact cached query for getMyCompanionProfile
    await this.prisma.invalidateExactQuery('user', 'findUnique', this.myProfileQueryArgs(userId));

    return photo;
  }

  /**
   * Remove a photo from companion profile
   */
  async removePhoto(userId: string, photoId: string) {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Companion profile not found");
    }

    const photo = await this.prisma.companionPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.companionId !== profile.id) {
      throw new NotFoundException("Photo not found");
    }

    await this.prisma.companionPhoto.delete({
      where: { id: photoId },
    });

    // Invalidate the exact cached query for getMyCompanionProfile
    await this.prisma.invalidateExactQuery('user', 'findUnique', this.myProfileQueryArgs(userId));

    return { success: true };
  }

  /**
   * Set a photo as the primary profile photo
   */
  async setPrimaryPhoto(userId: string, photoId: string) {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Companion profile not found");
    }

    const photo = await this.prisma.companionPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.companionId !== profile.id) {
      throw new NotFoundException("Photo not found");
    }

    // Unset current primary, then set the new one
    await this.prisma.companionPhoto.updateMany({
      where: { companionId: profile.id, isPrimary: true },
      data: { isPrimary: false },
    });

    await this.prisma.companionPhoto.update({
      where: { id: photoId },
      data: { isPrimary: true },
    });

    // Invalidate the exact cached query for getMyCompanionProfile
    await this.prisma.invalidateExactQuery('user', 'findUnique', this.myProfileQueryArgs(userId));

    return { success: true };
  }

  /**
   * Update companion services
   */
  async updateServices(
    userId: string,
    services: {
      occasionId: string;
      description?: string;
      priceAdjustment?: number;
      isEnabled?: boolean;
    }[],
  ) {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Companion profile not found");
    }

    // Upsert each service
    for (const service of services) {
      await this.prisma.companionService.upsert({
        where: {
          companionId_occasionId: {
            companionId: profile.id,
            occasionId: service.occasionId,
          },
        },
        create: {
          companionId: profile.id,
          occasionId: service.occasionId,
          description: service.description,
          priceAdjustment: service.priceAdjustment ?? 0,
          isEnabled: service.isEnabled ?? true,
        },
        update: {
          description: service.description,
          priceAdjustment: service.priceAdjustment,
          isEnabled: service.isEnabled,
        },
      });
    }

    // Invalidate the exact cached query for getMyCompanionProfile
    await this.prisma.invalidateExactQuery('user', 'findUnique', this.myProfileQueryArgs(userId));

    // Return updated services with occasion data
    const updatedServices = await this.prisma.companionService.findMany({
      where: { companionId: profile.id },
      include: { occasion: true },
    });

    return updatedServices;
  }

  private getThisWeekAvailability(
    availability: CompanionAvailability[],
  ): { date: string; slots: string[] }[] {
    const result: { date: string; slots: string[] }[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      const dateStr = date.toISOString().split("T")[0];

      const daySlots = availability
        .filter(
          (a) => a.isRecurring && a.dayOfWeek === dayOfWeek && a.isAvailable,
        )
        .map((a) => `${a.startTime}-${a.endTime}`);

      if (daySlots.length > 0) {
        result.push({ date: dateStr, slots: daySlots });
      }
    }

    return result;
  }

  /**
   * Format a date value to YYYY-MM-DD string
   * Handles both Date objects and ISO date strings (from cache)
   */
  private formatDateToString(date: Date | string): string {
    if (typeof date === "string") {
      return date.split("T")[0];
    }
    return date.toISOString().split("T")[0];
  }

  // ============================================
  // Profile Boost Methods
  // ============================================

  /**
   * Get boost pricing options from database
   */
  async getBoostPricing(): Promise<BoostPricing[]> {
    const tiers = await this.prisma.boostPricingTier.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });

    return tiers.map((t) => ({
      tier: t.tier as unknown as BoostTierEnum,
      name: t.name,
      durationHours: t.durationHours,
      price: t.price,
      multiplier: Number(t.multiplier),
      description: t.description ?? "",
    }));
  }

  /**
   * Get boost pricing for a specific tier
   */
  private async getBoostPricingByTier(tier: BoostTierEnum) {
    return this.prisma.boostPricingTier.findFirst({
      where: { tier: tier as unknown as BoostTier, isActive: true },
    });
  }

  /**
   * Get active boost for a companion
   */
  async getActiveBoost(userId: string): Promise<ActiveBoostInfo | null> {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Companion profile not found");
    }

    const activeBoost = await this.prisma.profileBoost.findFirst({
      where: {
        companionId: profile.id,
        status: BoostStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: "desc" },
    });

    if (!activeBoost) {
      return null;
    }

    const remainingHours = activeBoost.expiresAt
      ? Math.max(
        0,
        Math.ceil(
          (activeBoost.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60),
        ),
      )
      : null;

    return {
      id: activeBoost.id,
      tier: activeBoost.tier as unknown as BoostTierEnum,
      status: activeBoost.status,
      multiplier: Number(activeBoost.multiplier),
      startedAt: activeBoost.startedAt,
      expiresAt: activeBoost.expiresAt,
      remainingHours,
    };
  }

  /**
   * Get boost history for a companion
   */
  async getBoostHistory(
    userId: string,
    limit = 10,
  ): Promise<BoostHistoryItem[]> {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Companion profile not found");
    }

    const boosts = await this.prisma.profileBoost.findMany({
      where: { companionId: profile.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return boosts.map((b) => ({
      id: b.id,
      tier: b.tier as unknown as BoostTierEnum,
      status: b.status,
      price: b.price,
      startedAt: b.startedAt,
      expiresAt: b.expiresAt,
      createdAt: b.createdAt,
    }));
  }

  /**
   * Purchase a profile boost via QR payment
   * Creates a PENDING boost and payment request, returns QR payment data
   */
  async purchaseBoost(
    userId: string,
    dto: PurchaseBoostDto,
  ): Promise<BoostPurchaseResult> {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Companion profile not found");
    }

    // Check if there's already an active boost
    const existingBoost = await this.prisma.profileBoost.findFirst({
      where: {
        companionId: profile.id,
        status: BoostStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingBoost) {
      throw new BadRequestException({
        message:
          "You already have an active boost. Please wait until it expires before purchasing a new one.",
        error: "BOOST_ALREADY_ACTIVE",
        currentBoostExpires: existingBoost.expiresAt,
      });
    }

    // Check if there's already a pending boost with active payment request
    const pendingBoost = await this.prisma.profileBoost.findFirst({
      where: {
        companionId: profile.id,
        status: BoostStatus.PENDING,
        paymentRequests: {
          some: {
            status: 'PENDING',
            expiresAt: { gt: new Date() },
          },
        },
      },
      include: {
        paymentRequests: {
          where: { status: 'PENDING', expiresAt: { gt: new Date() } },
          take: 1,
        },
      },
    });

    if (pendingBoost) {
      // Reuse existing pending boost — createBoostPaymentRequest is idempotent
      const paymentData = await this.walletService.createBoostPaymentRequest(
        userId,
        pendingBoost.id,
        pendingBoost.price,
      );
      return {
        boostId: pendingBoost.id,
        tier: pendingBoost.tier as unknown as BoostTierEnum,
        price: pendingBoost.price,
        message: `You have a pending payment. Please complete it to activate your boost.`,
        paymentRequestId: paymentData.id,
        code: paymentData.code,
        qrUrl: paymentData.qrUrl,
        deeplinks: paymentData.deeplinks,
        accountInfo: paymentData.accountInfo,
        expiresAt: paymentData.expiresAt,
      };
    }

    const pricing = await this.getBoostPricingByTier(dto.tier);
    if (!pricing) {
      throw new BadRequestException("Invalid boost tier");
    }

    // Create boost with PENDING status (activated by webhook on payment)
    const boost = await this.prisma.profileBoost.create({
      data: {
        companionId: profile.id,
        tier: dto.tier as unknown as BoostTier,
        status: BoostStatus.PENDING,
        multiplier: pricing.multiplier,
        price: pricing.price,
      },
    });

    // Create SePay payment request
    const paymentData = await this.walletService.createBoostPaymentRequest(
      userId,
      boost.id,
      pricing.price,
    );

    this.logger.log(
      `Pending boost created for companion ${profile.id}: ${dto.tier} tier, boost ID ${boost.id}`,
    );

    return {
      boostId: boost.id,
      tier: dto.tier,
      price: pricing.price,
      message: `Please complete payment to activate your ${pricing.name}`,
      paymentRequestId: paymentData.id,
      code: paymentData.code,
      qrUrl: paymentData.qrUrl,
      deeplinks: paymentData.deeplinks,
      accountInfo: paymentData.accountInfo,
      expiresAt: paymentData.expiresAt,
    };
  }

  /**
   * Activate a boost after successful payment
   * Called by the payment webhook handler
   */
  async activateBoost(boostId: string): Promise<void> {
    const boost = await this.prisma.profileBoost.findUnique({
      where: { id: boostId },
    });

    if (!boost) {
      this.logger.warn(`Boost not found for activation: ${boostId}`);
      return;
    }

    if (boost.status !== BoostStatus.PENDING) {
      this.logger.warn(
        `Cannot activate boost ${boostId}: status is ${boost.status}, expected PENDING`,
      );
      return;
    }

    const pricing = await this.getBoostPricingByTier(boost.tier as unknown as BoostTierEnum);
    if (!pricing) {
      this.logger.error(
        `Invalid boost tier for boost ${boostId}: ${boost.tier}`,
      );
      return;
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + pricing.durationHours * 60 * 60 * 1000,
    );

    // Optimistic concurrency: only activate if still PENDING (prevents double-activation)
    const updated = await this.prisma.profileBoost.updateMany({
      where: {
        id: boostId,
        status: BoostStatus.PENDING,
      },
      data: {
        status: BoostStatus.ACTIVE,
        startedAt: now,
        expiresAt,
      },
    });

    if (updated.count === 0) {
      this.logger.warn(`Boost ${boostId} already activated by concurrent request`);
      return;
    }

    this.logger.log(
      `Profile boost ${boostId} activated, expires ${expiresAt.toISOString()}`,
    );
  }

  /**
   * Get boost by ID (for payment verification)
   */
  async getBoostById(boostId: string) {
    return this.prisma.profileBoost.findUnique({
      where: { id: boostId },
      include: {
        companion: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });
  }

  /**
   * Cancel an active boost (no refund)
   */
  async cancelBoost(
    userId: string,
    boostId: string,
  ): Promise<{ success: boolean; message: string }> {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Companion profile not found");
    }

    const boost = await this.prisma.profileBoost.findFirst({
      where: {
        id: boostId,
        companionId: profile.id,
        status: BoostStatus.ACTIVE,
      },
    });

    if (!boost) {
      throw new NotFoundException("Active boost not found");
    }

    await this.prisma.profileBoost.update({
      where: { id: boostId },
      data: { status: BoostStatus.CANCELLED },
    });

    this.logger.log(
      `Profile boost ${boostId} cancelled by companion ${profile.id}`,
    );

    return {
      success: true,
      message: "Boost has been cancelled. No refund will be provided.",
    };
  }

  /**
   * Expire old boosts (should be called by a cron job)
   */
  async expireOldBoosts(): Promise<{ count: number }> {
    const result = await this.prisma.profileBoost.updateMany({
      where: {
        status: BoostStatus.ACTIVE,
        expiresAt: { lte: new Date() },
      },
      data: { status: BoostStatus.EXPIRED },
    });

    // Also expire old pending boosts (older than 15 minutes)
    const pendingResult = await this.prisma.profileBoost.updateMany({
      where: {
        status: BoostStatus.PENDING,
        createdAt: { lte: new Date(Date.now() - 15 * 60 * 1000) },
      },
      data: { status: BoostStatus.EXPIRED },
    });

    const totalExpired = result.count + pendingResult.count;

    if (totalExpired > 0) {
      this.logger.log(
        `Expired ${result.count} active boosts and ${pendingResult.count} pending boosts`,
      );
    }

    return { count: totalExpired };
  }

  /**
   * Get companion IDs with active boosts, sorted by multiplier
   * Used internally to prioritize boosted profiles in search
   * Cached for 5 minutes to reduce database load during high-traffic browse
   */
  private async getBoostedCompanionIds(): Promise<Map<string, number>> {
    // Cache as array of [companionId, multiplier] pairs since Map isn't JSON serializable
    const cached = await this.cachePatterns.getOrFetch<[string, number][]>(
      CACHE_KEYS.boostedCompanions(),
      CACHE_TTL.BOOSTED_COMPANIONS,
      async () => {
        const activeBoosts = await this.prisma.profileBoost.findMany({
          where: {
            status: BoostStatus.ACTIVE,
            expiresAt: { gt: new Date() },
          },
          select: {
            companionId: true,
            multiplier: true,
          },
          orderBy: { multiplier: "desc" },
        });

        const boostMap = new Map<string, number>();
        for (const boost of activeBoosts) {
          // Only keep the highest multiplier if a companion has multiple boosts
          if (!boostMap.has(boost.companionId)) {
            boostMap.set(boost.companionId, Number(boost.multiplier));
          }
        }

        return Array.from(boostMap.entries());
      },
    );

    return new Map(cached || []);
  }

  // ============================================
  // Photo Verification
  // ============================================

  async submitPhotoVerification(
    userId: string,
    dto: SubmitPhotoVerificationDto,
  ): Promise<PhotoVerificationResponse> {
    const profile = await this.prisma.companionProfile.findFirst({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Companion profile not found");
    }

    // Block if there's already a pending/under-review verification
    const existing = await this.prisma.photoVerification.findFirst({
      where: {
        userId,
        status: { in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
      },
    });

    if (existing) {
      throw new BadRequestException(
        "You already have a verification request pending review",
      );
    }

    const verification = await this.prisma.photoVerification.create({
      data: {
        userId,
        photoUrl: dto.idFrontUrl,
        idBackUrl: dto.idBackUrl,
        selfieUrl: dto.selfieUrl,
        status: VerificationStatus.PENDING,
      },
    });

    // Update companion profile status
    await this.prisma.companionProfile.update({
      where: { id: profile.id },
      data: { verificationStatus: VerificationStatus.UNDER_REVIEW },
    });

    // Invalidate profile cache
    this.prisma.invalidateModelCache("companionProfile");

    return {
      id: verification.id,
      status: verification.status,
      idFrontUrl: verification.photoUrl,
      idBackUrl: verification.idBackUrl ?? "",
      selfieUrl: verification.selfieUrl,
      failureReason: verification.failureReason ?? undefined,
      createdAt: verification.createdAt,
      reviewedAt: verification.reviewedAt ?? undefined,
    };
  }

  async getMyPhotoVerification(
    userId: string,
  ): Promise<PhotoVerificationResponse | null> {
    const verification = await this.prisma.photoVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return null;
    }

    return {
      id: verification.id,
      status: verification.status,
      idFrontUrl: verification.photoUrl,
      idBackUrl: verification.idBackUrl ?? "",
      selfieUrl: verification.selfieUrl,
      failureReason: verification.failureReason ?? undefined,
      createdAt: verification.createdAt,
      reviewedAt: verification.reviewedAt ?? undefined,
    };
  }
}
