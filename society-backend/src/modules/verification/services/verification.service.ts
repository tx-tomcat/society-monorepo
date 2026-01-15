import { Injectable, Logger } from '@nestjs/common';
import { VerificationStatus } from '@generated/client';
import { PrismaService } from '../../../prisma/prisma.service';

// Verification types as string constants (matches schema String field)
const VERIFICATION_TYPE = {
  IDENTITY: 'identity',
  PHONE: 'phone',
  EMAIL: 'email',
  INCOME: 'income',
  EDUCATION: 'education',
} as const;

type VerificationType = (typeof VERIFICATION_TYPE)[keyof typeof VERIFICATION_TYPE];

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string) {
    const verifications = await this.prisma.verification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      income: verifications.find((v) => v.type === VERIFICATION_TYPE.INCOME),
      education: verifications.find((v) => v.type === VERIFICATION_TYPE.EDUCATION),
      identity: verifications.find((v) => v.type === VERIFICATION_TYPE.IDENTITY),
      phone: verifications.find((v) => v.type === VERIFICATION_TYPE.PHONE),
      email: verifications.find((v) => v.type === VERIFICATION_TYPE.EMAIL),
    };
  }

  async initiateVerification(
    userId: string,
    type: VerificationType,
    provider?: string,
  ) {
    const verification = await this.prisma.verification.create({
      data: {
        userId,
        type,
        provider,
        status: VerificationStatus.PENDING,
      },
    });

    this.logger.log(`Initiated ${type} verification for user ${userId}`);
    return verification;
  }

  async initiateIncomeVerification(userId: string, provider: string) {
    return this.initiateVerification(userId, VERIFICATION_TYPE.INCOME, provider);
  }

  async initiateEducationVerification(userId: string, university: string) {
    return this.initiateVerification(userId, VERIFICATION_TYPE.EDUCATION, university);
  }

  async initiateIdentityVerification(userId: string) {
    return this.initiateVerification(userId, VERIFICATION_TYPE.IDENTITY, 'vneid');
  }

  async initiatePhoneVerification(userId: string) {
    return this.initiateVerification(userId, VERIFICATION_TYPE.PHONE, 'twilio');
  }

  async initiateEmailVerification(userId: string) {
    return this.initiateVerification(userId, VERIFICATION_TYPE.EMAIL);
  }

  async getHistory(userId: string) {
    return this.prisma.verification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async completeVerification(
    verificationId: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.verification.update({
      where: { id: verificationId },
      data: {
        status: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        ...(metadata && { metadata: metadata as object }),
      },
    });
  }

  async failVerification(verificationId: string, reason: string) {
    return this.prisma.verification.update({
      where: { id: verificationId },
      data: {
        status: VerificationStatus.FAILED,
        metadata: { failureReason: reason },
      },
    });
  }
}
