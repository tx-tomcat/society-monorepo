import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SecurityService } from '../services/security.service';
import { SecurityEventType } from '../dto/security.dto';

@Injectable()
export class IpBlockGuard implements CanActivate {
  constructor(private readonly securityService: SecurityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.headers['x-forwarded-for']?.split(',')[0];

    if (!ip) {
      return true;
    }

    const isBlocked = await this.securityService.isIpBlocked(ip);

    if (isBlocked) {
      // Log the blocked attempt
      await this.securityService.logSecurityEvent(
        SecurityEventType.BLOCKED_IP,
        request.user?.id || null,
        ip,
        request.headers['user-agent'],
        { endpoint: request.url },
      );

      throw new ForbiddenException('Your IP address has been blocked');
    }

    return true;
  }
}
