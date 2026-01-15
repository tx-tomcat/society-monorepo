import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationsController } from './controllers/conversations.controller';
import {
  MessagesController,
  MessageActionsController,
} from './controllers/messages.controller';
import { ConversationsService } from './services/conversations.service';
import { MessagesService } from './services/messages.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [
    ConversationsController,
    MessagesController,
    MessageActionsController,
  ],
  providers: [ConversationsService, MessagesService],
  exports: [ConversationsService, MessagesService],
})
export class MessagingModule {}
