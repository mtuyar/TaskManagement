import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
  RefreshControl,
  ActivityIndicator,
  AppState,
  Modal,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import AppHeader from '../components/AppHeader';

const { width } = Dimensions.get('window');

const OrtakScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { 
    groups, 
    invitations, 
    loading, 
    createGroup, 
    refreshData,
    respondToInvitation 
  } = useGroup();
  
  const [activeTab, setActiveTab] = useState('Takımlarım');
  const [refreshing, setRefreshing] = useState(false);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  // AppState değişikliklerini dinle - arka plandan döndüğünde verileri yenile
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && user) {
        // Uygulama aktif olduğunda verileri yenile
        refreshData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [user]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Renk paleti
  const colors = {
    primary: '#4A6FFF',
    secondary: '#6C63FF',
    accent: '#8A84FF',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',
    purple: '#9C27B0',
    teal: '#009688',
    orange: '#FF9800',
    pink: '#E91E63',
  };

  // Grup oluşturma fonksiyonu
  const handleCreateGroup = () => {
    setCreateGroupModalVisible(true);
  };

  // Grup oluşturma modal'ını kapat
  const closeCreateGroupModal = () => {
    setCreateGroupModalVisible(false);
    setNewGroupName('');
  };

  // Grup oluşturma işlemi
  const submitCreateGroup = async () => {
    if (!newGroupName?.trim()) {
      Alert.alert('Hata', 'Takım adı boş olamaz');
      return;
    }
    
    const result = await createGroup({
      name: newGroupName.trim(),
      description: `${newGroupName.trim()} takımı`,
    });
    
    if (result.success) {
      Alert.alert('Başarılı', 'Takım oluşturuldu!');
      closeCreateGroupModal();
      await refreshData();
    } else {
      Alert.alert('Hata', result.error || 'Takım oluşturulamadı');
    }
  };

  // Daveti kabul/reddet
  const handleInvitationResponse = async (invitationId, status) => {
    const result = await respondToInvitation(invitationId, status);
    
    if (result.success) {
      const message = status === 'accepted' ? 'Takıma katıldınız!' : 'Davet reddedildi';
      Alert.alert('Başarılı', message);
      await refreshData();
    } else {
      Alert.alert('Hata', result.error || 'İşlem gerçekleştirilemedi');
    }
  };


  // Tab bar bileşeni
  const renderTabBar = () => {
    const tabs = ['Takımlarım', 'Davetler', 'Ayarlar'];
    
    return (
      <View style={styles.tabBarContainer}>
        <View style={[styles.tabBar, { backgroundColor: theme.card }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && [styles.activeTabButton, { backgroundColor: colors.primary }]
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  { color: activeTab === tab ? '#FFFFFF' : theme.textSecondary }
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Boş durum bileşeni
  const renderEmptyState = () => {
    let iconName, title, subtitle, buttonText, onButtonPress;
    
    switch (activeTab) {
      case 'Takımlarım':
        iconName = 'account-group-outline';
        title = 'Henüz takım yok';
        subtitle = 'Arkadaşlarınızla ortak vazife takibi için takım oluşturun veya bir takıma katılın.';
        buttonText = 'Takım Oluştur';
        onButtonPress = handleCreateGroup;
        break;
      case 'Davetler':
        iconName = 'email-outline';
        title = 'Davet yok';
        subtitle = 'Henüz takım davetiniz bulunmuyor. Davet geldiğinde burada görüntülenecek.';
        buttonText = 'Yenile';
        onButtonPress = () => refreshData();
        break;
      case 'Ayarlar':
        iconName = 'cog-outline';
        title = 'Ortak Ayarlar';
        subtitle = 'Takım işbirliği ve bildirim ayarlarınızı yönetin.';
        buttonText = 'Ayarları Düzenle';
        onButtonPress = () => Alert.alert('Ayarlar', 'Yakında eklenecek!');
        break;
      default:
        iconName = 'alert-circle-outline';
        title = 'Bir şeyler ters gitti';
        subtitle = 'Lütfen tekrar deneyin.';
        buttonText = 'Yenile';
        onButtonPress = () => refreshData();
    }

    return (
      <View style={styles.emptyStateContainer}>
        <View style={[styles.emptyStateIconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Icon name={iconName} size={64} color={colors.primary} />
        </View>
        
        <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
          {title}
        </Text>
        
        <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
        
        <TouchableOpacity
          style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
          onPress={onButtonPress}
        >
          <Text style={styles.emptyStateButtonText}>
            {buttonText}
          </Text>
        </TouchableOpacity>
        
        {activeTab === 'Takımlarım' && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={() => {
              Alert.alert('Takıma Katıl', 'Yakında davet kodu ile katılma özelliği eklenecek!');
            }}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              Takıma Katıl
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Grup kartı bileşeni
  const renderGroupCard = (group) => (
    <TouchableOpacity
      key={group.group_id}
      style={[styles.groupCard, { backgroundColor: theme.card }]}
      onPress={() => {
        navigation.navigate('GroupDetail', {
          groupId: group.group_id,
          groupName: group.group_name
        });
      }}
    >
      <View style={styles.groupCardHeader}>
        <View style={[styles.groupAvatar, { backgroundColor: colors.primary + '20' }]}>
          <Icon name="account-group" size={24} color={colors.primary} />
        </View>
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, { color: theme.text }]}>
            {group.group_name}
          </Text>
          <Text style={[styles.groupDescription, { color: theme.textSecondary }]}>
            {group.description || 'Açıklama yok'}
          </Text>
        </View>
        <View style={styles.groupStats}>
          <Text style={[styles.groupStatsText, { color: theme.textSecondary }]}>
            {group.member_count} üye
          </Text>
          <Text style={[styles.groupStatsText, { color: colors.warning }]}>
            {group.pending_tasks} görev
          </Text>
        </View>
      </View>
      
      <View style={styles.groupActions}>
        <TouchableOpacity
          style={[styles.groupActionButton, { backgroundColor: colors.primary + '15' }]}
          onPress={() => {
            Alert.alert('Görevler', `${group.group_name} görevleri`);
          }}
        >
          <Icon name="format-list-checks" size={16} color={colors.primary} />
          <Text style={[styles.groupActionText, { color: colors.primary }]}>
            Görevler
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.groupActionButton, { backgroundColor: colors.teal + '15' }]}
          onPress={() => {
            Alert.alert('Üyeler', `${group.group_name} üyeleri`);
          }}
        >
          <Icon name="account-plus" size={16} color={colors.teal} />
          <Text style={[styles.groupActionText, { color: colors.teal }]}>
            Üyeler
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Davet kartı bileşeni
  const renderInvitationCard = (invitation) => (
    <View
      key={invitation.id}
      style={[styles.invitationCard, { backgroundColor: theme.card }]}
    >
      <View style={styles.invitationHeader}>
        <View style={[styles.invitationAvatar, { backgroundColor: colors.info + '20' }]}>
          <Icon name="email" size={24} color={colors.info} />
        </View>
        <View style={styles.invitationInfo}>
          <Text style={[styles.invitationTitle, { color: theme.text }]}>
            {invitation.group_name}
          </Text>
          <Text style={[styles.invitationSubtitle, { color: theme.textSecondary }]}>
            {invitation.inviter_username} tarafından davet edildiniz
          </Text>
          <Text style={[styles.invitationDate, { color: theme.textSecondary }]}>
            {new Date(invitation.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>
      
      <View style={styles.invitationActions}>
        <TouchableOpacity
          style={[styles.invitationButton, styles.declineButton, { backgroundColor: colors.error + '15' }]}
          onPress={() => handleInvitationResponse(invitation.id, 'declined')}
        >
          <Text style={[styles.invitationButtonText, { color: colors.error }]}>
            Reddet
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.invitationButton, styles.acceptButton, { backgroundColor: colors.success }]}
          onPress={() => handleInvitationResponse(invitation.id, 'accepted')}
        >
          <Text style={[styles.invitationButtonText, { color: '#FFFFFF' }]}>
            Kabul Et
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Ana içerik renderer
  const renderContent = () => {
    // Loading durumu
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Yükleniyor...
          </Text>
        </View>
      );
    }

    // Tab'a göre içerik göster
    const renderTabContent = () => {
      switch (activeTab) {
        case 'Takımlarım':
          if (!groups || groups.length === 0) {
            return renderEmptyState();
          }
          return (
            <View style={styles.listContainer}>
              {groups.map(renderGroupCard)}
            </View>
          );
          
        case 'Davetler':
          if (!invitations || invitations.length === 0) {
            return renderEmptyState();
          }
          return (
            <View style={styles.listContainer}>
              {invitations.map(renderInvitationCard)}
            </View>
          );
          
        case 'Ayarlar':
          return renderEmptyState();
          
        default:
          return renderEmptyState();
      }
    };

    return (
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderTabContent()}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Ortak Vazifeler"
        subtitle="Takım arkadaşlarınızla birlikte vazife takibi"
        iconName="account-group"
        colors={[colors.primary, colors.secondary, colors.accent]}
      />
      {renderTabBar()}
      {renderContent()}
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleCreateGroup}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Grup Oluşturma Modal */}
      <Modal
        visible={createGroupModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeCreateGroupModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Yeni Takım Oluştur
            </Text>
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="Takım adını girin"
              placeholderTextColor={theme.textSecondary}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus={true}
              maxLength={50}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { borderColor: theme.border }]}
                onPress={closeCreateGroupModal}
              >
                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>
                  İptal
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate, { backgroundColor: colors.primary }]}
                onPress={submitCreateGroup}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  Oluştur
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
    zIndex: 10,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 16,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  // Grup kartı stilleri
  groupCard: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  groupDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  groupStats: {
    alignItems: 'flex-end',
  },
  groupStatsText: {
    fontSize: 12,
    marginBottom: 2,
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  groupActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Davet kartı stilleri
  invitationCard: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  invitationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  invitationSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  invitationDate: {
    fontSize: 12,
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invitationButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  invitationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    // Stil zaten backgroundColor ile set ediliyor
  },
  acceptButton: {
    // Stil zaten backgroundColor ile set ediliyor
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width - 40,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonCreate: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrtakScreen; 