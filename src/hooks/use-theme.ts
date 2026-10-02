/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const isSupportedScheme = scheme === 'dark' || scheme === 'light';
  const theme = isSupportedScheme ? scheme : 'light';

  return Colors[theme];
}
