import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseBoolPipe,
    ParseIntPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ConversationsService } from '../services/conversations.service';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async getConversations(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('includeArchived', new DefaultValuePipe(false), ParseBoolPipe)
    includeArchived: boolean,
  ) {
    return this.conversationsService.getConversations(
      userId,
      page,
      limit,
      includeArchived,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.conversationsService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  @Get(':conversationId')
  async getConversation(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversationsService.getConversation(userId, conversationId);
  }

  @Post(':conversationId/archive')
  async archiveConversation(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversationsService.archiveConversation(userId, conversationId);
  }

  @Post(':conversationId/unarchive')
  async unarchiveConversation(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversationsService.unarchiveConversation(userId, conversationId);
  }

  @Post(':conversationId/read')
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversationsService.markAsRead(userId, conversationId);
  }

  @Post('groups')
  async createGroup(
    @CurrentUser('id') userId: string,
    @Body() body: { name: string; participantIds: string[] },
  ) {
    return this.conversationsService.createGroupConversation(
      userId,
      body.name,
      body.participantIds,
    );
  }

  @Post('groups/:conversationId/members')
  async addMembers(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
    @Body() body: { participantIds: string[] },
  ) {
    return this.conversationsService.addGroupMembers(
      userId,
      conversationId,
      body.participantIds,
    );
  }

  @Delete('groups/:conversationId/members/:memberId')
  async removeMember(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.conversationsService.removeGroupMember(
      userId,
      conversationId,
      memberId,
    );
  }

  @Post('groups/:conversationId/leave')
  async leaveGroup(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversationsService.leaveGroup(userId, conversationId);
  }
}
