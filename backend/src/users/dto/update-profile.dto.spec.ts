import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProfileDto } from './update-profile.dto';

describe('UpdateProfileDto', () => {
  it('trims supported profile text and accepts an HTTPS avatar URL', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      displayName: '  Samuel Kamau  ', bio: '  Kenyan creator  ', avatarUrl: '  https://example.com/me.jpg  ',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({ displayName: 'Samuel Kamau', bio: 'Kenyan creator', avatarUrl: 'https://example.com/me.jpg' });
  });

  it('rejects privileged fields under the application validation policy', async () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
    await expect(pipe.transform(
      { displayName: 'Samuel', role: 'ADMIN', status: 'ACTIVE', emailVerifiedAt: new Date().toISOString() },
      { type: 'body', metatype: UpdateProfileDto },
    )).rejects.toThrow();
  });

  it('rejects non-http avatar schemes', async () => {
    const dto = plainToInstance(UpdateProfileDto, { avatarUrl: 'javascript:alert(1)' });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
