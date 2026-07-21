import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly mode: 'console' | 'smtp' | 'disabled';
  private readonly transporter: Transporter | null;

  constructor(private readonly config: ConfigService) {
    this.mode = this.config.get<'console' | 'smtp' | 'disabled'>('app.mailMode', 'console');
    this.transporter = this.mode === 'smtp'
      ? nodemailer.createTransport({
          host: this.config.getOrThrow<string>('app.smtp.host'),
          port: this.config.get<number>('app.smtp.port', 587),
          secure: this.config.get<boolean>('app.smtp.secure', false),
          auth: {
            user: this.config.getOrThrow<string>('app.smtp.user'),
            pass: this.config.getOrThrow<string>('app.smtp.password'),
          },
        })
      : null;
  }

  get isDeliveryAvailable(): boolean {
    return this.mode !== 'disabled';
  }

  async sendVerification(email: string, token: string): Promise<void> {
    await this.send(email, 'Verify your Jukwaa Live email', 'verify-email', token);
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    await this.send(email, 'Reset your Jukwaa Live password', 'reset-password', token);
  }

  private async send(email: string, subject: string, route: string, token: string): Promise<void> {
    if (this.mode === 'disabled') return;
    const origin = this.config.getOrThrow<string>('app.frontendOrigin');
    const url = `${origin}/${route}?token=${encodeURIComponent(token)}`;
    if (!this.transporter) {
      this.logger.log(`[development mail] ${subject} for ${email}: ${url}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.config.getOrThrow<string>('app.smtp.from'),
      to: email,
      subject,
      text: `${subject}: ${url}`,
      html: `<p>${subject}</p><p><a href="${url}">${url}</a></p>`,
    });
  }
}
