import { Module } from '@nestjs/common';
import { SafetyController } from './controllers/safety.controller';
import { SafetyService } from './services/safety.service';

@Module({
  controllers: [SafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}
