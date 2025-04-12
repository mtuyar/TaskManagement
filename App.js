import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Platform, View, Text, StyleSheet, Dimensions } from 'react-native';
import * as Notifications from 'expo-notifications';
import { requestNotificationPermissions } from './src/services/notificationService';

// Ekranlar
import KisiselVazifeScreen from './src/screens/KisiselVazifeScreen';
import YapayZekaScreen from './src/screens/YapayZekaScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import ProfilScreen from './src/screens/ProfilScreen';

// Context Providers
import { TaskProvider } from './src/context/TaskContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const Tab = createBottomTabNavigator();

// Özel Tab Bar İkon Bileşeni
const TabBarIcon = ({ focused, color, size, name }) => {
  return (
    <View style={styles.tabIconContainer}>
      <Icon 
        name={name} 
        color={focused ? '#4A6FFF' : color} 
        size={size} 
        style={focused ? styles.activeIcon : null}
      />
    </View>
  );
};

// Özel Tab Bar Etiket Bileşeni
const TabBarLabel = ({ focused, color, children }) => {
  return (
    <Text 
      style={[
        styles.tabLabel, 
        { 
          color: focused ? '#4A6FFF' : color, 
          fontWeight: focused ? '600' : '400',
          opacity: focused ? 1 : 0.8
        }
      ]}
    >
      {children}
    </Text>
  );
};

// Özel Tab Bar Öğesi Bileşeni
const CustomTabBarItem = ({ focused, color, icon, label }) => {
  return (
    <View style={styles.customTabBarItem}>
      <Icon 
        name={icon} 
        color={color} 
        size={24} 
        style={[
          styles.customTabBarIcon,
          focused ? styles.activeIcon : null
        ]}
      />
      <Text 
        style={[
          styles.customTabBarLabel, 
          { 
            color, 
            fontWeight: focused ? '600' : '400',
            opacity: focused ? 1 : 0.8
          }
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const AppContent = () => {
  const { theme, isDarkMode } = useTheme();
  const screenHeight = Dimensions.get('window').height;
  
  // Ekran yüksekliğine göre tab bar yüksekliği hesapla
  // Daha büyük ekranlarda daha yüksek tab bar
  const tabBarHeight = Platform.OS === 'ios' 
    ? (screenHeight > 800 ? 85 : 70) 
    : (screenHeight > 800 ? 65 : 60);
  
  // Uygulama başladığında bildirim izinlerini kontrol et
  useEffect(() => {
    const checkPermissions = async () => {
      await requestNotificationPermissions();
    };
    
    checkPermissions();
  }, []);
  
  return (
    <NavigationContainer
      theme={{
        colors: {
          background: theme.background,
          card: theme.card,
          text: theme.text,
          border: theme.border,
          primary: '#673AB7',
        },
        dark: isDarkMode,
      }}
    >
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#4A6FFF',
          tabBarInactiveTintColor: isDarkMode ? '#888888' : '#999999',
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            borderTopWidth: 0.5, // İnce bir üst kenarlık
            height: tabBarHeight,
            paddingTop: 5, // Üst padding'i azalttım
            paddingBottom: Platform.OS === 'ios' ? (screenHeight > 800 ? 25 : 15) : 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 5,
          },
          tabBarItemStyle: {
            paddingTop: 0,
            alignItems: 'flex-start', // Sol hizalama
            paddingLeft: 15, // Sol padding ekledim
          },
          headerStyle: {
            backgroundColor: theme.card,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          },
          headerTitleStyle: {
            color: theme.text,
          },
          headerTitle: (props) => (
            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 18 }}>
              {props.children}
            </Text>
          ),
          tabBarLabelPosition: 'below-icon',
        }}
      >
        <Tab.Screen
          name="YapayZeka"
          component={YapayZekaScreen}
          options={{
            headerShown: false,
            title: 'Yapay Zeka',
            tabBarLabel: ({ focused, color }) => (
              <TabBarLabel focused={focused} color={color}>
                Yapay Zeka
              </TabBarLabel>
            ),
            tabBarIcon: ({ focused, color, size }) => (
              <TabBarIcon 
                focused={focused} 
                color={color} 
                size={size} 
                name="robot" 
              />
            ),
          }}
        />
        <Tab.Screen
          name="KisiselVazife"
          component={KisiselVazifeScreen}
          options={{
            headerShown: false,
            title: 'Kişisel Vazifeler',
            tabBarLabel: ({ focused, color }) => (
              <TabBarLabel focused={focused} color={color}>
                Vazifeler
              </TabBarLabel>
            ),
            tabBarIcon: ({ focused, color, size }) => (
              <TabBarIcon 
                focused={focused} 
                color={color} 
                size={size} 
                name="format-list-checks" 
              />
            ),
          }}
        />
        <Tab.Screen
          name="Analiz"
          component={AnalysisScreen}
          options={{
            title: 'Analiz',
            headerShown: false,
            tabBarLabel: ({ focused, color }) => (
              <TabBarLabel focused={focused} color={color}>
                Analiz
              </TabBarLabel>
            ),
            tabBarIcon: ({ focused, color, size }) => (
              <TabBarIcon 
                focused={focused} 
                color={color} 
                size={size} 
                name="chart-line" 
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profil"
          component={ProfilScreen}
          options={{
            title: 'Profil',
            tabBarLabel: ({ focused, color }) => (
              <TabBarLabel focused={focused} color={color}>
                Profil
              </TabBarLabel>
            ),
            tabBarIcon: ({ focused, color, size }) => (
              <TabBarIcon 
                focused={focused} 
                color={color} 
                size={size} 
                name="account" 
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TaskProvider>
          <AppContent />
        </TaskProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  activeIcon: {
    // Aktif ikon için stil
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  // Özel tab bar öğesi için stiller
  customTabBarItem: {
    flexDirection: 'row', // Yatay düzen
    alignItems: 'center',
    paddingTop: 10,
    paddingLeft: 15,
  },
  customTabBarIcon: {
    marginRight: 8, // İkon ile etiket arasında boşluk
  },
  customTabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});

// Bildirimleri yapılandır
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export default App; 