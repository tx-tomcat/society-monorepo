import { JwtAuthGuard } from "@/auth/guards/jwt.guard";
import { RolesGuard } from "@/auth/guards/roles.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/common/enums/roles.enum";
import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import {
  PlatformConfigDto,
  UpdatePlatformConfigDto,
} from "../dto/platform-config.dto";
import { PlatformConfigService } from "../services/config.service";

@Controller("config")
@UseGuards(JwtAuthGuard)
export class ConfigController {
  constructor(private readonly configService: PlatformConfigService) {}

  /**
   * Get platform configuration
   * Requires authentication - fetched after user logs in
   */
  @Get("platform")
  async getPlatformConfig(): Promise<PlatformConfigDto> {
    return this.configService.getPlatformConfig();
  }

  /**
   * Update platform configuration (admin only)
   */
  @Patch("platform")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updatePlatformConfig(
    @Body() dto: UpdatePlatformConfigDto,
    @CurrentUser("id") adminUserId: string,
  ): Promise<PlatformConfigDto> {
    return this.configService.updatePlatformConfig(dto, adminUserId);
  }
}
