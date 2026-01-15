import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiResponse } from '../interfaces/ai.interface';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.anthropic.com/v1/messages';
  private readonly defaultModel = 'claude-3-5-sonnet-20241022';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not configured');
    }
  }

  async sendMessage(
    systemPrompt: string,
    messages: ClaudeMessage[],
    options?: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
    },
  ): Promise<AiResponse> {
    const startTime = Date.now();

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: options?.model || this.defaultModel,
          max_tokens: options?.maxTokens || 1024,
          temperature: options?.temperature ?? 0.7,
          system: systemPrompt,
          messages,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Claude API error: ${error}`);
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data: ClaudeResponse = await response.json();
      const latency = Date.now() - startTime;

      this.logger.debug(
        `Claude response in ${latency}ms, tokens: ${data.usage.input_tokens + data.usage.output_tokens}`,
      );

      return {
        content: data.content[0]?.text || '',
        tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
        model: data.model,
      };
    } catch (error) {
      this.logger.error('Failed to call Claude API', error);
      throw error;
    }
  }

  async generateCompletion(
    prompt: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
    },
  ): Promise<AiResponse> {
    return this.sendMessage(
      'You are a helpful assistant.',
      [{ role: 'user', content: prompt }],
      options,
    );
  }

  async generateJson<T>(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
    },
  ): Promise<{ data: T; tokensUsed: number }> {
    const response = await this.sendMessage(
      `${systemPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON, no markdown or explanation.`,
      [{ role: 'user', content: userPrompt }],
      options,
    );

    try {
      // Extract JSON from response (handle potential markdown code blocks)
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }

      const data = JSON.parse(jsonStr.trim()) as T;
      return { data, tokensUsed: response.tokensUsed || 0 };
    } catch (error) {
      this.logger.error('Failed to parse JSON response', error);
      this.logger.debug('Raw response:', response.content);
      throw new Error('Failed to parse AI response as JSON');
    }
  }
}
