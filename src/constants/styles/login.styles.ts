// Hoja de estilos
import { StyleSheet } from 'react-native';
import { FontFamily, Spacing, FontWeight, Border } from '@/constants/theme';

const ORIGINAL_WIDTH_HORIZONTAL_LOGO = 225;
const ORIGINAL_HEIGHT_HORIZONTAL_LOGO = 25;
const ASPECT_RATIO_HORIZONTAL_LOGO = ORIGINAL_WIDTH_HORIZONTAL_LOGO / ORIGINAL_HEIGHT_HORIZONTAL_LOGO;

export const createHorizontalLogoStyle = (theme: any) => StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    logo: {
      width: '100%',
      aspectRatio: ASPECT_RATIO_HORIZONTAL_LOGO,
      tintColor: theme.logo
    }
});