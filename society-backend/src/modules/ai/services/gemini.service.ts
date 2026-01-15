import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiResponse } from '../interfaces/ai.interface';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model = 'gemini-2.0-flash-exp'; // Latest Gemini 2.5 Flash

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  async sendMessage(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: {
      maxTokens?: number;
      temperature?: number;
    },
  ): Promise<AiResponse> {
    const startTime = Date.now();

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        systemInstruction: systemPrompt,
      });

      // Convert messages to Gemini format
      // Gemini requires conversation to start with 'user' role
      // Filter out the last message (which will be sent separately)
      const historyMessages = messages.slice(0, -1);
      
      // Find the first user message index
      const firstUserIndex = historyMessages.findIndex(msg => msg.role === 'user');
      
      // Only include history from the first user message onwards
      const validHistory = firstUserIndex >= 0 
        ? historyMessages.slice(firstUserIndex)
        : [];

      const history: GeminiMessage[] = validHistory.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 1024,
          temperature: options?.temperature ?? 0.7,
        },
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;
      const text = response.text();

      const latency = Date.now() - startTime;
      const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

      this.logger.debug(
        `Gemini response in ${latency}ms, tokens: ${tokensUsed}`,
      );

      return {
        content: text,
        tokensUsed,
        model: this.model,
      };
    } catch (error) {
      this.logger.error('Failed to call Gemini API', error);
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
