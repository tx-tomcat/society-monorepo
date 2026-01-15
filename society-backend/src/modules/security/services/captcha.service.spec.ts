import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { CaptchaService, CaptchaProvider } from './captcha.service';
import { CacheService } from '../../cache/cache.service';

describe('CaptchaService', () => {
  let service: CaptchaService;
  let cacheService: jest.Mocked<CacheService>;
  let configService: jest.Mocked<ConfigService>;

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default config values
    mockConfigService.get.mockImplementation((key: string, defaultValue?: unknown) => {
      const config: Record<string, unknown> = {
        CAPTCHA_PROVIDER: 'hcaptcha',
        CAPTCHA_SECRET_KEY: 'test-secret-key',
        CAPTCHA_SITE_KEY: 'test-site-key',
        CAPTCHA_ENABLED: true,
      };
      return config[key] ?? defaultValue;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaptchaService,
        { provide: CacheService, useValue: mockCacheService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CaptchaService>(CaptchaService);
    cacheService = module.get(CacheService);
    configService = module.get(ConfigService);
  });

  describe('isCaptchaRequired', () => {
    it('should return false when no failures recorded', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const result = await service.isCaptchaRequired('test@example.com');

      expect(result.required).toBe(false);
      expect(result.failureCount).toBe(0);
      expect(result.threshold).toBe(3);
    });

    it('should return false when failures are below threshold', async () => {
      mockCacheService.get.mockResolvedValue({
        failureCount: 2,
        lastAttemptAt: Date.now(),
        captchaRequiredSince: null,
      });

      const result = await service.isCaptchaRequired('test@example.com');

      expect(result.required).toBe(false);
      expect(result.failureCount).toBe(2);
    });

    it('should return true when failures reach threshold', async () => {
      mockCacheService.get.mockResolvedValue({
        failureCount: 3,
        lastAttemptAt: Date.now(),
        captchaRequiredSince: Date.now(),
      });

      const result = await service.isCaptchaRequired('test@example.com');

      expect(result.required).toBe(true);
      expect(result.failureCount).toBe(3);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should create new failure record on first attempt', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const result = await service.recordFailedAttempt('test@example.com');

      expect(result.failureCount).toBe(1);
      expect(result.captchaRequired).toBe(false);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'bruteforce:test@example.com',
        expect.objectContaining({
          failureCount: 1,
          captchaRequiredSince: null,
        }),
        900,
      );
    });

    it('should increment failure count on subsequent attempts', async () => {
      mockCacheService.get.mockResolvedValue({
        failureCount: 2,
        lastAttemptAt: Date.now() - 1000,
        captchaRequiredSince: null,
      });

      const result = await service.recordFailedAttempt('test@example.com');

      expect(result.failureCount).toBe(3);
      expect(result.captchaRequired).toBe(true);
    });

    it('should mark captchaRequiredSince when threshold is reached', async () => {
      mockCacheService.get.mockResolvedValue({
        failureCount: 2,
        lastAttemptAt: Date.now() - 1000,
        captchaRequiredSince: null,
      });

      await service.recordFailedAttempt('test@example.com');

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'bruteforce:test@example.com',
        expect.objectContaining({
          failureCount: 3,
          captchaRequiredSince: expect.any(Number),
        }),
        900,
      );
    });
  });

  describe('recordSuccessfulAttempt', () => {
    it('should delete the brute force record', async () => {
      await service.recordSuccessfulAttempt('test@example.com');

      expect(mockCacheService.del).toHaveBeenCalledWith('bruteforce:test@example.com');
    });
  });

  describe('validateCaptchaIfRequired', () => {
    it('should return valid when captcha not required', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const result = await service.validateCaptchaIfRequired('test@example.com');

      expect(result.valid).toBe(true);
      expect(result.captchaRequired).toBe(false);
    });

    it('should return invalid when captcha required but not provided', async () => {
      mockCacheService.get.mockResolvedValue({
        failureCount: 3,
        lastAttemptAt: Date.now(),
        captchaRequiredSince: Date.now() - 1000,
      });

      const result = await service.validateCaptchaIfRequired('test@example.com');

      expect(result.valid).toBe(false);
      expect(result.captchaRequired).toBe(true);
      expect(result.message).toContain('CAPTCHA verification required');
    });
  });

  describe('getBruteForceStatus', () => {
    it('should return default status when no data exists', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const result = await service.getBruteForceStatus('test@example.com');

      expect(result.failureCount).toBe(0);
      expect(result.captchaRequired).toBe(false);
      expect(result.captchaRequiredSince).toBeNull();
    });

    it('should return current status with captcha required', async () => {
      const captchaRequiredSince = Date.now() - 60000;
      mockCacheService.get.mockResolvedValue({
        failureCount: 5,
        lastAttemptAt: Date.now(),
        captchaRequiredSince,
      });

      const result = await service.getBruteForceStatus('test@example.com');

      expect(result.failureCount).toBe(5);
      expect(result.captchaRequired).toBe(true);
      expect(result.captchaRequiredSince).toEqual(new Date(captchaRequiredSince));
    });
  });

  describe('getCaptchaConfig', () => {
    it('should return captcha configuration', () => {
      const config = service.getCaptchaConfig();

      expect(config.enabled).toBe(true);
      expect(config.provider).toBe(CaptchaProvider.HCAPTCHA);
      expect(config.siteKey).toBe('test-site-key');
      expect(config.threshold).toBe(3);
    });
  });

  describe('when CAPTCHA is disabled', () => {
    beforeEach(async () => {
      mockConfigService.get.mockImplementation((key: string, defaultValue?: unknown) => {
        const config: Record<string, unknown> = {
          CAPTCHA_PROVIDER: 'hcaptcha',
          CAPTCHA_SECRET_KEY: '',
          CAPTCHA_SITE_KEY: '',
          CAPTCHA_ENABLED: false,
        };
        return config[key] ?? defaultValue;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CaptchaService,
          { provide: CacheService, useValue: mockCacheService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<CaptchaService>(CaptchaService);
    });

    it('should always return not required when disabled', async () => {
      mockCacheService.get.mockResolvedValue({
        failureCount: 10,
        lastAttemptAt: Date.now(),
        captchaRequiredSince: Date.now(),
      });

      const result = await service.isCaptchaRequired('test@example.com');

      expect(result.required).toBe(false);
    });

    it('should return captchaRequired false when recording failure', async () => {
      mockCacheService.get.mockResolvedValue({
        failureCount: 5,
        lastAttemptAt: Date.now(),
        captchaRequiredSince: Date.now(),
      });

      const result = await service.recordFailedAttempt('test@example.com');

      expect(result.captchaRequired).toBe(false);
    });

    it('should return config with enabled false', () => {
      const config = service.getCaptchaConfig();

      expect(config.enabled).toBe(false);
      expect(config.siteKey).toBe('');
    });
  });
});
