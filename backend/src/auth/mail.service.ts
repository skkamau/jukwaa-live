import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly config: ConfigService) {
    this.transporter = this.config.get<string>('app.mailMode') === 'smtp'
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

  async sendVerification(email: string, token: string): Promise<void> {
    await this.send(email, 'Verify your Jukwaa Live email', 'verify-email', token);
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    await this.send(email, 'Reset your Jukwaa Live password', 'reset-password', token);
  }

  private async send(email: string, subject: string, route: string, token: string): Promise<void> {
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
