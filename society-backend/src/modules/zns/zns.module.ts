import { Global, Module } from '@nestjs/common';
import { ZnsService } from './zns.service';

@Global()
@Module({
  providers: [ZnsService],
  exports: [ZnsService],
})
export class ZnsModule {}
