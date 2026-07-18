import { MockStreamingProvider } from './mock-streaming.provider';

describe('MockStreamingProvider', () => {
  it('provides deterministic non-video configuration and status', async () => {
    const provider = new MockStreamingProvider();
    const provisioned = await provider.provisionChannel('channel-1');
    expect(provisioned).toMatchObject({
      providerChannelId: 'mock:channel-1',
      ingestEndpoint: null,
      playbackUrl: null,
    });
    await expect(provider.getStreamStatus(provisioned.providerChannelId)).resolves.toBe('OFFLINE');
    await provider.setDevelopmentBroadcast(provisioned.providerChannelId, 'LIVE');
    await expect(provider.listLiveChannels()).resolves.toEqual(['mock:channel-1']);
    await expect(provider.getPlaybackSource(provisioned.providerChannelId)).resolves.toMatchObject({
      kind: 'development-placeholder',
      url: null,
    });
  });
});
