import { fetchRetentionMetrics } from '@/services/retention-service';
import { Config } from '@/constants/config';

describe('Retention Service (Mobile App client)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('successfully fetches retention data from the serverless endpoint', async () => {
    const mockData = {
      status: 'success',
      dia1: 80,
      dia7: 60,
      dia30: 35,
      overallRetentionRate: 58,
      totalCohortUsers: 100,
    };

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await fetchRetentionMetrics('https://mock-worker.dev/metrics/retention');

    expect(result.success).toBe(true);
    expect(result.data?.dia1).toBe(80);
    expect(result.data?.dia7).toBe(60);
    expect(result.data?.dia30).toBe(35);
    expect(result.data?.overallRetentionRate).toBe(58);
  });

  it('handles non-ok HTTP responses', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const result = await fetchRetentionMetrics('https://mock-worker.dev/metrics/retention');

    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
  });

  it('handles network failure or exceptions safely', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network disconnected'));

    const result = await fetchRetentionMetrics('https://mock-worker.dev/metrics/retention');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network disconnected');
  });

  it('handles error when rejection has no message property', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue('Simple string error');

    const result = await fetchRetentionMetrics('https://mock-worker.dev/metrics/retention');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Error de conexión con el Worker de retención');
  });

  it('uses default retention endpoint from Config when none provided', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 'success' }),
    });

    await fetchRetentionMetrics();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      Config.serverless.retentionEndpoint,
      expect.objectContaining({ method: 'GET' })
    );
  });
});
