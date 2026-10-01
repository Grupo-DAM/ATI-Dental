import { useEffect, useState } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';

import { firestore } from '@/config/firebase';
import {
  SOCIAL_COLLECTION,
  SocialPost,
  fetchSocialFeedFromApi,
  parseSocialPost,
} from '@/components/contact/social-feed';
import { Config } from '@/constants/config';

type FeedStatus = 'loading' | 'ready' | 'fallback';

export function useSocialFeed() {
  const netInfo = useNetInfo();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [status, setStatus] = useState<FeedStatus>('loading');

  useEffect(() => {
    const session = { cancelled: false, unsubscribe: undefined as undefined | (() => void) };

    if (netInfo.isConnected === false) {
      setPosts([]);
      setStatus('fallback');
      return;
    }

    setStatus('loading');

    const listenFirestore = () => {
      session.unsubscribe = firestore()
        .collection(SOCIAL_COLLECTION)
        .onSnapshot(
          (snapshot) => {
            if (session.cancelled) return;
            const parsed = snapshot.docs
              .map((doc) => parseSocialPost(doc.id, doc.data() as Record<string, unknown>))
              .filter((post): post is SocialPost => post != null);

            if (parsed.length > 0) {
              setPosts(parsed);
              setStatus('ready');
              return;
            }
            setPosts([]);
            setStatus('fallback');
          },
          () => {
            if (session.cancelled) return;
            setPosts([]);
            setStatus('fallback');
          },
        );
    };

    void (async () => {
      try {
        const fromApi = await fetchSocialFeedFromApi(Config.social.feedApi);
        if (session.cancelled) return;
        if (fromApi.length > 0) {
          setPosts(fromApi);
          setStatus('ready');
          return;
        }
      } catch {
        if (session.cancelled) return;
      }

      listenFirestore();
      if (session.cancelled) {
        session.unsubscribe?.();
      }
    })();

    return () => {
      session.cancelled = true;
      session.unsubscribe?.();
    };
  }, [netInfo.isConnected]);

  return { posts, status };
}
