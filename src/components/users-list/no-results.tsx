import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { View, Text, Platform, StyleSheet, TextInput, Pressable} from 'react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SearchIcon = require('@/assets/expo.icon/Assets/li_search.svg');
const NewUserIcon = require('@/assets/expo.icon/Assets/register-patient.svg');

type ListType = {
    general?: boolean
}

export function NoResultSearch ({general = true}: ListType) {
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = createStyles(theme);
    return (
          <View style = {styles.container}>
            <Image
              source={SearchIcon}
              contentFit="contain"
              style = {styles.lookingGlass}
            />
            <Text testID="no-search-result-message" style = {styles.text}>
                {general? t('admin-users.noResults'):t('patients-list.noResults')}
            </Text>
            <Text style = {[styles.text, {marginTop: 32}]}>
                {general? t('admin-users.noResultsQuestion'):t('patients-list.noResultsQuestion')}
            </Text>
            <Pressable style = {styles.newUserBtn}>
                <Image
                  source={NewUserIcon}
                  contentFit="contain"
                  style = {styles.newUserIcon}
                />
                <Text style = {styles.textBtn}>
                    {general? t('admin-users.registerUser'):t('patients-list.registerPatient')}
                </Text>
            </Pressable>
          </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingHorizontal: '20%',
        gap: 8,
        marginVertical: 'auto'
    },
    text: {
        color: theme.pageSubtitle,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    textBtn: {
        color: Colors.light.backgroundElement,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '400',
    },
    lookingGlass: {
        tintColor: theme.pageSubtitle,
        height: 67,
        width: 67
    },
    newUserIcon: {
       tintColor: Colors.light.backgroundElement,
       height: 28,
       width: 28
    },
    newUserBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 8,
        alignItems: 'center',
        gap: 16,
        borderRadius: 8,
        backgroundColor: theme.main
    }
});