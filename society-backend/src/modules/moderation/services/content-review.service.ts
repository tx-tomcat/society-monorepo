import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ContentReviewResult } from '../interfaces/moderation.interface';

@Injectable()
export class ContentReviewService {
  private readonly logger = new Logger(ContentReviewService.name);
  private readonly anthropic: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  async reviewText(text: string): Promise<ContentReviewResult> {
    if (!this.anthropic) {
      // Fallback to basic keyword check
      return this.basicTextReview(text);
    }

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Analyze this text for moderation purposes. Check for:
1. Hate speech or discrimination
2. Harassment or bullying
3. Sexual content
4. Violence or threats
5. Spam or scam content
6. Personal information exposure
7. Illegal activity promotion

Text to analyze:
"""
${text}
"""

Respond in JSON format:
{
  "isSafe": boolean,
  "flags": ["list of detected issues"],
  "confidence": 0.0-1.0,
  "suggestedAction": "approve|warn|reject"
}`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      return { isSafe: true, flags: [], confidence: 0.5 };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`AI content review failed: ${errorMessage}`);
      return this.basicTextReview(text);
    }
  }

  async reviewImage(imageUrl: string): Promise<ContentReviewResult> {
    if (!this.anthropic) {
      return { isSafe: true, flags: [], confidence: 0.5, suggestedAction: 'approve' };
    }

    try {
      // Fetch image and convert to base64
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mediaType = response.headers.get('content-type') || 'image/jpeg';

      const aiResponse = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: `Analyze this image for moderation purposes. Check for:
1. Nudity or sexual content
2. Violence or gore
3. Hate symbols
4. Inappropriate gestures
5. Fake or misleading profile photos
6. Text overlay with harmful content

Respond in JSON format:
{
  "isSafe": boolean,
  "flags": ["list of detected issues"],
  "confidence": 0.0-1.0,
  "suggestedAction": "approve|warn|reject"
}`,
              },
            ],
          },
        ],
      });

      const content = aiResponse.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      return { isSafe: true, flags: [], confidence: 0.5 };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`AI image review failed: ${errorMessage}`);
      return { isSafe: true, flags: [], confidence: 0.5, suggestedAction: 'approve' };
    }
  }

  private basicTextReview(text: string): ContentReviewResult {
    const lowerText = text.toLowerCase();
    const flags: string[] = [];

    // Check for common harmful patterns
    const patterns: Record<string, RegExp[]> = {
      'potential_spam': [/buy now/i, /click here/i, /limited offer/i, /free money/i],
      'potential_harassment': [/kill yourself/i, /die/i, /kys/i],
      'potential_scam': [/send money/i, /wire transfer/i, /bitcoin.*invest/i],
      'contact_sharing': [/\b\d{10,11}\b/, /whatsapp/i, /telegram/i, /zalo/i],
      // Vietnamese profanity and offensive language
      'profanity': [
        // Common Vietnamese profanity (censored patterns to avoid explicit words)
        /\bd[ịi][t]m/i,       // Common curse
        /\bd[uư][.]m/i,        // Variation
        /\bv[ãa]i\s*l[ồo]n/i, // Strong profanity
        /\b[đd][ồo]\s*ng[uư]a/i, // Insult
        /\bc[ặa]c/i,          // Vulgar
        /\bl[ồo]n/i,          // Vulgar
        /\bbu[ồo]i/i,         // Vulgar
        /\bch[ửu]\s*th[ằa]ng/i, // Slang insult
        /\bd[ịi]\s*m[ẹe]/i,   // Strong curse
        /\bcon\s*[đd][ĩi]/i,  // Strong insult
        /\bm[ẹe]\s*m[àa]y/i,  // Strong insult
        /\bth[ằa]ng\s*ch[óo]/i, // Strong insult
        /\bcon\s*ch[óo]/i,    // Strong insult
        // English profanity
        /\bf+u+c+k+/i,
        /\bs+h+i+t+/i,
        /\ba+s+s+h+o+l+e+/i,
        /\bb+i+t+c+h+/i,
        /\bc+u+n+t+/i,
        /\bd+i+c+k+/i,
        /\bp+u+s+s+y+/i,
      ],
    };

    for (const [flag, regexes] of Object.entries(patterns)) {
      for (const regex of regexes) {
        if (regex.test(lowerText)) {
          flags.push(flag);
          break;
        }
      }
    }

    return {
      isSafe: flags.length === 0,
      flags,
      confidence: 0.6,
      suggestedAction: flags.length === 0 ? 'approve' : flags.length > 2 ? 'reject' : 'warn',
    };
  }

  async reviewProfile(profile: {
    displayName?: string;
    bio?: string;
    photos?: string[];
  }): Promise<ContentReviewResult> {
    const allFlags: string[] = [];
    let minConfidence = 1.0;
    let shouldReject = false;

    // Review display name
    if (profile.displayName) {
      const nameResult = await this.reviewText(profile.displayName);
      allFlags.push(...nameResult.flags);
      minConfidence = Math.min(minConfidence, nameResult.confidence);
      if (nameResult.suggestedAction === 'reject') shouldReject = true;
    }

    // Review bio
    if (profile.bio) {
      const bioResult = await this.reviewText(profile.bio);
      allFlags.push(...bioResult.flags);
      minConfidence = Math.min(minConfidence, bioResult.confidence);
      if (bioResult.suggestedAction === 'reject') shouldReject = true;
    }

    // Review photos (first 3 for performance)
    if (profile.photos && profile.photos.length > 0) {
      const photosToReview = profile.photos.slice(0, 3);
      for (const photo of photosToReview) {
        const photoResult = await this.reviewImage(photo);
        allFlags.push(...photoResult.flags);
        minConfidence = Math.min(minConfidence, photoResult.confidence);
        if (photoResult.suggestedAction === 'reject') shouldReject = true;
      }
    }

    // Remove duplicates
    const uniqueFlags = [...new Set(allFlags)];

    return {
      isSafe: uniqueFlags.length === 0,
      flags: uniqueFlags,
      confidence: minConfidence,
      suggestedAction: shouldReject ? 'reject' : uniqueFlags.length > 0 ? 'warn' : 'approve',
    };
  }
}
