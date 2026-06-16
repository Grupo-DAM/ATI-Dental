import i18n from '../index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(),
}));

describe('i18n Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with es as fallback', () => {
    expect(i18n.options.fallbackLng).toEqual(['es']);
  });

  it('should have en and es resources', () => {
    expect(i18n.options.resources).toHaveProperty('en');
    expect(i18n.options.resources).toHaveProperty('es');
  });

  describe('languageDetector', () => {
    const detector = i18n.services.languageDetector;

    it('should detect language from AsyncStorage if available', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('en');
      
      const callback = jest.fn();
      await detector.detect!(callback);
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('user-language');
      expect(callback).toHaveBeenCalledWith('en');
    });

    it('should fallback to device language if AsyncStorage is empty', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (Localization.getLocales as jest.Mock).mockReturnValue([{ languageCode: 'en' }]);
      
      const callback = jest.fn();
      await detector.detect!(callback);
      
      expect(callback).toHaveBeenCalledWith('en');
    });

    it('should fallback to es if device language is unsupported', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (Localization.getLocales as jest.Mock).mockReturnValue([{ languageCode: 'fr' }]);
      
      const callback = jest.fn();
      await detector.detect!(callback);
      
      expect(callback).toHaveBeenCalledWith('es');
    });

    it('should cache user language', async () => {
      await detector.cacheUserLanguage!('en');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('user-language', 'en');
    });
  });
});
