import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailPayload } from '../interfaces/notification.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SENDGRID_API_KEY') || '';
    this.fromEmail = this.configService.get<string>('FROM_EMAIL') || 'noreply@society.vn';
    this.fromName = this.configService.get<string>('FROM_NAME') || 'Society';

    if (!this.apiKey) {
      this.logger.warn('SendGrid API key not configured');
    }
  }

  async send(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const body: any = {
        personalizations: [{ to: [{ email: payload.to }] }],
        from: { email: this.fromEmail, name: this.fromName },
        subject: payload.subject,
      };

      if (payload.templateId) {
        body.template_id = payload.templateId;
        body.personalizations[0].dynamic_template_data = payload.dynamicTemplateData || {};
      } else {
        body.content = [
          { type: 'text/html', value: payload.html },
          ...(payload.text ? [{ type: 'text/plain', value: payload.text }] : []),
        ];
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`SendGrid error: ${error}`);
        return { success: false, error };
      }

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sendTemplate(
    to: string,
    templateId: string,
    data: Record<string, any>,
  ): Promise<{ success: boolean; error?: string }> {
    return this.send({
      to,
      subject: '', // Subject comes from template
      html: '',
      templateId,
      dynamicTemplateData: data,
    });
  }

  // Common notification emails
  async sendMatchNotification(to: string, matchName: string): Promise<void> {
    await this.send({
      to,
      subject: `You have a new match on Society!`,
      html: `
        <h1>Congratulations!</h1>
        <p>You matched with ${matchName}. Start a conversation and see where it leads!</p>
        <a href="https://app.society.vn/matches" style="background: #C9A961; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Match</a>
      `,
    });
  }

  async sendNewMessageNotification(to: string, senderName: string): Promise<void> {
    await this.send({
      to,
      subject: `New message from ${senderName}`,
      html: `
        <p>You have a new message from ${senderName} on Society.</p>
        <a href="https://app.society.vn/messages" style="background: #C9A961; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Message</a>
      `,
    });
  }

  async sendVerificationReminder(to: string, verificationType: string): Promise<void> {
    await this.send({
      to,
      subject: `Complete your ${verificationType} verification`,
      html: `
        <p>Your ${verificationType} verification is pending. Complete it to unlock all features on Society.</p>
        <a href="https://app.society.vn/verification" style="background: #C9A961; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Complete Verification</a>
      `,
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.send({
      to,
      subject: `Welcome to Society, ${name}!`,
      html: `
        <h1>Welcome to Society</h1>
        <p>Dear ${name},</p>
        <p>Welcome to Vietnam's most exclusive professional networking platform. We're thrilled to have you join our distinguished community.</p>
        <p>Get started by completing your profile and verification to unlock all features.</p>
        <a href="https://app.society.vn/onboarding" style="background: #C9A961; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Complete Profile</a>
      `,
    });
  }
}
