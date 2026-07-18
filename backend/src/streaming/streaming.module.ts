import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockStreamingProvider } from './mock-streaming.provider';
import { STREAMING_PROVIDER } from './streaming-provider';

@Module({
  providers: [
    MockStreamingProvider,
    {
      provide: STREAMING_PROVIDER,
      inject: [ConfigService, MockStreamingProvider],
      useFactory: (
        config: ConfigService,
        mockProvider: MockStreamingProvider,
      ) => {
        const provider = config.get<string>('app.streaming.provider', 'mock');
        if (provider !== 'mock') {
          throw new Error(`Streaming provider "${provider}" is not implemented`);
        }
        return mockProvider;
      },
    },
  ],
  exports: [STREAMING_PROVIDER, MockStreamingProvider],
})
export class StreamingModule {}
