import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationsController } from './controllers/conversations.controller';
import {
  MessagesController,
  MessageActionsController,
} from './controllers/messages.controller';
import { ConversationsService } from './services/conversations.service';
import { MessagesService } from './services/messages.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [ConfigModule, NotificationsModule, PrismaModule, SecurityModule],
  controllers: [
    ConversationsController,
    MessagesController,
    MessageActionsController,
  ],
  providers: [ConversationsService, MessagesService],
  exports: [ConversationsService, MessagesService],
})
export class MessagingModule {}
