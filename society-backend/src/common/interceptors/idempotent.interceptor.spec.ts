import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, ConflictException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, firstValueFrom } from 'rxjs';
import { IdempotentInterceptor } from './idempotent.interceptor';
import { PrismaService } from '@/prisma/prisma.service';
import { IDEMPOTENT_KEY } from '../decorators/idempotent.decorator';

describe('IdempotentInterceptor', () => {
  let interceptor: IdempotentInterceptor;
  let reflector: Reflector;
  let prisma: PrismaService;

  const mockPrismaService = {
    idempotencyKey: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockReflector = {
    get: jest.fn(),
  };

  const mockExecutionContext = (
    headers: Record<string, string> = {},
    user: { id: string } | null = null,
    body: object = {},
    method = 'POST',
    path = '/wallet/topup',
  ): ExecutionContext => {
    const request = {
      headers,
      user,
      body,
      method,
      route: { path },
      url: path,
    };
    const response = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
      getHandler: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  const mockCallHandler: CallHandler = {
    handle: () => of({ id: 'test-response', code: 'HM-123456' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotentInterceptor,
        { provide: Reflector, useValue: mockReflector },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    interceptor = module.get<IdempotentInterceptor>(IdempotentInterceptor);
    reflector = module.get<Reflector>(Reflector);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('when endpoint is not marked as idempotent', () => {
    it('should proceed normally without idempotency handling', async () => {
      mockReflector.get.mockReturnValue(undefined);

      const context = mockExecutionContext();
      const result = await interceptor.intercept(context, mockCallHandler);
      const response = await firstValueFrom(result);

      expect(response).toEqual({ id: 'test-response', code: 'HM-123456' });
      expect(mockPrismaService.idempotencyKey.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when endpoint is marked as idempotent', () => {
    beforeEach(() => {
      mockReflector.get.mockReturnValue({ ttl: 3600 });
    });

    it('should proceed normally when no idempotency key header is provided', async () => {
      const context = mockExecutionContext({}, { id: 'user-123' });
      const result = await interceptor.intercept(context, mockCallHandler);
      const response = await firstValueFrom(result);

      expect(response).toEqual({ id: 'test-response', code: 'HM-123456' });
      expect(mockPrismaService.idempotencyKey.findUnique).not.toHaveBeenCalled();
    });

    it('should proceed normally when no user is authenticated', async () => {
      const context = mockExecutionContext(
        { 'x-idempotency-key': 'test-key' },
        null,
      );
      const result = await interceptor.intercept(context, mockCallHandler);
      const response = await firstValueFrom(result);

      expect(response).toEqual({ id: 'test-response', code: 'HM-123456' });
      expect(mockPrismaService.idempotencyKey.findUnique).not.toHaveBeenCalled();
    });

    it('should cache response for new idempotency key', async () => {
      mockPrismaService.idempotencyKey.findUnique.mockResolvedValue(null);
      mockPrismaService.idempotencyKey.create.mockResolvedValue({});

      const context = mockExecutionContext(
        { 'x-idempotency-key': 'new-key' },
        { id: 'user-123' },
        { amount: 100000 },
      );

      const result = await interceptor.intercept(context, mockCallHandler);
      const response = await firstValueFrom(result);

      expect(response).toEqual({ id: 'test-response', code: 'HM-123456' });
      expect(mockPrismaService.idempotencyKey.findUnique).toHaveBeenCalledWith({
        where: { key: 'new-key' },
      });

      // Wait for tap to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPrismaService.idempotencyKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: 'new-key',
          userId: 'user-123',
          endpoint: 'POST /wallet/topup',
          responseCode: 200,
          responseBody: { id: 'test-response', code: 'HM-123456' },
        }),
      });
    });

    it('should return cached response for existing valid idempotency key', async () => {
      const cachedResponse = { id: 'cached-response', code: 'HM-CACHED' };
      mockPrismaService.idempotencyKey.findUnique.mockResolvedValue({
        key: 'existing-key',
        userId: 'user-123',
        endpoint: 'POST /wallet/topup',
        requestHash: null,
        responseCode: 201,
        responseBody: cachedResponse,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour in future
      });

      const context = mockExecutionContext(
        { 'x-idempotency-key': 'existing-key' },
        { id: 'user-123' },
      );

      const result = await interceptor.intercept(context, mockCallHandler);
      const response = await firstValueFrom(result);

      expect(response).toEqual(cachedResponse);
      expect(mockPrismaService.idempotencyKey.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when key belongs to another user', async () => {
      mockPrismaService.idempotencyKey.findUnique.mockResolvedValue({
        key: 'stolen-key',
        userId: 'another-user',
        endpoint: 'POST /wallet/topup',
        responseCode: 200,
        responseBody: {},
        expiresAt: new Date(Date.now() + 3600000),
      });

      const context = mockExecutionContext(
        { 'x-idempotency-key': 'stolen-key' },
        { id: 'user-123' },
      );

      await expect(
        interceptor.intercept(context, mockCallHandler),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when key was used for different endpoint', async () => {
      mockPrismaService.idempotencyKey.findUnique.mockResolvedValue({
        key: 'reused-key',
        userId: 'user-123',
        endpoint: 'POST /wallet/booking-payment',
        responseCode: 200,
        responseBody: {},
        expiresAt: new Date(Date.now() + 3600000),
      });

      const context = mockExecutionContext(
        { 'x-idempotency-key': 'reused-key' },
        { id: 'user-123' },
      );

      await expect(
        interceptor.intercept(context, mockCallHandler),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when request body differs', async () => {
      mockPrismaService.idempotencyKey.findUnique.mockResolvedValue({
        key: 'modified-key',
        userId: 'user-123',
        endpoint: 'POST /wallet/topup',
        requestHash: 'different-hash',
        responseCode: 200,
        responseBody: {},
        expiresAt: new Date(Date.now() + 3600000),
      });

      const context = mockExecutionContext(
        { 'x-idempotency-key': 'modified-key' },
        { id: 'user-123' },
        { amount: 200000 },
      );

      await expect(
        interceptor.intercept(context, mockCallHandler),
      ).rejects.toThrow(ConflictException);
    });

    it('should delete expired key and proceed with new request', async () => {
      mockPrismaService.idempotencyKey.findUnique.mockResolvedValue({
        key: 'expired-key',
        userId: 'user-123',
        endpoint: 'POST /wallet/topup',
        responseCode: 200,
        responseBody: {},
        expiresAt: new Date(Date.now() - 1000), // Expired
      });
      mockPrismaService.idempotencyKey.delete.mockResolvedValue({});
      mockPrismaService.idempotencyKey.create.mockResolvedValue({});

      const context = mockExecutionContext(
        { 'x-idempotency-key': 'expired-key' },
        { id: 'user-123' },
      );

      const result = await interceptor.intercept(context, mockCallHandler);
      const response = await firstValueFrom(result);

      expect(response).toEqual({ id: 'test-response', code: 'HM-123456' });
      expect(mockPrismaService.idempotencyKey.delete).toHaveBeenCalledWith({
        where: { key: 'expired-key' },
      });
    });

    it('should throw BadRequestException for invalid key format (too long)', async () => {
      const longKey = 'a'.repeat(256);
      const context = mockExecutionContext(
        { 'x-idempotency-key': longKey },
        { id: 'user-123' },
      );

      await expect(
        interceptor.intercept(context, mockCallHandler),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid key format (special chars)', async () => {
      const context = mockExecutionContext(
        { 'x-idempotency-key': 'key-with-spaces and!special@chars' },
        { id: 'user-123' },
      );

      await expect(
        interceptor.intercept(context, mockCallHandler),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid key format with hyphens and underscores', async () => {
      mockPrismaService.idempotencyKey.findUnique.mockResolvedValue(null);
      mockPrismaService.idempotencyKey.create.mockResolvedValue({});

      const context = mockExecutionContext(
        { 'x-idempotency-key': 'valid-key_with-123' },
        { id: 'user-123' },
      );

      const result = await interceptor.intercept(context, mockCallHandler);
      const response = await firstValueFrom(result);

      expect(response).toEqual({ id: 'test-response', code: 'HM-123456' });
    });
  });
});
