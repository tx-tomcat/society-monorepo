import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class AddFavoriteDto {
  @IsUUID()
  companionId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateFavoriteNotesDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export interface FavoriteCompanionItem {
  id: string;
  companionId: string;
  notes: string | null;
  addedAt: string;
  companion: {
    id: string; // CompanionProfile.id - use this for navigation
    userId: string; // User.id
    displayName: string;
    avatar: string | null;
    rating: number;
    reviewCount: number;
    hourlyRate: number;
    isActive: boolean;
    isVerified: boolean;
  };
}

export interface FavoritesListResponse {
  favorites: FavoriteCompanionItem[];
  total: number;
}
