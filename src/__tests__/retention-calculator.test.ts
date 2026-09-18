import { calculateRetentionFromEntities } from '../../workers/retention-worker/src/retention-calculator';
import { UserEntity, SessionEntity } from '../../workers/retention-worker/src/types';

describe('Retention Calculator (Cloudflare Worker logic)', () => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const NOW = 1700000000000;

  it('calculates 100% retention when all eligible users return in windows', () => {
    // Usuario registrado hace 35 días
    const users: UserEntity[] = [
      { id: 'user1', createdAt: NOW - 35 * ONE_DAY_MS },
    ];

    const sessions: SessionEntity[] = [
      // Sesión en Día 1 (+24h)
      { id: 's1', userId: 'user1', timestamp: NOW - 35 * ONE_DAY_MS + 25 * 3600 * 1000 },
      // Sesión en Día 7 (+7 días)
      { id: 's2', userId: 'user1', timestamp: NOW - 35 * ONE_DAY_MS + 7 * ONE_DAY_MS },
      // Sesión en Día 30 (+30 días)
      { id: 's3', userId: 'user1', timestamp: NOW - 35 * ONE_DAY_MS + 30 * ONE_DAY_MS },
    ];

    const result = calculateRetentionFromEntities(users, sessions, NOW);

    expect(result.status).toBe('success');
    expect(result.dia1).toBe(100);
    expect(result.dia7).toBe(100);
    expect(result.dia30).toBe(100);
    expect(result.overallRetentionRate).toBe(100);
    expect(result.totalCohortUsers).toBe(1);
    expect(result.breakdown?.day1Returned).toBe(1);
    expect(result.breakdown?.day7Returned).toBe(1);
    expect(result.breakdown?.day30Returned).toBe(1);
  });

  it('calculates 0% retention when users have no return sessions', () => {
    const users: UserEntity[] = [
      { id: 'user1', createdAt: NOW - 35 * ONE_DAY_MS },
      { id: 'user2', createdAt: NOW - 35 * ONE_DAY_MS },
    ];

    const sessions: SessionEntity[] = [];

    const result = calculateRetentionFromEntities(users, sessions, NOW);

    expect(result.status).toBe('success');
    expect(result.dia1).toBe(0);
    expect(result.dia7).toBe(0);
    expect(result.dia30).toBe(0);
    expect(result.overallRetentionRate).toBe(0);
    expect(result.totalCohortUsers).toBe(2);
  });

  it('handles partial cohorts where some users only reached Day 1 or Day 7', () => {
    const users: UserEntity[] = [
      // Usuario antiguo (35 días)
      { id: 'oldUser', createdAt: NOW - 35 * ONE_DAY_MS },
      // Usuario nuevo (hace 3 días, no elegible para D7 ni D30)
      { id: 'newUser', createdAt: NOW - 3 * ONE_DAY_MS },
    ];

    const sessions: SessionEntity[] = [
      // newUser regresa en D1
      { id: 's1', userId: 'newUser', timestamp: NOW - 3 * ONE_DAY_MS + 24 * 3600 * 1000 },
      // oldUser regresa en D7
      { id: 's2', userId: 'oldUser', timestamp: NOW - 35 * ONE_DAY_MS + 7 * ONE_DAY_MS },
    ];

    const result = calculateRetentionFromEntities(users, sessions, NOW);

    expect(result.status).toBe('success');
    // Para D1: 2 elegibles, 1 regresó -> 50%
    expect(result.dia1).toBe(50);
    // Para D7: 1 elegible, 1 regresó -> 100%
    expect(result.dia7).toBe(100);
    // Para D30: 1 elegible, 0 regresó -> 0%
    expect(result.dia30).toBe(0);
    // Overall: promedio de 50, 100, 0 = 50%
    expect(result.overallRetentionRate).toBe(50);
  });

  it('handles empty user list gracefully without NaN', () => {
    const result = calculateRetentionFromEntities([], [], NOW);

    expect(result.status).toBe('success');
    expect(result.dia1).toBe(0);
    expect(result.dia7).toBe(0);
    expect(result.dia30).toBe(0);
    expect(result.overallRetentionRate).toBe(0);
    expect(result.totalCohortUsers).toBe(0);
  });
});

import { getRetentionMetrics } from '../../workers/retention-worker/src/retention-calculator';

describe('getRetentionMetrics (Firestore REST integration & fallback)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('reads precalculated metrics from metricas_retencion/actual when available (integerValue)', async () => {
    globalThis.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('metricas_retencion/actual')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              fields: {
                dia1: { integerValue: '80' },
                dia7: { integerValue: '50' },
                dia30: { integerValue: '30' },
                totalUsuariosCohorte: { integerValue: '120' },
              },
            }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    const result = await getRetentionMetrics({
      FIREBASE_PROJECT_ID: 'ati-dental',
      FIREBASE_API_KEY: 'test-key',
    });

    expect(result.status).toBe('success');
    expect(result.source).toBe('firestore-live');
    expect(result.dia1).toBe(80);
    expect(result.dia7).toBe(50);
    expect(result.dia30).toBe(30);
    expect(result.overallRetentionRate).toBe(53);
    expect(result.totalCohortUsers).toBe(120);
  });

  it('reads precalculated metrics with doubleValue and totalCohortUsers', async () => {
    globalThis.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('metricas_retencion/actual')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              fields: {
                dia1: { doubleValue: 60.5 },
                dia7: { doubleValue: 40.2 },
                dia30: { doubleValue: 20.1 },
                totalCohortUsers: { integerValue: '90' },
              },
            }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    const result = await getRetentionMetrics({});

    expect(result.status).toBe('success');
    expect(result.source).toBe('firestore-live');
    expect(result.dia1).toBe(60.5);
    expect(result.totalCohortUsers).toBe(90);
  });

  it('computes cohort from usuarios and sesiones REST API when precalculated doc is 404', async () => {
    const NOW_ISO = new Date().toISOString();
    const D35_AGO = new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString();
    const D1_SESSION = new Date(Date.now() - 35 * 24 * 3600 * 1000 + 24 * 3600 * 1000).toISOString();

    globalThis.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('metricas_retencion/actual')) {
        return Promise.resolve({ ok: false, status: 404 });
      }
      if (url.includes('/usuarios')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              documents: [
                {
                  name: 'projects/p/databases/d/documents/usuarios/u1',
                  createTime: D35_AGO,
                  fields: {
                    fechaCreacion: { timestampValue: D35_AGO },
                    estado: { stringValue: 'activo' },
                  },
                },
                {
                  name: 'projects/p/databases/d/documents/usuarios/u2',
                  createTime: D35_AGO,
                  fields: {
                    fechaCreacion: { stringValue: 'invalid-date' },
                  },
                },
              ],
            }),
        });
      }
      if (url.includes('/sesiones')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              documents: [
                {
                  name: 'projects/p/databases/d/documents/sesiones/s1',
                  fields: {
                    userId: { stringValue: 'u1' },
                    fecha: { timestampValue: D1_SESSION },
                  },
                },
                {
                  name: 'projects/p/databases/d/documents/sesiones/s2',
                  fields: {
                    usuarioId: { stringValue: 'u2' },
                    tiempoInicio: { stringValue: D35_AGO },
                  },
                },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    const result = await getRetentionMetrics({
      FIREBASE_PROJECT_ID: 'ati-dental',
      FIREBASE_API_KEY: 'abc',
    });

    expect(result.status).toBe('success');
    expect(result.source).toBe('computed-cohort');
    expect(result.totalCohortUsers).toBe(2);
  });

  it('returns cached-metrics fallback when firestore REST calls reject', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network offline'));

    const result = await getRetentionMetrics({});

    expect(result.status).toBe('success');
    expect(result.source).toBe('cached-metrics');
    expect(result.dia1).toBe(75);
    expect(result.dia7).toBe(45);
    expect(result.dia30).toBe(20);
    expect(result.overallRetentionRate).toBe(47);
  });

  it('returns cached-metrics fallback when usuarios array is empty', async () => {
    globalThis.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('metricas_retencion/actual')) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ documents: [] }),
      });
    });

    const result = await getRetentionMetrics({});

    expect(result.status).toBe('success');
    expect(result.source).toBe('cached-metrics');
  });

  it('handles documents with missing name and fallback fields (uid, createTime)', async () => {
    const NOW_ISO = new Date().toISOString();

    globalThis.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('metricas_retencion/actual')) {
        return Promise.resolve({ ok: false, status: 404 });
      }
      if (url.includes('/usuarios')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              documents: [
                {
                  // Sin name, sin createTime, sin fields
                },
              ],
            }),
        });
      }
      if (url.includes('/sesiones')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              documents: [
                {
                  // Sin name, usa createTime y uid
                  createTime: NOW_ISO,
                  fields: {
                    uid: { stringValue: 'user-uid' },
                  },
                },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    const result = await getRetentionMetrics({});

    expect(result.status).toBe('success');
    expect(result.source).toBe('computed-cohort');
  });
});
