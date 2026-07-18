import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { PrepareStreamDto, UpdateStreamDto } from './dto/stream.dto';
import { StreamsService } from './streams.service';

@Controller('streams')
export class StreamsController {
  constructor(private readonly streams: StreamsService) {}

  @Get('live')
  async live() {
    return { streams: await this.streams.findLive() };
  }

  @Get('me/current')
  @UseGuards(AuthGuard)
  async current(@CurrentUser() user: AuthenticatedRequestUser) {
    return { stream: await this.streams.current(user.id) };
  }

  @Post('me/prepare')
  @UseGuards(AuthGuard)
  async prepare(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: PrepareStreamDto,
  ) {
    return { stream: await this.streams.prepare(user.id, input) };
  }

  @Patch('me/current')
  @UseGuards(AuthGuard)
  async update(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: UpdateStreamDto,
  ) {
    return { stream: await this.streams.updateCurrent(user.id, input) };
  }

  @Post('me/current/cancel')
  @UseGuards(AuthGuard)
  async cancel(@CurrentUser() user: AuthenticatedRequestUser) {
    return { stream: await this.streams.cancelCurrent(user.id) };
  }

  @Post('me/current/simulate-live')
  @UseGuards(AuthGuard)
  async simulateLive(@CurrentUser() user: AuthenticatedRequestUser) {
    return { stream: await this.streams.simulateLive(user.id) };
  }

  @Post('me/current/simulate-end')
  @UseGuards(AuthGuard)
  async simulateEnd(@CurrentUser() user: AuthenticatedRequestUser) {
    return { stream: await this.streams.simulateEnd(user.id) };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return { stream: await this.streams.findPublicDetail(id) };
  }
}

@Controller('creators/me/streaming')
@UseGuards(AuthGuard)
export class CreatorStreamingController {
  constructor(private readonly streams: StreamsService) {}

  @Get()
  async configuration(@CurrentUser() user: AuthenticatedRequestUser) {
    return { streaming: await this.streams.streamingConfiguration(user.id) };
  }
}
