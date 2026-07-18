import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import { PrismaService } from '../src/database/prisma.service';

describe('GET /api/v1/health', () => {
  let app: INestApplication;
  const queryRaw = jest.fn();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: queryRaw })
      .compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    configureApplication(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the service health status', async () => {
    queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'jukwaa-api',
        environment: 'test',
        checks: { database: 'up' },
      }),
    );
    expect(response.body.timestamp).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });

  it('returns service unavailable without leaking database errors', async () => {
    queryRaw.mockRejectedValueOnce(
      new Error(
        'connection failed for postgresql://private:secret@db.internal/jukwaa',
      ),
    );

    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(503);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'error',
        service: 'jukwaa-api',
        environment: 'test',
        checks: { database: 'down' },
      }),
    );
    expect(JSON.stringify(response.body)).not.toContain('postgresql://');
    expect(JSON.stringify(response.body)).not.toContain('db.internal');
  });

  it('rejects unsafe requests without an explicitly trusted Origin', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'user', password: 'not-used' })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', 'https://attacker.example')
      .send({ identifier: 'user', password: 'not-used' })
      .expect(403);
  });

  it('allows a trusted Origin to reach normal request validation', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', 'http://localhost:5173')
      .send({})
      .expect(400);
  });
});
