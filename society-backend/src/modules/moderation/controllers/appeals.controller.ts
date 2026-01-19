import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { AppealDto } from '../dto/moderation.dto';
import { ModerationService } from '../services/moderation.service';

@Controller('appeals')
@UseGuards(JwtAuthGuard)
export class AppealsController {
  constructor(private readonly moderationService: ModerationService) { }

  @Post(':suspensionId')
  async submitAppeal(
    @Request() req: any,
    @Param('suspensionId') suspensionId: string,
    @Body() dto: AppealDto,
  ) {
    return this.moderationService.submitAppeal(req.user.id, suspensionId, dto);
  }
}
