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
