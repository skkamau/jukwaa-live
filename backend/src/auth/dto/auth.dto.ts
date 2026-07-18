import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const normalize = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @Transform(normalize)
  @IsEmail()
  @MaxLength(320)
  email: string;

  @Transform(normalize)
  @Length(3, 50)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'username may contain only lowercase letters, numbers, and underscores',
  })
  username: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(1, 100)
  displayName: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;
}

export class LoginDto {
  @Transform(normalize)
  @IsString()
  @Length(3, 320)
  identity: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}

export class EmailDto {
  @Transform(normalize)
  @IsEmail()
  @MaxLength(320)
  email: string;
}

export class TokenDto {
  @IsString()
  @Length(40, 100)
  token: string;
}

export class ResetPasswordDto extends TokenDto {
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;
}
