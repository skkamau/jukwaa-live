import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './auth.dto';

describe('RegisterDto', () => {
  it('normalizes email and username without lowercasing the display name or trimming password', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: '  Njeri@Example.COM ', username: '  Njeri_DEV ',
      displayName: '  Njeri Wanjiku  ', password: '  twelve characters  ',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({
      email: 'njeri@example.com', username: 'njeri_dev',
      displayName: 'Njeri Wanjiku', password: '  twelve characters  ',
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
});
