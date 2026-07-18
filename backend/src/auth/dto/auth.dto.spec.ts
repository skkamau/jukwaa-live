import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto, ResetPasswordDto } from './auth.dto';

describe('RegisterDto', () => {
  it('normalizes email and username without lowercasing the display name or trimming password', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: '  Njeri@Example.COM ', username: '  Njeri_DEV ',
      displayName: '  Njeri Wanjiku  ', password: '  twelve characters 1  ',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({
      email: 'njeri@example.com', username: 'njeri_dev',
      displayName: 'Njeri Wanjiku', password: '  twelve characters 1  ',
    });
  });

  it('rejects short passwords and unsafe usernames before hashing', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'valid@example.com', username: 'unsafe.name!',
      displayName: 'Valid Name', password: 'too short',
    });
    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['username', 'password']));
  });

  it.each(['abcdefgh', '12345678'])('rejects a password missing a required character class', async (password) => {
    const dto = plainToInstance(RegisterDto, {
      email: 'valid@example.com', username: 'valid_user',
      displayName: 'Valid Name', password,
    });
    expect((await validate(dto)).map((error) => error.property)).toContain('password');
  });

  it('applies the same password policy to password resets', async () => {
    const valid = plainToInstance(ResetPasswordDto, {
      token: 'a'.repeat(40), password: 'secure123',
    });
    const invalid = plainToInstance(ResetPasswordDto, {
      token: 'a'.repeat(40), password: 'password',
    });
    await expect(validate(valid)).resolves.toHaveLength(0);
    expect((await validate(invalid)).map((error) => error.property)).toContain('password');
  });
});
