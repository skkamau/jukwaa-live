import { TokenService } from './token.service';

describe('TokenService', () => {
  const service = new TokenService();

  it('creates opaque, unique 256-bit tokens and only a SHA-256 hash for persistence', () => {
    const first = service.create();
    const second = service.create();
    expect(first.raw).toHaveLength(43);
    expect(first.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.hash).toBe(service.hash(first.raw));
    expect(second.raw).not.toBe(first.raw);
  });
});
