import { Injectable, Logger } from '@nestjs/common';

interface UniversityCallbackData {
  studentId?: string;
  verified?: boolean;
  graduationYear?: number;
  degree?: string;
}

@Injectable()
export class EducationVerificationService {
  private readonly logger = new Logger(EducationVerificationService.name);

  async verifyWithUniversity(userId: string, university: string, studentId: string) {
    this.logger.log(`Verifying education for user ${userId} at ${university}`);
    return { status: 'pending', message: 'Verification in progress' };
  }

  async handleUniversityCallback(verificationId: string, data: UniversityCallbackData) {
    return { verified: data.verified ?? false };
  }
}
