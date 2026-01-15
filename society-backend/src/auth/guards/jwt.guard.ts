import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, UserStatus } from '@generated/client';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private supabase;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super();

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      return false;
    }

    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        return false;
      }

      // Check if user exists in our database, create if not
      let dbUser = await this.prisma.user.findFirst({
        where: { email: user.email },
      });

      if (!dbUser) {
        console.log(`[JwtAuthGuard] User not found in DB, creating: ${user.email}`);
        // Auto-provision user in database
        const userType = user.user_metadata?.user_type as 'hirer' | 'companion' | undefined;
        const role = userType === 'companion' ? UserRole.COMPANION : UserRole.HIRER;

        dbUser = await this.prisma.user.create({
          data: {
            email: user.email!,
            fullName: '', // Will be set during onboarding
            role,
            status: 'PENDING',
          },
        });
      }

      // Check if user account is active (not suspended or deleted)
      if (dbUser.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException('Your account has been suspended. Please contact support.');
      }

      if (dbUser.status === UserStatus.DELETED) {
        throw new UnauthorizedException('This account has been deleted.');
      }

      // Add the database user object to the request
      request.user = {
        id: dbUser.id,  // Use PostgreSQL user ID, not Supabase ID
        email: dbUser.email,
        sub: dbUser.id,
        role: dbUser.role,
        status: dbUser.status,
      };
      return true;
    } catch (error) {
      // Rethrow UnauthorizedException to show proper error message
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('JWT Guard error:', error);
      return false;
    }
  }

  private extractToken(request: { headers: { authorization?: string } }): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
