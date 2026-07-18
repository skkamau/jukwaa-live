import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  private readonly dummyHash = '$argon2id$v=19$m=19456,t=2,p=1$C1i9C0fuNa/HG8jZ5xT/Hw$/Y5ZqoODSVp/J1ef7L6OtvBkaWxzO4tLGiivOE5u2Kc';
  private readonly options: argon2.Options & { type: number } = {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  };

  hash(password: string): Promise<string> {
    return argon2.hash(password, this.options);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  dummyVerify(password: string): Promise<boolean> {
    return this.verify(this.dummyHash, password);
  }
}
