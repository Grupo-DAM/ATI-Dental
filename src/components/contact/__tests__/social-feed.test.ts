import {
  fetchSocialFeedFromApi,
  formatSocialTimeAgo,
  groupSocialPosts,
  hasCompleteSocialFeed,
  officialSocialUrl,
  parseSocialPost,
  parseSocialPostsFromApi,
} from '@/components/contact/social-feed';

describe('social-feed', () => {
  it('parsea una publicación de Instagram', () => {
    const post = parseSocialPost('ig-1', {
      network: 'instagram',
      title: 'Nueva tecnología',
      content: 'Escáneres 3D',
      publishedAt: 'Hace 2 horas',
      url: 'https://instagram.com/p/1',
    });

    expect(post).toMatchObject({
      id: 'ig-1',
      network: 'instagram',
      title: 'Nueva tecnología',
      content: 'Escáneres 3D',
      url: 'https://instagram.com/p/1',
    });
  });

  it('rechaza documentos sin red o contenido', () => {
    expect(parseSocialPost('x', { network: 'tiktok', content: 'hola' })).toBeNull();
    expect(parseSocialPost('y', { network: 'facebook' })).toBeNull();
  });

  it('exige al menos 3 publicaciones por red', () => {
    const posts = [
      ...[1, 2, 3].map((n) => ({
        id: `ig-${n}`,
        network: 'instagram' as const,
        content: `ig ${n}`,
        publishedAt: '',
        url: 'https://instagram.com/ati_dental',
      })),
      ...[1, 2].map((n) => ({
        id: `fb-${n}`,
        network: 'facebook' as const,
        content: `fb ${n}`,
        publishedAt: '',
        url: 'https://facebook.com/ATIDentalOficial',
      })),
    ];

    expect(hasCompleteSocialFeed(posts)).toBe(false);
    expect(groupSocialPosts(posts).instagram).toHaveLength(3);
    expect(groupSocialPosts([...posts, {
      id: 'ig-4',
      network: 'instagram',
      content: 'ig 4',
      publishedAt: '',
      url: 'https://instagram.com/ati_dental',
    }]).instagram).toHaveLength(3);
    expect(officialSocialUrl('instagram')).toContain('instagram');
  });

  it('parsea el JSON del Worker', () => {
    const posts = parseSocialPostsFromApi({
      posts: [
        {
          id: 'ig-1',
          network: 'instagram',
          content: 'Blanqueamiento',
          url: 'https://instagram.com/p/1',
        },
        {
          id: 'fb-1',
          network: 'facebook',
          content: 'Agenda tu cita',
          url: 'https://facebook.com/posts/1',
        },
      ],
    });

    expect(posts).toHaveLength(2);
    expect(posts[1]).toMatchObject({ network: 'facebook', content: 'Agenda tu cita' });
  });

  it('formatea timestamps ISO como hace minutos, horas o días', () => {
    const now = Date.parse('2026-09-30T22:00:00.000Z');
    expect(formatSocialTimeAgo(new Date(now - 5 * 60_000).toISOString(), now)).toBe('Hace 5 minutos');
    expect(formatSocialTimeAgo(new Date(now - 2 * 3_600_000).toISOString(), now)).toBe('Hace 2 horas');
    expect(formatSocialTimeAgo(new Date(now - 3 * 86_400_000).toISOString(), now)).toBe('Hace 3 días');
    expect(formatSocialTimeAgo('Hace 2 horas', now)).toBe('Hace 2 horas');
    expect(formatSocialTimeAgo('30 Oct', now)).toBe('30 Oct');
  });

  it('devuelve vacío si el Worker falla', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as typeof fetch;
    await expect(fetchSocialFeedFromApi('https://example.test/feed')).resolves.toEqual([]);
  });
});
