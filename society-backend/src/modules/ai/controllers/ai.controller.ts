import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { ClaudeService } from '../services/claude.service';
import { GeminiService } from '../services/gemini.service';

/**
 * AI Controller - Minimal implementation for companion booking platform
 * AI features can be expanded in future iterations (Phase 2+)
 * Current purpose: Provide AI services for internal use (content moderation, etc.)
 */
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly claudeService: ClaudeService,
    private readonly geminiService: GeminiService,
  ) {}

  // AI endpoints will be added in future phases
  // Current AI services are used internally by other modules
}
