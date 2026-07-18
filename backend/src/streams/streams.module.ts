import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StreamingModule } from '../streaming/streaming.module';
import { StreamLifecycleService } from './stream-lifecycle.service';
import { StreamStatusSyncService } from './stream-status-sync.service';
import { CreatorStreamingController, StreamsController } from './streams.controller';
import { StreamsService } from './streams.service';

@Module({
  imports: [AuthModule, StreamingModule],
  controllers: [StreamsController, CreatorStreamingController],
  providers: [StreamsService, StreamLifecycleService, StreamStatusSyncService],
  exports: [StreamsService, StreamLifecycleService, StreamStatusSyncService],
})
export class StreamsModule {}
