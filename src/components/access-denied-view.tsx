import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { createAccessDeniedStyles } from '@/constants/styles/access-denied.styles';
import { useTheme } from '@/hooks/use-theme';

export function AccessDeniedView({
  title,
  message,
  testID = 'access-denied-view',
}: Readonly<{
  title: string;
  message: string;
  testID?: string;
}>) {
  const theme = useTheme();
  const styles = useMemo(() => createAccessDeniedStyles(theme), [theme]);

  return (
    <View style={styles.content} testID={testID}>
      <Ionicons name="lock-closed-outline" size={56} color={theme.pageSubtitle} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
