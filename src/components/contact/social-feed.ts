import { Config } from '@/constants/config';
import { parseFlexibleTimestamp } from '@/components/reports/utils/reports-utils';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';

const ALREADY_RELATIVE = /^(hace|ago)\s/i;
const RELATIVE_WORD = /^(hoy|ayer|today|yesterday)$/i;
const ABSOLUTE_TIMESTAMP = /^\d{4}-\d{2}-\d{2}/;

export type SocialNetwork = 'instagram' | 'facebook';

export type SocialPost = {
  id: string;
  network: SocialNetwork;
  title?: string;
  content: string;
  imageUrl?: string;
  author?: string;
  publishedAt: string;
  url: string;
};

export const SOCIAL_COLLECTION = 'publicaciones_sociales';
export const MIN_POSTS_PER_NETWORK = 3;
export const VISIBLE_POSTS_PER_NETWORK = 3;

function timeAgoCopy(language: string) {
  return language.startsWith('en') ? en.contacts.timeAgo : es.contacts.timeAgo;
}

function isAbsoluteTimestamp(value: unknown): boolean {
  if (typeof value === 'number' || value instanceof Date) return true;
  if (typeof value === 'string') return ABSOLUTE_TIMESTAMP.test(value.trim());
  return value != null && typeof value === 'object';
}

function keptLabel(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || !ABSOLUTE_TIMESTAMP.test(trimmed)) return trimmed;
  if (ALREADY_RELATIVE.test(trimmed) || RELATIVE_WORD.test(trimmed)) return trimmed;
  return null;
}

function relativeUnit(count: number, singular: string, plural: string): string {
  if (count === 1) return singular;
  return plural.replace('{{count}}', String(count));
}

function relativeLabel(diff: number, language: string): string {
  const copy = timeAgoCopy(language);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return copy.justNow;
  if (minutes < 60) return relativeUnit(minutes, copy.minute, copy.minutes);
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return relativeUnit(hours, copy.hour, copy.hours);
  const days = Math.max(1, Math.floor(diff / 86_400_000));
  return relativeUnit(days, copy.day, copy.days);
}

export function formatSocialTimeAgo(value: unknown, now = Date.now(), language = 'es'): string {
  if (typeof value === 'string') {
    const kept = keptLabel(value);
    if (kept != null) return kept;
  }
  if (!isAbsoluteTimestamp(value)) return '';

  const ms = parseFlexibleTimestamp(value);
  if (ms == null) return '';
  return relativeLabel(Math.max(0, now - ms), language);
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function parseSocialPostsFromApi(payload: unknown): SocialPost[] {
  if (!payload || typeof payload !== 'object') return [];
  const raw = (payload as { posts?: unknown }).posts;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const data = item as Record<string, unknown>;
      const id = typeof data.id === 'string' && data.id.trim() ? data.id : `api-${index}`;
      return parseSocialPost(id, data);
    })
    .filter((post): post is SocialPost => post != null);
}

export async function fetchSocialFeedFromApi(url: string): Promise<SocialPost[]> {
  const response = await fetch(url);
  if (!response.ok) return [];
  return parseSocialPostsFromApi(await response.json());
}

export function parseSocialPost(id: string, data: Record<string, unknown> | undefined): SocialPost | null {
  if (!data) return null;
  const network = data.network === 'facebook' || data.network === 'instagram' ? data.network : null;
  if (!network) return null;

  const title = asText(data.title) || undefined;
  const content = asText(data.content) || asText(data.description) || title || '';
  if (!content) return null;

  const fallbackUrl = network === 'instagram' ? Config.social.instagram : Config.social.facebook;

  return {
    id,
    network,
    title,
    content,
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : undefined,
    author: typeof data.author === 'string' ? data.author : undefined,
    publishedAt: formatSocialTimeAgo(data.publishedAt ?? data.time),
    url: typeof data.url === 'string' && data.url.trim() ? data.url : fallbackUrl,
  };
}

export function groupSocialPosts(posts: SocialPost[]) {
  return {
    instagram: posts.filter((post) => post.network === 'instagram').slice(0, VISIBLE_POSTS_PER_NETWORK),
    facebook: posts.filter((post) => post.network === 'facebook').slice(0, VISIBLE_POSTS_PER_NETWORK),
  };
}

export function hasCompleteSocialFeed(posts: SocialPost[]): boolean {
  const grouped = groupSocialPosts(posts);
  return grouped.instagram.length >= MIN_POSTS_PER_NETWORK && grouped.facebook.length >= MIN_POSTS_PER_NETWORK;
}

export function officialSocialUrl(network: SocialNetwork): string {
  return network === 'instagram' ? Config.social.instagram : Config.social.facebook;
}
