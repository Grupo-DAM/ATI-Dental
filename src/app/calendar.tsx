import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import React, { useState, useEffect } from 'react';

import * as Calendar from 'expo-calendar';

import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';

interface EventCreationProps {
  date: Date;
  time: Date;
  title: string;
  notes?: string;
}

export default function TabThreeScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const [dateText, setDateText] = useState('');
  const [timeText, setTimeText] = useState('');

  const [time, setTime] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [status, requestPermission] = Calendar.useCalendarPermissions();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  const showDatePicker = () => {
    setShow(true);
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (event.type === 'set' && selectedDate) {
      const currentDate = selectedDate;
      setDate(currentDate);

      const day = String(currentDate.getDate()).padStart(2, '0');
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const year = currentDate.getFullYear();

      const formatDate = `${day}-${month}-${year}`;
      setDateText(formatDate);
    } else if (event.type === 'dismissed') {
      setShow(false);
    }
  };
  const onChangeTime = (event: DateTimePickerEvent, selectedTime?: Date) => {
      // Hide picker for Android right away after selection
      if (Platform.OS === 'android') {
        setShowPicker(false);
      }

      if (selectedTime) {
        setTime(selectedTime);
        setTimeText(formatTime(selectedTime))
      } else if (event.type === 'dismissed') {
        setShowPicker(false);
      }
  };
  const formatTime = (date: Date) => {
     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Función asíncrona auxiliar para crear un calendario local en Android si no existe ninguno modificable
  const createAndroidFallbackCalendar = async () => {
    const defaultCalendarSource = { isLocalAccount: true, name: 'Expo Calendar', type: 'LOCAL' };
    const newCalendarId = await Calendar.createCalendarAsync({
      title: 'Citas App',
      color: '#007AFF',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultCalendarSource.name,
      source: defaultCalendarSource,
      name: 'internal_citas',
      ownerAccount: 'internal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
    return newCalendarId;
  };

  // Lógica principal de integración con Expo Calendar
  const handleSaveEvent = async () => {
    try {
      // Solicitar permisos nativos del sistema
      if (!status || status.status !== 'granted') {
        const permission = await requestPermission();

        // Si el usuario lo rechaza en el diálogo emergente
        if (permission.status !== 'granted') {
          Alert.alert('Permiso Denegado', 'Se necesitan permisos de calendario para guardar la cita.');
          return;
        }
      }

      // Fusionar los estados de 'date' y 'time' en un único objeto Date
      const startDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes()
      );

      // Duración estándar del evento: 1 Hora
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      // Obtener el ID del calendario destino
      let calendarId: string;

      if (Platform.OS === 'ios') {
        const defaultCalendar = await Calendar.getDefaultCalendarAsync();
        calendarId = defaultCalendar.id;
      } else {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const writableCalendar = calendars.find(cal => cal.allowsModifications);

        if (!writableCalendar) {
          calendarId = await createAndroidFallbackCalendar();
        } else {
          calendarId = writableCalendar.id;
        }
      }

      // Insertar el evento en el almacenamiento nativo del teléfono
       await Calendar.createEventAsync(calendarId, {
        title: 'Cita Médica / PoC',
        startDate: startDate,
        endDate: endDate,
        timeZone: 'GMT',
        notes: 'Simulación de PoC de integración con el calendario nativo.',
      });

      Alert.alert('Éxito', 'La cita ha sido añadida a tu calendario de forma nativa.');

    } catch (error: any) {
      console.error("Error al escribir en el calendario: ", error);
      Alert.alert('Error', 'No se pudo guardar el evento: ' + error.message);
    }
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Agendar Cita</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Esta es una simulación de agendar cita{'\n'}
            para la PoC de integración con el calendario.
          </ThemedText>

          <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/calendar/" asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.linkButton}>
                <ThemedText type="link">Expo Calendar documentation</ThemedText>
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'arrow.up.right.square', android: 'link', web: 'link' }}
                  size={12}
                />
              </ThemedView>
            </Pressable>
          </ExternalLink>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
            <Text style={styles.label}>Seleccionar Fecha:</Text>
            <Pressable onPress={showDatePicker}>
                <View pointerEvents="none">
                <TextInput
                    style={styles.input}
                    placeholder="DD-MM-AAAA"
                    value={dateText}
                    editable={false}
                  />
                </View>
            </Pressable>

            {show && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onChangeDate}
                    maximumDate={new Date(2030, 11, 31)}
                    minimumDate={new Date(2000, 0, 1)}
                />
            )}

            <Text style={styles.label}>Seleccionar Hora:</Text>
            <Pressable onPress={() => setShowPicker(true)}>
                <View pointerEvents="none">
                <TextInput
                    style={styles.input}
                    placeholder="HH:MM"
                    value={timeText}
                    editable={false}
                  />
                </View>
            </Pressable>

            {showPicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeTime}
                />
            )}
        </ThemedView>

        <ThemedView style={styles.buttons}>
            <Pressable
                style={({ pressed }) => [
                        styles.buttonOutlined,
                        pressed && styles.buttonPressed]}
                onPress={() => Alert.alert('Cancelado', 'Operación cancelada por el usuario.')}
            >
                <Text style={styles.textOutlined}>Cancelar</Text>
            </Pressable>

            <Pressable
                style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed]}
                onPress={handleSaveEvent}
            >
                <Text style={styles.text}>Guardar</Text>
            </Pressable>

        </ThemedView>

        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    buttons: {
        paddingTop: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 1,
    },
    button: {
        backgroundColor: '#00AEEF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonOutlined: {
        backgroundColor: '#f9f9f9',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
  buttonPressed: {
    backgroundColor: '#0051A8',
    opacity: 0.9,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  textOutlined: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  collapsibleContent: {
    alignItems: 'center',
  },
  imageTutorial: {
    width: '100%',
    aspectRatio: 296 / 171,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  imageReact: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
});
