import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as Argon2 from 'argon2';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/HttpException.filter';
import { ApiResponseInterceptor } from '../src/common/interceptors/ApiResponse.interceptor';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';

class InMemoryRedisService {
  private readonly store = new Map<string, string>();
  private readonly counters = new Map<string, number>();

  public async Connect(): Promise<void> {}

  public async SetKey(key: string, value: string): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }

  public async GetKey(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  public async DeleteKey(key: string): Promise<number> {
    const existed = this.store.delete(key) || this.counters.delete(key);
    return existed ? 1 : 0;
  }

  public async IncrementKey(key: string): Promise<number> {
    const next = (this.counters.get(key) ?? 0) + 1;
    this.counters.set(key, next);
    return next;
  }

  public async ExpireKey(): Promise<number> {
    return 1;
  }

  public async GetTtl(): Promise<number> {
    return -1;
  }
}

describe('Auth/Admin Regression (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const redisServiceMock = new InMemoryRedisService();
  const testSuffix = Date.now().toString();
  const createdUserIds = new Set<string>();
  const superAdminUsername = `e2e_super_${testSuffix}`;
  const adminUsername = `e2e_admin_${testSuffix}`;
  const userUsername = `e2e_user_${testSuffix}`;
  const testPassword = 'Aa123456';
  let superAdminId = '';
  let userId = '';
  let superAdminAccessToken = '';
  let adminAccessToken = '';
  let userAccessToken = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(redisServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api', {
      exclude: [
        { path: 'health', method: RequestMethod.GET },
      ],
    });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    await app.init();

    prismaService = app.get(PrismaService);

    const pepper = process.env.PASSWORD_PEPPER ?? '';
    const passwordHash = await Argon2.hash(`${testPassword}${pepper}`);

    const superAdmin = await prismaService.user.create({
      data: {
        username: superAdminUsername,
        displayName: 'E2E Super Admin',
        passwordHash,
        role: 'super_admin',
      },
    });
    const admin = await prismaService.user.create({
      data: {
        username: adminUsername,
        displayName: 'E2E Admin',
        passwordHash,
        role: 'admin',
      },
    });

    await prismaService.systemSetting.deleteMany({
      where: { key: 'public_user_register_enabled' },
    });

    superAdminId = superAdmin.id;
    createdUserIds.add(superAdmin.id);
    createdUserIds.add(admin.id);

    const superAdminLogin = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ account: superAdminUsername, password: testPassword })
      .expect(201);
    superAdminAccessToken = superAdminLogin.body.data.accessToken;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ account: adminUsername, password: testPassword })
      .expect(201);
    adminAccessToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await prismaService.systemSetting.deleteMany({
      where: { key: 'public_user_register_enabled' },
    });

    const ids = Array.from(createdUserIds);
    if (ids.length > 0) {
      await prismaService.auditLog.deleteMany({
        where: {
          OR: [
            { userId: { in: ids } },
            { operatorUserId: { in: ids } },
          ],
        },
      });
      await prismaService.userSession.deleteMany({ where: { userId: { in: ids } } });
      await prismaService.user.deleteMany({ where: { id: { in: ids } } });
    }

    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.code).toBe(200);
        expect(res.body.msg).toBe('success');
        expect(res.body.data.status).toBe('ok');
      });
  });

  it('/api/admin/system-settings (GET) should return register setting for admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/system-settings')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(response.body.code).toBe(200);
    expect(response.body.data.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: 'public_user_register_enabled',
        value: 'false',
      }),
    ]));
  });

  it('/api/v1/auth/register (POST) should reject when public register is disabled', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        username: userUsername,
        displayName: 'E2E User',
        password: testPassword,
        phone: '13800138000',
      })
      .expect(403);

    expect(response.body.code).toBe(403);
  });

  it('/api/admin/system-settings/:key (PATCH) should enable public register', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/admin/system-settings/public_user_register_enabled')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ value: true })
      .expect(200);

    expect(response.body.code).toBe(200);
    expect(response.body.data.key).toBe('public_user_register_enabled');
    expect(response.body.data.value).toBe('true');
  });

  it('/api/v1/auth/register (POST) should register with displayName after setting enabled', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        username: userUsername,
        displayName: 'E2E User',
        password: testPassword,
        phone: '13800138000',
      })
      .expect(201);

    expect(response.body.code).toBe(200);
    expect(response.body.data.user.username).toBe(userUsername);
    expect(response.body.data.user.displayName).toBe('E2E User');

    userAccessToken = response.body.data.accessToken;
    userId = response.body.data.user.id;
    createdUserIds.add(userId);
  });

  it('/api/v1/auth/login (POST) should login from v1 endpoint', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        account: userUsername,
        password: testPassword,
      })
      .expect(201);

    expect(response.body.code).toBe(200);
    expect(response.body.data.user.username).toBe(userUsername);
    userAccessToken = response.body.data.accessToken;
  });

  it('/api/admin/auth/me (GET) should return current user profile', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/auth/me')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(200);

    expect(response.body.data.username).toBe(userUsername);
    expect(response.body.data.displayName).toBe('E2E User');
  });

  it('/admin/users (GET) should return paged users for super admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/users?page=1&pageSize=10')
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .expect(200);

    expect(response.body.data.pageSize).toBe(10);
    expect(response.body.data.items.some((item: { username: string }) => item.username === userUsername)).toBe(true);
  });

  it('/admin/users (POST) should create user for admin', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        username: `created_user_${testSuffix}`,
        displayName: 'Created User',
        password: testPassword,
        role: 'user',
      })
      .expect(201);

    expect(response.body.code).toBe(200);
    expect(response.body.data.username).toBe(`created_user_${testSuffix}`);
    expect(response.body.data.role).toBe('user');
    createdUserIds.add(response.body.data.id);
  });

  it('/admin/users (POST) should reject admin creating admin role', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        username: `created_admin_${testSuffix}`,
        password: testPassword,
        role: 'admin',
      })
      .expect(403);

    expect(response.body.code).toBe(403);
  });

  it('/admin/users/:id/sessions (GET) should return user sessions', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/admin/users/${userId}/sessions`)
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .expect(200);

    expect(Array.isArray(response.body.data.items)).toBe(true);
    expect(response.body.data.items.length).toBeGreaterThan(0);
  });

  it('/admin/users/:id/login-history (GET) should return login history', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/admin/users/${userId}/login-history?page=1&pageSize=10`)
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .expect(200);

    expect(Array.isArray(response.body.data.items)).toBe(true);
    expect(response.body.data.items.some((item: { action: string }) => item.action === 'auth.login.success')).toBe(true);
  });

  it('/admin/users/audit-logs/list (GET) should return audit logs for super admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/users/audit-logs/list?page=1&pageSize=10')
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .expect(200);

    expect(Array.isArray(response.body.data.items)).toBe(true);
  });

  it('admin should not view super admin detail', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/admin/users/${superAdminId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(403);

    expect(response.body.code).toBe(403);
  });
});
