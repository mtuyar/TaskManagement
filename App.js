import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Platform, View, Text, StyleSheet, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import { requestNotificationPermissions } from './src/services/notificationService';

// Ana Ekranlar
import KisiselVazifeScreen from './src/screens/KisiselVazifeScreen';
import YapayZekaScreen from './src/screens/YapayZekaScreen';
import OrtakScreen from './src/screens/OrtakScreen';
import ProfilScreen from './src/screens/ProfilScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';

// Auth Ekranları
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

// Context Providers
import { TaskProvider } from './src/context/TaskContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { GroupProvider } from './src/context/GroupContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Ortak Stack Navigator
const OrtakStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="OrtakHome" 
        component={OrtakScreen}
        options={{ title: 'Ortak Vazifeler' }}
      />
      <Stack.Screen 
        name="GroupDetail" 
        component={GroupDetailScreen}
        options={{ title: 'Grup Detayı' }}
      />
    </Stack.Navigator>
  );
};

// Loading Screen Component
const LoadingScreen = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color="#4A6FFF" />
      <Text style={[styles.loadingText, { color: theme.text }]}>
        Yükleniyor...
      </Text>
    </View>
  );
};

// Auth Stack Navigator
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

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

// Main Tab Navigator
const MainTabNavigator = () => {
  const { theme, isDarkMode } = useTheme();
  const screenHeight = Dimensions.get('window').height;
  
  // Ekran yüksekliğine göre tab bar yüksekliği hesapla
  const tabBarHeight = Platform.OS === 'ios' 
    ? (screenHeight > 800 ? 85 : 70) 
    : (screenHeight > 800 ? 65 : 60);
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4A6FFF',
        tabBarInactiveTintColor: isDarkMode ? '#888888' : '#999999',
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
          height: tabBarHeight,
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? (screenHeight > 800 ? 25 : 15) : 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: Platform.OS === 'android' ? 8 : 5,
        },
        // Android'de animasyonları kapat
        animationEnabled: Platform.OS === 'ios',
        tabBarHideOnKeyboard: Platform.OS === 'android' ? false : true,
        tabBarItemStyle: {
          paddingTop: 0,
          alignItems: 'flex-start',
          paddingLeft: 15,
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
          animationEnabled: Platform.OS === 'ios',
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
          animationEnabled: Platform.OS === 'ios',
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
        name="Ortak"
        component={OrtakStack}
        options={{
          title: 'Ortak',
          headerShown: false,
          animationEnabled: Platform.OS === 'ios',
          tabBarLabel: ({ focused, color }) => (
            <TabBarLabel focused={focused} color={color}>
              Ortak
            </TabBarLabel>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon 
              focused={focused} 
              color={color} 
              size={size} 
              name="account-group" 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
          title: 'Profil',
          headerShown: false,
          animationEnabled: Platform.OS === 'ios',
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
  );
};

// Main App Content with Auth Logic
const AppContent = () => {
  const { theme, isDarkMode } = useTheme();
  const { user, loading, initializing } = useAuth();
  
  // Debug auth state
  useEffect(() => {
    console.log('App auth state:', {
      hasUser: !!user,
      email: user?.email,
      loading,
      initializing
    });
  }, [user, loading, initializing]);
  
  // Uygulama başladığında bildirim izinlerini kontrol et
  useEffect(() => {
    const checkPermissions = async () => {
      await requestNotificationPermissions();
    };
    
    checkPermissions();
  }, []);
  
  // StatusBar'ı uygulama başlangıcında ayarlayalım
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#4A6FFF');
      StatusBar.setBarStyle('light-content');
      StatusBar.setTranslucent(true);
    } else {
      StatusBar.setBackgroundColor('#4A6FFF');
      StatusBar.setBarStyle('light-content');
    }
  }, []);

  // Loading state - Longer timeout for better session recovery
  if (loading || initializing) {
    return <LoadingScreen />;
  }

  console.log('Rendering navigation with user:', !!user);

  return (
    <NavigationContainer
      theme={{
        colors: {
          background: theme.background,
          card: theme.card,
          text: theme.text,
          border: theme.border,
          primary: '#4A6FFF',
        },
        dark: isDarkMode,
      }}
      screenOptions={{
        animationEnabled: Platform.OS === 'ios',
        gestureEnabled: Platform.OS === 'ios',
      }}
    >
      {user ? <MainTabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <GroupProvider>
            <TaskProvider>
              <AppContent />
            </TaskProvider>
          </GroupProvider>
        </AuthProvider>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
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