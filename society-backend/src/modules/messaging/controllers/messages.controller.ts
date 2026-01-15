import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import {
  CreateMessageDto,
  MessageReactionDto,
  SearchMessagesDto,
  UpdateMessageDto,
} from "../dto/message.dto";
import { MessagesService } from "../services/messages.service";

@Controller("conversations/:conversationId/messages")
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async getMessages(
    @CurrentUser("id") userId: string,
    @Param("conversationId") conversationId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number
  ) {
    return this.messagesService.getMessages(
      userId,
      conversationId,
      page,
      limit
    );
  }

  @Post()
  async sendMessage(
    @CurrentUser("id") userId: string,
    @Param("conversationId") conversationId: string,
    @Body() dto: CreateMessageDto
  ) {
    return this.messagesService.sendMessage(userId, conversationId, dto);
  }
}

@Controller("messages")
@UseGuards(JwtAuthGuard)
export class MessageActionsController {
  constructor(private readonly messagesService: MessagesService) {}

  @Put(":messageId")
  async editMessage(
    @CurrentUser("id") userId: string,
    @Param("messageId") messageId: string,
    @Body() dto: UpdateMessageDto
  ) {
    return this.messagesService.editMessage(userId, messageId, dto);
  }

  @Delete(":messageId")
  async deleteMessage(
    @CurrentUser("id") userId: string,
    @Param("messageId") messageId: string
  ) {
    return this.messagesService.deleteMessage(userId, messageId);
  }

  @Post(":messageId/reactions")
  async addReaction(
    @CurrentUser("id") userId: string,
    @Param("messageId") messageId: string,
    @Body() dto: MessageReactionDto
  ) {
    return this.messagesService.addReaction(userId, messageId, dto.reaction);
  }

  @Get("search")
  async searchMessages(
    @CurrentUser("id") userId: string,
    @Query() dto: SearchMessagesDto,
    @Query("conversationId") conversationId?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit?: number
  ) {
    return this.messagesService.searchMessages(
      userId,
      dto.query,
      conversationId,
      page,
      limit
    );
  }
}
