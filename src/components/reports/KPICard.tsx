import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export type KPICardProp = {
    tinyType: boolean;
    label?: string;
    value?: any;
    iconName?: IoniconName;
    valueTestID?: string;
    cardTestID?: string;
    loading?: boolean;
    hasSubLabel?: boolean;
    accentSubLabel?: boolean;
    subLabel?: string;
}

export function KPICard(
    {
       tinyType = false,
       label,
       value,
       iconName,
       valueTestID,
       cardTestID,
       hasSubLabel = false,
       accentSubLabel = false,
       subLabel = '...',
       loading = false
    }
    : Readonly<KPICardProp>) {
    const theme = useTheme();
    const styles = createStyle(theme);

    const iconSize = tinyType ? 16 : 24;

    return(
        <View style={styles.kpiCardWrapper}>
            {tinyType ? (
                <View style={styles.kpiCardThree} testID={cardTestID}>
                  <View style={styles.kpiHeaderSmall}>
                    <Ionicons name={iconName} size={iconSize} color={theme.logo} />
                    <Text style={styles.kpiLabelSmall}>{label}</Text>
                  </View>
                  <Text style={styles.kpiValueSmall} testID={valueTestID}>
                    {value}
                  </Text>
                  {hasSubLabel && <Text style={ accentSubLabel ? (styles.kpiSubSmallPositive) : (styles.kpiSubSmall)}>{subLabel}</Text>}
                </View>
            ) : (
                <View style={styles.kpiCard} testID={cardTestID}>
                  <View style={styles.kpiIconWrapper}>
                    <Ionicons name={iconName} size={iconSize} color={theme.logo} />
                  </View>
                  <View style={styles.kpiTextWrapper}>
                    <Text style={styles.kpiLabel}>{label}</Text>
                    <Text style={styles.kpiValue} testID={valueTestID}>
                      {loading ? '...' : value}
                    </Text>
                  </View>
                </View>
            )}
        </View>
    );
}

const createStyle = (theme:any) => StyleSheet.create({
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  kpiCardWrapper: {
    flex: 1,
    paddingTop: 8,
    borderRadius: 12,
    backgroundColor: theme.main,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  kpiCard: {
    flex:1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundElement,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  kpiIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.accentBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTextWrapper: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: theme.breadcrumbSeparator,
    letterSpacing: 0.4,
    fontFamily: 'Open Sans',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.reportValueText,
    fontFamily: 'Open Sans',
  },
  kpiCardThree: {
    flex:1,
    backgroundColor: theme.backgroundElement,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  kpiLabelSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.pageSubtitle,
    fontFamily: 'Open Sans',
    paddingRight: 12
  },
  kpiValueSmall: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.reportValueText,
    fontFamily: 'Open Sans',
    marginBottom: 2,
  },
  kpiSubSmall: {
    fontSize: 11,
    color: theme.breadcrumbSeparator,
    fontFamily: 'Open Sans',
  },
  kpiSubSmallPositive: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.positive,
    fontFamily: 'Open Sans',
  },
});