import { PrismaService } from '@/prisma/prisma.service';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const REQUIRE_PHONE_VERIFICATION_KEY = 'requirePhoneVerification';

@Injectable()
export class PhoneVerifiedGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireVerification = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_PHONE_VERIFICATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireVerification) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPhoneVerified: true },
    });

    if (!user?.isPhoneVerified) {
      throw new UnauthorizedException('Phone verification required');
    }

    return true;
  }
}
