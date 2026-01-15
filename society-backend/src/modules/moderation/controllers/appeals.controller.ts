import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ModerationService } from '../services/moderation.service';
import { AppealDto } from '../dto/moderation.dto';

@Controller('appeals')
@UseGuards(JwtAuthGuard)
export class AppealsController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post(':suspensionId')
  async submitAppeal(
    @Request() req: any,
    @Param('suspensionId') suspensionId: string,
    @Body() dto: AppealDto,
  ) {
    return this.moderationService.submitAppeal(req.user.id, suspensionId, dto);
  }
}
