import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OccasionsService } from './occasions.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CachePatternsService } from '@/modules/cache/cache-patterns.service';
import { CreateOccasionDto, CreateHolidayDto } from '../dto/occasion.dto';

describe('OccasionsService', () => {
  let service: OccasionsService;

  const mockPrismaService = {
    occasion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    holiday: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCachePatternsService = {
    getOrFetch: jest.fn().mockImplementation((_key, _ttl, fetcher) => fetcher()),
    invalidate: jest.fn().mockResolvedValue(undefined),
    invalidatePattern: jest.fn().mockResolvedValue(undefined),
  };

  const mockOccasion = {
    id: 'occ-1',
    code: 'casual_outing',
    emoji: '🍽️',
    nameEn: 'Casual Outing',
    nameVi: 'Đi chơi',
    descriptionEn: 'A casual dining or outing experience',
    descriptionVi: 'Trải nghiệm ăn uống hoặc đi chơi',
    displayOrder: 1,
    isActive: true,
    timeSlots: [],
    dayTypes: [],
    holidays: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockOccasionWithFilters = {
    ...mockOccasion,
    id: 'occ-2',
    code: 'business_event',
    emoji: '💼',
    nameEn: 'Business Event',
    nameVi: 'Sự kiện kinh doanh',
    timeSlots: ['morning', 'afternoon'],
    dayTypes: ['weekday'],
    holidays: [],
  };

  const mockHolidayOccasion = {
    ...mockOccasion,
    id: 'occ-3',
    code: 'tet_celebration',
    emoji: '🏮',
    nameEn: 'Tết Celebration',
    nameVi: 'Lễ Tết',
    timeSlots: [],
    dayTypes: [],
    holidays: ['tet'],
  };

  const mockHoliday = {
    id: 'hol-1',
    code: 'tet',
    nameEn: 'Vietnamese New Year',
    nameVi: 'Tết Nguyên Đán',
    startDate: new Date('2024-02-10'),
    endDate: new Date('2024-02-15'),
    isRecurring: true,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OccasionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CachePatternsService,
          useValue: mockCachePatternsService,
        },
      ],
    }).compile();

    service = module.get<OccasionsService>(OccasionsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== Public Methods ====================

  describe('getContextualOccasions', () => {
    beforeEach(() => {
      mockPrismaService.holiday.findMany.mockResolvedValue([]);
    });

    it('should return occasions with context', async () => {
      mockPrismaService.occasion.findMany.mockResolvedValue([mockOccasion]);

      const result = await service.getContextualOccasions('en');

      expect(result.occasions).toHaveLength(1);
      expect(result.occasions[0].name).toBe('Casual Outing');
      expect(result.context).toBeDefined();
      expect(result.context.timeSlot).toBeDefined();
      expect(result.context.dayType).toBeDefined();
      expect(result.context.activeHolidays).toEqual([]);
    });

    it('should return localized names for Vietnamese', async () => {
      mockPrismaService.occasion.findMany.mockResolvedValue([mockOccasion]);

      const result = await service.getContextualOccasions('vi');

      expect(result.occasions[0].name).toBe('Đi chơi');
    });

    it('should filter by time slots and day types', async () => {
      mockPrismaService.occasion.findMany.mockResolvedValue([mockOccasionWithFilters]);

      await service.getContextualOccasions('en');

      expect(mockPrismaService.occasion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            AND: expect.any(Array),
          }),
        }),
      );
    });

    it('should include holiday occasions when holidays are active', async () => {
      mockPrismaService.holiday.findMany.mockResolvedValue([mockHoliday]);
      mockPrismaService.occasion.findMany.mockResolvedValue([
        mockOccasion,
        mockHolidayOccasion,
      ]);

      // Mock a date during Tet
      jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('2/12/2024, 10:00:00 AM');

      const result = await service.getContextualOccasions('en');

      expect(result.occasions).toHaveLength(2);
    });
  });

  describe('getAllOccasions', () => {
    it('should return all active occasions', async () => {
      mockPrismaService.occasion.findMany.mockResolvedValue([
        mockOccasion,
        mockOccasionWithFilters,
      ]);

      const result = await service.getAllOccasions('en');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Casual Outing');
      expect(result[1].name).toBe('Business Event');
    });

    it('should return Vietnamese names when language is vi', async () => {
      mockPrismaService.occasion.findMany.mockResolvedValue([mockOccasion]);

      const result = await service.getAllOccasions('vi');

      expect(result[0].name).toBe('Đi chơi');
      expect(result[0].description).toBe('Trải nghiệm ăn uống hoặc đi chơi');
    });

    it('should order by displayOrder', async () => {
      mockPrismaService.occasion.findMany.mockResolvedValue([]);

      await service.getAllOccasions();

      expect(mockPrismaService.occasion.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      });
    });
  });

  describe('getOccasionById', () => {
    it('should return occasion by ID', async () => {
      mockPrismaService.occasion.findUnique.mockResolvedValue(mockOccasion);

      const result = await service.getOccasionById('occ-1');

      expect(result.id).toBe('occ-1');
      expect(result.code).toBe('casual_outing');
      expect(result.emoji).toBe('🍽️');
    });

    it('should throw NotFoundException when occasion not found', async () => {
      mockPrismaService.occasion.findUnique.mockResolvedValue(null);

      await expect(service.getOccasionById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOccasionByCode', () => {
    it('should return occasion by code', async () => {
      mockPrismaService.occasion.findUnique.mockResolvedValue(mockOccasion);

      const result = await service.getOccasionByCode('casual_outing');

      expect(result.id).toBe('occ-1');
      expect(result.code).toBe('casual_outing');
    });

    it('should throw NotFoundException when occasion not found', async () => {
      mockPrismaService.occasion.findUnique.mockResolvedValue(null);

      await expect(service.getOccasionByCode('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==================== Admin Occasion Methods ====================

  describe('listAllOccasions', () => {
    it('should return all occasions including inactive', async () => {
      const inactiveOccasion = { ...mockOccasion, id: 'occ-inactive', isActive: false };
      mockPrismaService.occasion.findMany.mockResolvedValue([
        mockOccasion,
        inactiveOccasion,
      ]);

      const result = await service.listAllOccasions();

      expect(result).toHaveLength(2);
      expect(mockPrismaService.occasion.findMany).toHaveBeenCalledWith({
        orderBy: { displayOrder: 'asc' },
      });
    });
  });

  describe('createOccasion', () => {
    it('should create a new occasion', async () => {
      const createDto: CreateOccasionDto = {
        code: 'new_occasion',
        emoji: '🎉',
        nameEn: 'New Occasion',
        nameVi: 'Dịp mới',
        descriptionEn: 'A new occasion type',
        descriptionVi: 'Một loại dịp mới',
        displayOrder: 10,
        isActive: true,
        timeSlots: ['evening'],
        dayTypes: ['weekend'],
        holidays: [],
      };

      const createdOccasion = {
        id: 'new-occ-1',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.occasion.create.mockResolvedValue(createdOccasion);

      const result = await service.createOccasion(createDto);

      expect(result.id).toBe('new-occ-1');
      expect(result.code).toBe('new_occasion');
      expect(mockPrismaService.occasion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'new_occasion',
          emoji: '🎉',
          nameEn: 'New Occasion',
          nameVi: 'Dịp mới',
        }),
      });
    });

    it('should use default values for optional fields', async () => {
      const createDto: CreateOccasionDto = {
        code: 'minimal_occasion',
        emoji: '🔮',
        nameEn: 'Minimal',
        nameVi: 'Tối thiểu',
      };

      mockPrismaService.occasion.create.mockResolvedValue({
        id: 'min-occ',
        ...createDto,
        descriptionEn: null,
        descriptionVi: null,
        displayOrder: 0,
        isActive: true,
        timeSlots: [],
        dayTypes: [],
        holidays: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.createOccasion(createDto);

      expect(mockPrismaService.occasion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          displayOrder: 0,
          isActive: true,
          timeSlots: [],
          dayTypes: [],
          holidays: [],
        }),
      });
    });
  });

  describe('updateOccasion', () => {
    it('should update an existing occasion', async () => {
      mockPrismaService.occasion.findUnique.mockResolvedValue(mockOccasion);
      mockPrismaService.occasion.update.mockResolvedValue({
        ...mockOccasion,
        nameEn: 'Updated Casual Outing',
      });

      const result = await service.updateOccasion('occ-1', {
        nameEn: 'Updated Casual Outing',
      });

      expect(result.nameEn).toBe('Updated Casual Outing');
      expect(mockPrismaService.occasion.update).toHaveBeenCalledWith({
        where: { id: 'occ-1' },
        data: { nameEn: 'Updated Casual Outing' },
      });
    });

    it('should throw NotFoundException when occasion not found', async () => {
      mockPrismaService.occasion.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOccasion('non-existent', { nameEn: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only update provided fields', async () => {
      mockPrismaService.occasion.findUnique.mockResolvedValue(mockOccasion);
      mockPrismaService.occasion.update.mockResolvedValue({
        ...mockOccasion,
        isActive: false,
      });

      await service.updateOccasion('occ-1', { isActive: false });

      expect(mockPrismaService.occasion.update).toHaveBeenCalledWith({
        where: { id: 'occ-1' },
        data: { isActive: false },
      });
    });
  });

  describe('deleteOccasion', () => {
    it('should delete an occasion', async () => {
      mockPrismaService.occasion.findUnique.mockResolvedValue(mockOccasion);
      mockPrismaService.occasion.delete.mockResolvedValue(mockOccasion);

      await service.deleteOccasion('occ-1');

      expect(mockPrismaService.occasion.delete).toHaveBeenCalledWith({
        where: { id: 'occ-1' },
      });
    });

    it('should throw NotFoundException when occasion not found', async () => {
      mockPrismaService.occasion.findUnique.mockResolvedValue(null);

      await expect(service.deleteOccasion('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==================== Holiday Methods ====================

  describe('getActiveHolidays', () => {
    it('should return active holiday codes for a given date', async () => {
      mockPrismaService.holiday.findMany.mockResolvedValue([mockHoliday]);

      const testDate = new Date('2024-02-12'); // During Tet
      const result = await service.getActiveHolidays(testDate);

      expect(result).toContain('tet');
    });

    it('should return empty array when no holidays are active', async () => {
      mockPrismaService.holiday.findMany.mockResolvedValue([mockHoliday]);

      const testDate = new Date('2024-06-15'); // Not during any holiday
      const result = await service.getActiveHolidays(testDate);

      expect(result).toEqual([]);
    });

    it('should handle recurring holidays across years', async () => {
      const recurringHoliday = {
        ...mockHoliday,
        isRecurring: true,
        startDate: new Date('2023-02-10'),
        endDate: new Date('2023-02-15'),
      };
      mockPrismaService.holiday.findMany.mockResolvedValue([recurringHoliday]);

      const testDate = new Date('2024-02-12');
      const result = await service.getActiveHolidays(testDate);

      expect(result).toContain('tet');
    });

    it('should handle year boundary holidays (Dec-Jan)', async () => {
      const yearBoundaryHoliday = {
        id: 'hol-christmas',
        code: 'christmas_newyear',
        nameEn: 'Christmas to New Year',
        nameVi: 'Giáng sinh đến Năm mới',
        startDate: new Date('2023-12-24'),
        endDate: new Date('2024-01-02'),
        isRecurring: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.holiday.findMany.mockResolvedValue([yearBoundaryHoliday]);

      // Test December date
      const decDate = new Date('2024-12-25');
      const decResult = await service.getActiveHolidays(decDate);
      expect(decResult).toContain('christmas_newyear');

      // Test January date
      const janDate = new Date('2024-01-01');
      const janResult = await service.getActiveHolidays(janDate);
      expect(janResult).toContain('christmas_newyear');
    });

    it('should not return inactive holidays', async () => {
      const inactiveHoliday = { ...mockHoliday, isActive: false };
      mockPrismaService.holiday.findMany.mockResolvedValue([]); // findMany filters by isActive: true

      const testDate = new Date('2024-02-12');
      const result = await service.getActiveHolidays(testDate);

      expect(result).toEqual([]);
    });
  });

  describe('listAllHolidays', () => {
    it('should return all holidays ordered by start date', async () => {
      const holidays = [mockHoliday, { ...mockHoliday, id: 'hol-2', code: 'mid_autumn' }];
      mockPrismaService.holiday.findMany.mockResolvedValue(holidays);

      const result = await service.listAllHolidays();

      expect(result).toHaveLength(2);
      expect(mockPrismaService.holiday.findMany).toHaveBeenCalledWith({
        orderBy: { startDate: 'asc' },
      });
    });
  });

  describe('createHoliday', () => {
    it('should create a new holiday', async () => {
      const createDto: CreateHolidayDto = {
        code: 'mid_autumn',
        nameEn: 'Mid-Autumn Festival',
        nameVi: 'Tết Trung Thu',
        startDate: '2024-09-17',
        endDate: '2024-09-17',
        isRecurring: true,
        isActive: true,
      };

      const createdHoliday = {
        id: 'hol-new',
        ...createDto,
        startDate: new Date('2024-09-17'),
        endDate: new Date('2024-09-17'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.holiday.create.mockResolvedValue(createdHoliday);

      const result = await service.createHoliday(createDto);

      expect(result.id).toBe('hol-new');
      expect(result.code).toBe('mid_autumn');
      expect(mockPrismaService.holiday.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'mid_autumn',
          nameEn: 'Mid-Autumn Festival',
          nameVi: 'Tết Trung Thu',
        }),
      });
    });

    it('should use default values for optional fields', async () => {
      const createDto: CreateHolidayDto = {
        code: 'test_holiday',
        nameEn: 'Test',
        nameVi: 'Test VN',
        startDate: '2024-01-01',
        endDate: '2024-01-01',
      };

      mockPrismaService.holiday.create.mockResolvedValue({
        id: 'hol-test',
        ...createDto,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-01'),
        isRecurring: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.createHoliday(createDto);

      expect(mockPrismaService.holiday.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isRecurring: true,
          isActive: true,
        }),
      });
    });
  });

  describe('updateHoliday', () => {
    it('should update an existing holiday', async () => {
      mockPrismaService.holiday.findUnique.mockResolvedValue(mockHoliday);
      mockPrismaService.holiday.update.mockResolvedValue({
        ...mockHoliday,
        nameEn: 'Updated Vietnamese New Year',
      });

      const result = await service.updateHoliday('hol-1', {
        nameEn: 'Updated Vietnamese New Year',
      });

      expect(result.nameEn).toBe('Updated Vietnamese New Year');
    });

    it('should throw NotFoundException when holiday not found', async () => {
      mockPrismaService.holiday.findUnique.mockResolvedValue(null);

      await expect(
        service.updateHoliday('non-existent', { nameEn: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should convert date strings to Date objects', async () => {
      mockPrismaService.holiday.findUnique.mockResolvedValue(mockHoliday);
      mockPrismaService.holiday.update.mockResolvedValue({
        ...mockHoliday,
        startDate: new Date('2024-02-09'),
      });

      await service.updateHoliday('hol-1', { startDate: '2024-02-09' });

      expect(mockPrismaService.holiday.update).toHaveBeenCalledWith({
        where: { id: 'hol-1' },
        data: { startDate: expect.any(Date) },
      });
    });
  });

  describe('deleteHoliday', () => {
    it('should delete a holiday', async () => {
      mockPrismaService.holiday.findUnique.mockResolvedValue(mockHoliday);
      mockPrismaService.holiday.delete.mockResolvedValue(mockHoliday);

      await service.deleteHoliday('hol-1');

      expect(mockPrismaService.holiday.delete).toHaveBeenCalledWith({
        where: { id: 'hol-1' },
      });
    });

    it('should throw NotFoundException when holiday not found', async () => {
      mockPrismaService.holiday.findUnique.mockResolvedValue(null);

      await expect(service.deleteHoliday('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
