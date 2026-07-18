import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { MailService } from './mail.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, MailService, PasswordService, SessionService, TokenService],
  exports: [AuthGuard, SessionService],
})
export class AuthModule {}
