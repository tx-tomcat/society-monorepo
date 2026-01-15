import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AiController } from './controllers/ai.controller';
import { ClaudeService } from './services/claude.service';
import { GeminiService } from './services/gemini.service';

@Module({
  imports: [SupabaseModule, PrismaModule],
  controllers: [AiController],
  providers: [GeminiService, ClaudeService],
  exports: [GeminiService, ClaudeService],
})
export class AiModule {}
