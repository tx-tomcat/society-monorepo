import { PrismaModule } from '@/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
