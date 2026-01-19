import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AddFavoriteDto, UpdateFavoriteNotesDto } from '../dto/favorites.dto';
import { FavoritesService } from '../services/favorites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) { }

  /**
   * Get user's favorite companions
   */
  @Get()
  async getFavorites(@CurrentUser('id') userId: string) {
    return this.favoritesService.getFavorites(userId);
  }

  /**
   * Add a companion to favorites
   */
  @Post()
  async addFavorite(@CurrentUser('id') userId: string, @Body() dto: AddFavoriteDto) {
    return this.favoritesService.addFavorite(userId, dto);
  }

  /**
   * Toggle favorite status for a companion
   */
  @Post(':companionId/toggle')
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(
    @CurrentUser('id') userId: string,
    @Param('companionId') companionId: string,
  ) {
    return this.favoritesService.toggleFavorite(userId, companionId);
  }

  /**
   * Check if a companion is in favorites
   */
  @Get(':companionId/status')
  async checkFavoriteStatus(
    @CurrentUser('id') userId: string,
    @Param('companionId') companionId: string,
  ) {
    return this.favoritesService.isFavorite(userId, companionId);
  }

  /**
   * Update notes for a favorite companion
   */
  @Put(':companionId/notes')
  async updateNotes(
    @CurrentUser('id') userId: string,
    @Param('companionId') companionId: string,
    @Body() dto: UpdateFavoriteNotesDto,
  ) {
    return this.favoritesService.updateNotes(userId, companionId, dto);
  }

  /**
   * Remove a companion from favorites
   */
  @Delete(':companionId')
  @HttpCode(HttpStatus.OK)
  async removeFavorite(
    @CurrentUser('id') userId: string,
    @Param('companionId') companionId: string,
  ) {
    return this.favoritesService.removeFavorite(userId, companionId);
  }
}
