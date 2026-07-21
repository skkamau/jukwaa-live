import type { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
  it('does not construct or log token-bearing URLs while delivery is disabled', async () => {
    const config = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'app.mailMode' ? 'disabled' : fallback,
      ),
      getOrThrow: jest.fn(() => {
        throw new Error('disabled delivery must not request mail configuration');
      }),
    };
    const service = new MailService(config as unknown as ConfigService);
    const logger = (service as unknown as { logger: { log: (message: string) => void } }).logger;
    const log = jest.spyOn(logger, 'log');

    expect(service.isDeliveryAvailable).toBe(false);
    await expect(service.sendVerification('njeri@example.com', 'secret-verification-token')).resolves.toBeUndefined();
    await expect(service.sendPasswordReset('njeri@example.com', 'secret-reset-token')).resolves.toBeUndefined();
    expect(config.getOrThrow).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });
});
