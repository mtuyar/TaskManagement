import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Switch, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../src/context/ThemeContext';

const ProfilScreen = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <Image 
          source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
          style={styles.profileImage} 
        />
        <Text style={[styles.name, { color: theme.text }]}>Ahmet Yılmaz</Text>
        <Text style={[styles.email, { color: theme.textSecondary }]}>ahmet.yilmaz@example.com</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>42</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tamamlanan</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>7</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Günlük Seri</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>85%</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Başarı</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.menuContainer}>
        <View style={[styles.menuItem, { borderBottomColor: theme.border }]}>
          <Icon name="bell-outline" size={24} color={theme.icon} style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: theme.text }]}>Bildirimler</Text>
          <View style={styles.menuValue}>
            <Switch 
              value={notificationsEnabled} 
              onValueChange={() => setNotificationsEnabled(prev => !prev)}
              trackColor={{ false: '#767577', true: theme.primary + '50' }}
              thumbColor={notificationsEnabled ? theme.primary : '#f4f3f4'}
            />
          </View>
        </View>
        
        <View style={[styles.menuItem, { borderBottomColor: theme.border }]}>
          <Icon name="theme-light-dark" size={24} color={theme.icon} style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: theme.text }]}>Karanlık Mod</Text>
          <View style={styles.menuValue}>
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: theme.primary + '50' }}
              thumbColor={isDarkMode ? theme.primary : '#f4f3f4'}
            />
          </View>
        </View>
        
        <View style={[styles.menuItem, { borderBottomColor: theme.border }]}>
          <Icon name="cog-outline" size={24} color={theme.icon} style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: theme.text }]}>Ayarlar</Text>
          <View style={styles.menuValue}>
            <Icon name="chevron-right" size={24} color={theme.icon} />
          </View>
        </View>
        
        <View style={[styles.menuItem, { borderBottomColor: theme.border }]}>
          <Icon name="help-circle-outline" size={24} color={theme.icon} style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: theme.text }]}>Yardım</Text>
          <View style={styles.menuValue}>
            <Icon name="chevron-right" size={24} color={theme.icon} />
          </View>
        </View>
        
        <View style={[styles.menuItem, { borderBottomColor: theme.border }]}>
          <Icon name="information-outline" size={24} color={theme.icon} style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: theme.text }]}>Hakkında</Text>
          <View style={styles.menuValue}>
            <Icon name="chevron-right" size={24} color={theme.icon} />
          </View>
        </View>
        
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]}>
          <Icon name="logout" size={24} color="#F44336" style={styles.menuIcon} />
          <Text style={[styles.menuText, styles.logoutText]}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  menuContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  menuValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValueText: {
    fontSize: 16,
    marginRight: 8,
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 16,
  },
  logoutText: {
    color: '#F44336',
  },
});

export default ProfilScreen; 