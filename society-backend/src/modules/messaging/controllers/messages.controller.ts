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
import { RateLimit } from "@/modules/security/decorators/rate-limit.decorator";
import { RateLimitType } from "@/modules/security/dto/security.dto";
import { RateLimitGuard } from "@/modules/security/guards/rate-limit.guard";
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
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.MESSAGE)
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
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.MESSAGE)
  async editMessage(
    @CurrentUser("id") userId: string,
    @Param("messageId") messageId: string,
    @Body() dto: UpdateMessageDto
  ) {
    return this.messagesService.editMessage(userId, messageId, dto);
  }

  @Delete(":messageId")
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.MESSAGE)
  async deleteMessage(
    @CurrentUser("id") userId: string,
    @Param("messageId") messageId: string
  ) {
    return this.messagesService.deleteMessage(userId, messageId);
  }

  @Post(":messageId/reactions")
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.MESSAGE)
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
