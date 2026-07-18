import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes with Argon2id and never stores plaintext', async () => {
    const password = '  a valid long password 🔐  ';
    const hash = await service.hash(password);
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain(password);
    await expect(service.verify(hash, password)).resolves.toBe(true);
  });

  it('does not trim or otherwise alter passwords', async () => {
    const hash = await service.hash(' spaces are meaningful ');
    await expect(service.verify(hash, 'spaces are meaningful')).resolves.toBe(false);
  });

  it('rejects a wrong password and malformed hash', async () => {
    const hash = await service.hash('correct password value');
    await expect(service.verify(hash, 'wrong password value')).resolves.toBe(false);
    await expect(service.verify('not-a-hash', 'anything')).resolves.toBe(false);
  });

  it('performs a real dummy verification for unknown identities', async () => {
    await expect(service.dummyVerify('random input')).resolves.toBe(false);
  });
});
