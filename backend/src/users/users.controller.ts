import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedRequestUser) {
    return { user: await this.users.getMe(user.id) };
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: UpdateProfileDto,
  ) {
    return { user: await this.users.updateMe(user.id, input) };
  }
}
