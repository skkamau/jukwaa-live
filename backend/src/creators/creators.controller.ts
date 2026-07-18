import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { CreatorsService } from './creators.service';
import { CreateCreatorDto, UpdateChannelDto } from './dto/creator.dto';

@Controller('creators')
@UseGuards(AuthGuard)
export class CreatorsController {
  constructor(private readonly creators: CreatorsService) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedRequestUser) {
    return { creator: await this.creators.getMe(user.id) };
  }

  @Post('me')
  async create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateCreatorDto,
  ) {
    return { creator: await this.creators.create(user.id, input) };
  }

  @Patch('me/channel')
  async updateChannel(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: UpdateChannelDto,
  ) {
    return { creator: await this.creators.updateChannel(user.id, input) };
  }
}
