import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCreatorDto } from './creator.dto';

describe('CreateCreatorDto', () => {
  it('normalizes a safe channel slug and trims content', async () => {
    const dto = plainToInstance(CreateCreatorDto, {
      name: '  Samuel Plays  ', slug: '  Samuel-Plays  ', description: '  Gaming from Nairobi  ',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({ name: 'Samuel Plays', slug: 'samuel-plays', description: 'Gaming from Nairobi' });
  });

  it.each(['with spaces', '-leading', 'trailing-', 'two--hyphens', 'UPPER_case'])('rejects unsafe slug %s', async (slug) => {
    const dto = plainToInstance(CreateCreatorDto, { name: 'Valid', slug });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
