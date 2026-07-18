import { Controller, Get, Param } from '@nestjs/common';
import { ChannelsService } from './channels.service';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Get(':slug')
  async findPublic(@Param('slug') slug: string) {
    return { channel: await this.channels.findPublic(slug) };
  }
}
