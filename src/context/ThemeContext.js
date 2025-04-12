import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mor tonlarına dayalı tema
const lightTheme = {
  primary: '#6200EE', // Ana mor renk
  primaryLight: '#BB86FC', // Açık mor
  primaryDark: '#3700B3', // Koyu mor
  secondary: '#03DAC6', // Turkuaz
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#757575',
  border: '#E0E0E0',
  shadow: '#000000',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#2196F3',
  icon: '#757575',
};

// Dark mode için hafif iyileştirilmiş renkler
const darkTheme = {
  primary: '#BB86FC', // Açık mor
  primaryLight: '#BB86FC', // Açık mor
  primaryDark: '#3700B3', // Koyu mor
  secondary: '#03DAC6', // Turkuaz
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#BBBBBB', // Biraz daha açık gri
  border: '#333333', // Biraz daha açık sınır
  shadow: '#000000',
  success: '#4CAF50', // Yeşil
  error: '#F44336', // Kırmızı
  warning: '#FFC107', // Sarı
  info: '#2196F3', // Mavi
  icon: '#BBBBBB', // Biraz daha açık ikon rengi
};

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Başlangıçta sistem temasını al
  const systemColorScheme = Appearance.getColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [isUserThemeSelected, setIsUserThemeSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // AsyncStorage'dan tema tercihini yükle
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const userSelectedTheme = await AsyncStorage.getItem('userSelectedTheme');
        const storedTheme = await AsyncStorage.getItem('themePreference');
        
        if (userSelectedTheme === 'true') {
          // Kullanıcı manuel olarak tema seçmiş
          setIsUserThemeSelected(true);
          setIsDarkMode(storedTheme === 'dark');
        } else {
          // Cihaz temasını kullan
          setIsUserThemeSelected(false);
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Tema tercihi yüklenirken hata oluştu:', error);
        setIsDarkMode(systemColorScheme === 'dark');
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, [systemColorScheme]);

  // Sistem teması değiştiğinde otomatik güncelleme
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('Sistem teması değişti:', colorScheme);
      if (!isUserThemeSelected) {
        setIsDarkMode(colorScheme === 'dark');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isUserThemeSelected]);

  // Tema değiştiğinde AsyncStorage'a kaydet
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem('themePreference', isDarkMode ? 'dark' : 'light');
      } catch (error) {
        console.error('Tema tercihi kaydedilirken hata oluştu:', error);
      }
    };

    if (!isLoading) {
      saveThemePreference();
    }
  }, [isDarkMode, isLoading]);

  // Tema değiştirme fonksiyonu
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
    setIsUserThemeSelected(true);
    // Kullanıcının manuel olarak tema seçtiğini kaydet
    AsyncStorage.setItem('userSelectedTheme', 'true');
  };

  // Sistem temasına dön
  const resetToSystemTheme = async () => {
    setIsUserThemeSelected(false);
    setIsDarkMode(Appearance.getColorScheme() === 'dark');
    await AsyncStorage.removeItem('userSelectedTheme');
  };

  // Mevcut temayı belirle
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDarkMode, 
      toggleTheme, 
      resetToSystemTheme,
      isUserThemeSelected 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};