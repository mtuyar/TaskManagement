import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';

const ProfilScreen = () => {
  const { theme } = useTheme();
  const { user, userProfile, signOut } = useAuth();
  
  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
            }
          }
        },
      ]
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Profil"
        subtitle="Hesap ayarlarınızı görüntüleyin.."
        iconName="account-circle"
        colors={['#4A6FFF', '#6C63FF', '#8A84FF']}
      />
      
      <ScrollView style={styles.content}>
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <Image 
            source={{ 
              uri: userProfile?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' 
            }} 
            style={styles.profileImage} 
          />
          <Text style={[styles.name, { color: theme.text }]}>
            {userProfile?.display_name || 'Kullanıcı'}
          </Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>
            {user?.email || 'email@example.com'}
          </Text>
          

        </View>
        
        <View style={styles.menuContainer}>
          
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
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <Icon name="logout" size={24} color="#F44336" style={styles.menuIcon} />
            <Text style={[styles.menuText, styles.logoutText]}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 20,
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
    marginHorizontal: 16,
    marginBottom: 20,
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

  menuContainer: {
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