import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, TextInput, Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { createFormFieldStyles } from '@/constants/styles/contact.styles'

export function FormField({
  iconName,
  iconColor,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  testID,
}: Readonly<{
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
  error?: string;
  testID?: string;
}>) {
    const theme = useTheme();
    const fieldStyles = useMemo(() => createFormFieldStyles(theme), [theme]);

  return (
    <View style={fieldStyles.wrapper}>
      <View style={fieldStyles.row}>
        <View style={[fieldStyles.iconBox, { backgroundColor: iconColor }]}>
          <Ionicons name={iconName} size={20} color="white" />
        </View>
        <TextInput
          testID={testID}
          style={[fieldStyles.input, !!error && fieldStyles.rowError]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholderColor}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
      {!!error && (
        <Text style={fieldStyles.errorText}>⚠ {error}</Text>
      )}
    </View>
  );
}