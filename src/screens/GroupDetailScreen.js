import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import AppHeader from '../components/AppHeader';

const GroupDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { 
    searchUsers, 
    inviteUserToGroup, 
    createTask, 
    getGroupTasks, 
    refreshData,
    getGroupMembers,
    toggleTaskCompletion,
    deleteTask,
    getGroupMemberScores,
    getUserGroupStats,
    getDailyActivity,
    getUserTaskPerformance,
    deleteGroup
  } = useGroup();
  
  const { groupId, groupName } = route.params;
  
  const [activeTab, setActiveTab] = useState('Görevler');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groupTasks, setGroupTasks] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [taskCompletions, setTaskCompletions] = useState({}); // taskId -> completed mapping
  const [memberScores, setMemberScores] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [taskPerformance, setTaskPerformance] = useState(null);
  
  // Modal states
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: 'Günlük',
    frequency: 'Günlük'
  });
  
  // Filtreleme state'i
  const [selectedFilter, setSelectedFilter] = useState('Tümü');

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

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  // Grup verilerini yükle
  const loadGroupData = async () => {
    setLoading(true);
    try {
      // Önce grup üyelerini kontrol et
      const membersResult = await getGroupMembers(groupId);
      if (!membersResult.success) {
        if (membersResult.error && membersResult.error.includes('Unauthorized')) {
          Alert.alert(
            'Grup Bulunamadı', 
            'Bu grup artık mevcut değil veya erişim yetkiniz yok.',
            [
              {
                text: 'Tamam',
                onPress: () => navigation.goBack(),
              },
            ]
          );
          return;
        }
      }
      
      // Grup üyesi ise diğer verileri yükle
      await loadGroupTasks();
      await loadGroupMembers();
      await loadAnalysisData();
    } catch (error) {
      console.error('Load group data error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Grup görevlerini yükle
  const loadGroupTasks = async () => {
    try {
      const result = await getGroupTasks(groupId);
      if (result.success) {
        const tasks = result.tasks || [];
        setGroupTasks(tasks);
        
        // Completion durumlarını set et
        const completions = {};
        tasks.forEach(task => {
          if (task.is_completed_by_user) {
            completions[task.id] = true;
          }
        });
        setTaskCompletions(completions);
      } else {
        console.error('Load group tasks error:', result.error);
      }
    } catch (error) {
      console.error('Load group tasks error:', error);
    }
  };

  // Grup üyelerini yükle
  const loadGroupMembers = async () => {
    try {
      const result = await getGroupMembers(groupId);
      if (result.success) {
        setGroupMembers(result.members || []);
      } else {
        // Unauthorized hatası - grup silinmiş veya erişim yok
        if (result.error && result.error.includes('Unauthorized')) {
          // Alert zaten loadGroupTasks'ta gösterildi, sadece return et
          return;
        }
        console.error('Load group members error:', result.error);
      }
    } catch (error) {
      console.error('Load group members error:', error);
      // Network veya diğer hatalar için de kontrol et
      if (error.message && error.message.includes('Unauthorized')) {
        // Alert zaten loadGroupTasks'ta gösterildi, sadece return et
        return;
      }
    }
  };

  // Analiz verilerini yükle
  const loadAnalysisData = async () => {
    try {
      // Üye skorlarını yükle
      const scoresResult = await getGroupMemberScores(groupId);
      if (scoresResult.success) {
        setMemberScores(scoresResult.scores);
      } else if (scoresResult.error && scoresResult.error.includes('Unauthorized')) {
        // Alert zaten loadGroupTasks'ta gösterildi, sadece return et
        return;
      }
      
      // Kişisel istatistikleri yükle
      if (user) {
        const statsResult = await getUserGroupStats(groupId, user.id);
        if (statsResult.success) {
          setUserStats(statsResult.stats);
        } else if (statsResult.error && statsResult.error.includes('Unauthorized')) {
          // Alert zaten loadGroupTasks'ta gösterildi, sadece return et
          return;
        }
        
        // Günlük aktivite verilerini yükle (son 7 gün)
        const activityResult = await getDailyActivity(groupId, user.id, 7);
        if (activityResult.success) {
          setDailyActivity(activityResult.activity);
        } else if (activityResult.error && activityResult.error.includes('Unauthorized')) {
          // Alert zaten loadGroupTasks'ta gösterildi, sadece return et
          return;
        }
        
        // Görev performans verilerini yükle
        const performanceResult = await getUserTaskPerformance(groupId, user.id);
        if (performanceResult.success) {
          setTaskPerformance(performanceResult.performance);
        } else if (performanceResult.error && performanceResult.error.includes('Unauthorized')) {
          // Alert zaten loadGroupTasks'ta gösterildi, sadece return et
          return;
        }
      }
    } catch (error) {
      console.error('Load analysis data error:', error);
      // Network veya diğer hatalar için de kontrol et
      if (error.message && error.message.includes('Unauthorized')) {
        // Alert zaten loadGroupTasks'ta gösterildi, sadece return et
        return;
      }
    }
  };

  // Kullanıcı ara
  const handleUserSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const result = await searchUsers(query);
      if (result.success) {
        setSearchResults(result.users || []);
      }
    } catch (error) {
      console.error('User search error:', error);
    }
  };

  // Kullanıcıyı davet et
  const handleInviteUser = async (userId) => {
    try {
      const result = await inviteUserToGroup(groupId, userId);
      
      if (result.success) {
        Alert.alert('Başarılı', 'Davet gönderildi!');
        setInviteModalVisible(false);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        Alert.alert('Hata', result.error || 'Davet gönderilemedi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    }
  };

  // Görev oluştur
  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      Alert.alert('Hata', 'Görev başlığı gerekli');
      return;
    }

    try {
      const result = await createTask({
        group_id: groupId,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        category: taskForm.category,
        frequency: taskForm.frequency,
      });

      if (result.success) {
        Alert.alert('Başarılı', 'Görev oluşturuldu!');
        setTaskModalVisible(false);
        setTaskForm({ title: '', description: '', category: 'Günlük', frequency: 'Günlük' });
        await loadGroupTasks();
      } else {
        Alert.alert('Hata', result.error || 'Görev oluşturulamadı');
      }
    } catch (error) {
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    }
  };

  // Görev sil
  const handleDeleteTask = (taskId) => {
    Alert.alert(
      'Görevi Sil',
      'Bu görevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteTask(taskId);
              
              if (result.success) {
                Alert.alert('Başarılı', 'Görev başarıyla silindi');
                await loadGroupTasks();
              } else {
                Alert.alert('Hata', result.error || 'Görev silinemedi');
              }
            } catch (error) {
              Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
            }
          },
        },
      ],
    );
  };

  // Görev completion'ını handle et
  const handleTaskCompletion = async (taskId) => {
    try {
      const result = await toggleTaskCompletion(taskId);
      
      if (result.success) {
        // Local state'i güncelle
        setTaskCompletions(prev => ({
          ...prev,
          [taskId]: result.completed
        }));
        
        // Hafif haptic feedback (opsiyonel)
        // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Alert.alert('Hata', result.error || 'Görev durumu güncellenemedi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    }
  };

  // Grup sil
  const handleDeleteGroup = () => {
    Alert.alert(
      'Grubu Sil',
      'Bu grubu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm görevler de silinecektir.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteGroup(groupId);
              
              if (result.success) {
                Alert.alert('Başarılı', 'Grup başarıyla silindi', [
                  {
                    text: 'Tamam',
                    onPress: () => navigation.goBack(),
                  },
                ]);
              } else {
                Alert.alert('Hata', result.error || 'Grup silinemedi');
              }
            } catch (error) {
              Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
            }
          },
        },
      ],
    );
  };

  // Dinamik subtitle oluştur
  const getHeaderSubtitle = () => {
    if (loading) {
      return 'Grup detayları yükleniyor...';
    }
    
    switch (activeTab) {
      case 'Görevler':
        return `${groupTasks.length} görev • Takım görevlerinizi yönetin`;
      case 'Üyeler':
        return `${groupMembers.length} üye • Ekip üyelerinizi görüntüleyin`;
      case 'Analiz':
        return 'Performans raporları ve istatistikler';
      case 'Ayarlar':
        return 'Grup ayarları ve yönetim seçenekleri';
      default:
        return 'Grup yönetimi ve görevler';
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupData();
    await refreshData();
    setRefreshing(false);
  };

  // Tab bar bileşeni
  const renderTabBar = () => {
    const tabs = ['Görevler', 'Üyeler', 'Analiz', 'Ayarlar'];
    
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

  // Filtrelenmiş görevleri al
  const getFilteredTasks = () => {
    if (selectedFilter === 'Tümü') {
      return groupTasks;
    }
    return groupTasks.filter(task => task.frequency === selectedFilter);
  };

  // Görev kartı
  const renderTaskCard = (task) => {
    const isCompleted = taskCompletions[task.id] || false;
    
    return (
      <TouchableOpacity 
        key={task.id} 
        style={styles.taskContainer}
        activeOpacity={0.7}
      >
        <View style={[
          styles.taskCard, 
          { backgroundColor: '#FFFFFF' },
          isCompleted && styles.taskCardCompleted
        ]}>
          {/* Sol kenar gradient çizgi */}
          <LinearGradient
            colors={isCompleted ? ['#E0E0E0', '#BDBDBD'] : [colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.taskLeftBorder}
          />
          
          <View style={styles.taskContent}>
            <View style={styles.taskHeader}>
              <View style={styles.taskInfo}>
                <Text style={[
                  styles.taskTitle, 
                  { color: theme.text },
                  isCompleted && styles.taskTitleCompleted
                ]}>
                  {task.title}
                </Text>
                {task.description && (
                  <Text style={[
                    styles.taskDescription, 
                    { color: theme.textSecondary },
                    isCompleted && styles.taskDescriptionCompleted
                  ]}>
                    {task.description}
                  </Text>
                )}
              </View>
              <View style={styles.taskHeaderActions}>
                <View style={[
                  styles.taskIconContainer,
                  {
                    backgroundColor: isCompleted 
                      ? colors.success + '15' 
                      : colors.primary + '15'
                  }
                ]}>
                  <Icon 
                    name={isCompleted ? "check-circle" : "format-list-checks"} 
                    size={18} 
                    color={isCompleted ? colors.success : colors.primary} 
                  />
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteTask(task.id)}
                >
                  <Icon name="delete-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.taskFooter}>
              <View style={styles.taskMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: colors.info + '15' }]}>
                  <Text style={[styles.taskCategory, { color: colors.info }]}>{task.frequency}</Text>
                </View>
              </View>
              
              <View style={styles.taskActions}>
                <TouchableOpacity
                  style={[
                    styles.taskCompletionButton,
                    { 
                      backgroundColor: isCompleted ? colors.success + '15' : colors.primary + '15',
                      borderColor: isCompleted ? colors.success : colors.primary,
                    }
                  ]}
                  onPress={() => handleTaskCompletion(task.id)}
                >
                  <Icon 
                    name={isCompleted ? "check-circle" : "circle-outline"} 
                    size={18} 
                    color={isCompleted ? colors.success : colors.primary} 
                  />
                  <Text style={[
                    styles.taskCompletionText, 
                    { color: isCompleted ? colors.success : colors.primary }
                  ]}>
                    {isCompleted ? 'Tamamlandı' : 'Tamamla'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Görev performans kartı
  const renderTaskPerformanceCard = () => {
    if (!taskPerformance) {
      return (
        <View style={[styles.performanceContainer, { backgroundColor: theme.card }]}>
          <View style={styles.performanceHeader}>
            <Icon name="trending-up" size={24} color={colors.primary} />
            <Text style={[styles.performanceTitle, { color: theme.text }]}>Görev Performansı</Text>
          </View>
          <View style={styles.emptyContainer}>
            <Icon name="chart-line" size={48} color={colors.primary + '50'} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Henüz performans verisi yok
            </Text>
          </View>
        </View>
      );
    }

    const bestTask = taskPerformance.best_task;
    const worstTask = taskPerformance.worst_task;

    return (
      <View style={[styles.performanceContainer, { backgroundColor: theme.card }]}>
        <View style={styles.performanceHeader}>
          <Icon name="trending-up" size={24} color={colors.primary} />
          <Text style={[styles.performanceTitle, { color: theme.text }]}>Görev Performansı</Text>
        </View>
        
        <View style={styles.performanceContent}>
          {/* En İyi Görev */}
          <View style={[styles.performanceCard, { backgroundColor: theme.background }]}>
            <View style={styles.performanceCardHeader}>
              <Icon name="trophy" size={20} color={colors.success} />
              <Text style={[styles.performanceCardTitle, { color: theme.text }]}>En İyi Görev</Text>
            </View>
            <Text style={[styles.performanceTaskTitle, { color: colors.success }]}>
              {bestTask?.title || 'Veri yok'}
            </Text>
            <View style={styles.performanceStats}>
              <Text style={[styles.performanceRate, { color: colors.success }]}>
                {bestTask?.completion_rate || 0}%
              </Text>
              <Text style={[styles.performanceCount, { color: theme.textSecondary }]}>
                {bestTask?.completed_count || 0}/{bestTask?.total_count || 0} tamamlandı
              </Text>
            </View>
          </View>

          {/* En Kötü Görev */}
          <View style={[styles.performanceCard, { backgroundColor: theme.background }]}>
            <View style={styles.performanceCardHeader}>
              <Icon name="alert-circle" size={20} color={colors.warning} />
              <Text style={[styles.performanceCardTitle, { color: theme.text }]}>Geliştirilecek</Text>
            </View>
            <Text style={[styles.performanceTaskTitle, { color: colors.warning }]}>
              {worstTask?.title || 'Veri yok'}
            </Text>
            <View style={styles.performanceStats}>
              <Text style={[styles.performanceRate, { color: colors.warning }]}>
                {worstTask?.completion_rate || 0}%
              </Text>
              <Text style={[styles.performanceCount, { color: theme.textSecondary }]}>
                {worstTask?.completed_count || 0}/{worstTask?.total_count || 0} tamamlandı
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Haftalık aktivite grafiği - BASİT TASARIM
  const renderWeeklyActivityChart = () => {
    const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    
    // Bugünün haftanın hangi günü olduğunu bul
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
    
    // Pazartesi = 0, Salı = 1, ... Pazar = 6 olacak şekilde dönüştür
    const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    return (
      <View style={[styles.weeklyActivityContainer, { backgroundColor: theme.card }]}>
        <View style={styles.weeklyActivityHeader}>
          <Icon name="calendar-week" size={24} color={colors.primary} />
          <Text style={[styles.weeklyActivityTitle, { color: theme.text }]}>Haftalık Aktivite</Text>
        </View>
        
        <View style={styles.weeklyActivityChart}>
          {weekDays.map((dayName, index) => {
            // Bu gün için aktivite verisi var mı?
            const today = new Date();
            const dayDate = new Date(today);
            dayDate.setDate(today.getDate() - (todayIndex - index));
            const dateString = dayDate.toISOString().split('T')[0];
            
            const activityData = dailyActivity.find(day => day.activity_date === dateString);
            const isToday = index === todayIndex;
            
            return (
              <View key={index} style={styles.dayColumn}>
                <View style={styles.dayBarContainer}>
                  <View 
                    style={[
                      styles.dayBar, 
                      { 
                        height: Math.max(20, ((activityData?.completion_rate || 0) / 100) * 120),
                        backgroundColor: activityData?.is_active ? colors.primary : colors.primary + '30',
                        borderWidth: isToday ? 2 : 0,
                        borderColor: colors.warning
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.dayLabel, { color: isToday ? colors.warning : theme.textSecondary }]}>
                  {dayName}
                </Text>
                <Text style={[styles.dayRate, { color: activityData?.is_active ? colors.primary : theme.textSecondary }]}>
                  {activityData?.completion_rate || 0}%
                </Text>
                <Text style={[styles.dayTasks, { color: theme.textSecondary }]}>
                  {activityData?.completed_tasks || 0}/{activityData?.total_tasks || 0}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Üye kartı
  const renderMemberCard = (member, index) => (
    <View key={member.user_id || member.id || index} style={[styles.memberCard, { backgroundColor: theme.card }]}>
      <View style={styles.memberHeader}>
        <View style={[styles.memberAvatar, { backgroundColor: colors.primary + '20' }]}>
          <Icon name="account" size={24} color={colors.primary} />
        </View>
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: theme.text }]}>{member.display_name}</Text>
          <Text style={[styles.memberUsername, { color: theme.textSecondary }]}>@{member.username}</Text>
        </View>
        <View style={styles.memberRole}>
          <Text style={[
            styles.memberRoleText, 
            { 
              color: member.role === 'admin' ? colors.warning : colors.info,
              backgroundColor: (member.role === 'admin' ? colors.warning : colors.info) + '15'
            }
          ]}>
            {member.role === 'admin' ? 'Admin' : 'Üye'}
          </Text>
        </View>
      </View>
    </View>
  );

  // Davet modal
  const renderInviteModal = () => (
    <Modal
      visible={inviteModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setInviteModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Üye Davet Et</Text>
            <TouchableOpacity
              onPress={() => setInviteModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Kullanıcı adı ara..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleUserSearch}
          />
          
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            style={styles.searchResults}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.searchResultItem, { backgroundColor: theme.background }]}
                onPress={() => handleInviteUser(item.id)}
              >
                <Text style={[styles.searchResultName, { color: theme.text }]}>{item.display_name}</Text>
                <Text style={[styles.searchResultUsername, { color: theme.textSecondary }]}>@{item.username}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchQuery.length >= 2 ? (
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Kullanıcı bulunamadı
                </Text>
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );

  // Görev ekleme modal
  const renderTaskModal = () => (
    <Modal
      visible={taskModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setTaskModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Yeni Görev</Text>
            <TouchableOpacity
              onPress={() => setTaskModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.taskInput, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Görev başlığı"
            placeholderTextColor={theme.textSecondary}
            value={taskForm.title}
            onChangeText={(text) => setTaskForm({...taskForm, title: text})}
          />
          
          <TextInput
            style={[styles.taskInput, styles.taskTextArea, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Açıklama (opsiyonel)"
            placeholderTextColor={theme.textSecondary}
            value={taskForm.description}
            onChangeText={(text) => setTaskForm({...taskForm, description: text})}
            multiline
            numberOfLines={3}
          />
          
          {/* Periyot Seçimi */}
          <View style={styles.frequencyContainer}>
            <Text style={[styles.frequencyLabel, { color: theme.text }]}>Periyot:</Text>
            <View style={styles.frequencyButtons}>
              {['Günlük', 'Haftalık', 'Aylık'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.frequencyButton,
                    { 
                      backgroundColor: taskForm.frequency === freq ? colors.primary : theme.background,
                      borderColor: taskForm.frequency === freq ? colors.primary : theme.border
                    }
                  ]}
                  onPress={() => setTaskForm({...taskForm, frequency: freq})}
                >
                  <Text style={[
                    styles.frequencyButtonText,
                    { color: taskForm.frequency === freq ? '#FFFFFF' : theme.text }
                  ]}>
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.createTaskButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateTask}
          >
            <Text style={styles.createTaskButtonText}>Görev Oluştur</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Tab içeriği
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Görevler':
        return (
          <View style={styles.tabContent}>
            {/* Filtreleme Butonları */}
            <View style={styles.filterContainer}>
              {['Tümü', 'Günlük', 'Haftalık', 'Aylık'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    { 
                      backgroundColor: selectedFilter === filter ? colors.primary : theme.card,
                      borderColor: selectedFilter === filter ? colors.primary : theme.border
                    }
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { 
                      color: selectedFilter === filter ? '#FFFFFF' : theme.textSecondary
                    }
                  ]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setTaskModalVisible(true)}
            >
              <Icon name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Yeni Görev</Text>
            </TouchableOpacity>
            
            {getFilteredTasks().length > 0 ? (
              <View style={styles.listContainer}>
                {getFilteredTasks().map(renderTaskCard)}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="format-list-checks" size={64} color={colors.primary + '50'} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  {selectedFilter === 'Tümü' ? 'Henüz görev yok' : `${selectedFilter} görev bulunamadı`}
                </Text>
              </View>
            )}
          </View>
        );
        
      case 'Üyeler':
        return (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.teal }]}
              onPress={() => setInviteModalVisible(true)}
            >
              <Icon name="account-plus" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Üye Davet Et</Text>
            </TouchableOpacity>
            
            <View style={styles.listContainer}>
              {groupMembers.map((member, index) => renderMemberCard(member, index))}
            </View>
          </View>
        );
        
      case 'Analiz':
        return (
          <View style={styles.tabContent}>
            {/* Scoreboard */}
            <View style={[styles.scoreboardContainer, { backgroundColor: theme.card }]}>
              <View style={styles.scoreboardHeader}>
                <Icon name="trophy" size={24} color={colors.warning} />
                <Text style={[styles.scoreboardTitle, { color: theme.text }]}>Skor Tablosu</Text>
              </View>
              <View style={styles.scoreboardList}>
                {memberScores.length > 0 ? memberScores.map((member, index) => (
                  <View key={member.user_id} style={styles.scoreboardItem}>
                    <View style={styles.scoreboardRank}>
                      <Text style={[styles.rankText, { color: theme.text }]}>#{index + 1}</Text>
                    </View>
                    <View style={styles.scoreboardMember}>
                      <Text style={[styles.scoreboardName, { color: theme.text }]}>{member.display_name}</Text>
                      <Text style={[styles.scoreboardUsername, { color: theme.textSecondary }]}>@{member.username}</Text>
                    </View>
                    <View style={styles.scoreboardScore}>
                      <Text style={[styles.scoreText, { color: colors.primary }]}>
                        {member.completion_rate}%
                      </Text>
                    </View>
                  </View>
                )) : (
                  <View style={styles.emptyContainer}>
                    <Icon name="trophy-outline" size={48} color={colors.primary + '50'} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      Henüz skorlar hesaplanmadı
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Kişisel İstatistik */}
            <View style={[styles.personalStatsContainer, { backgroundColor: theme.card }]}>
              <View style={styles.personalStatsHeader}>
                <Icon name="chart-line" size={24} color={colors.primary} />
                <Text style={[styles.personalStatsTitle, { color: theme.text }]}>Kişisel İstatistiklerim</Text>
              </View>
              {userStats ? (
                <View style={styles.statsContainer}>
                  {/* Genel İstatistikler */}
                  <View style={styles.generalStats}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.primary }]}>
                        {userStats.completed_tasks}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Toplam Tamamlanan</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.warning }]}>
                        {userStats.pending_tasks}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Bekleyen</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.success }]}>
                        {userStats.completion_rate}%
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Genel Başarı</Text>
                    </View>
                  </View>

                  {/* Periyot İstatistikleri */}
                  <View style={styles.periodStats}>
                    {/* Günlük */}
                    <View style={[styles.periodCard, { backgroundColor: theme.background }]}>
                      <View style={styles.periodHeader}>
                        <Icon name="calendar-today" size={20} color={colors.primary} />
                        <Text style={[styles.periodTitle, { color: theme.text }]}>Bugün</Text>
                      </View>
                      <Text style={[styles.periodValue, { color: colors.primary }]}>
                        {userStats.daily_stats?.completed || 0}/{userStats.daily_stats?.total || 0}
                      </Text>
                      <Text style={[styles.periodRate, { color: colors.primary }]}>
                        {userStats.daily_stats?.rate || 0}%
                      </Text>
                    </View>

                    {/* Haftalık */}
                    <View style={[styles.periodCard, { backgroundColor: theme.background }]}>
                      <View style={styles.periodHeader}>
                        <Icon name="calendar-week" size={20} color={colors.info} />
                        <Text style={[styles.periodTitle, { color: theme.text }]}>Bu Hafta</Text>
                      </View>
                      <Text style={[styles.periodValue, { color: colors.info }]}>
                        {userStats.weekly_stats?.completed || 0}/{userStats.weekly_stats?.total || 0}
                      </Text>
                      <Text style={[styles.periodRate, { color: colors.info }]}>
                        {userStats.weekly_stats?.rate || 0}%
                      </Text>
                    </View>

                    {/* Aylık */}
                    <View style={[styles.periodCard, { backgroundColor: theme.background }]}>
                      <View style={styles.periodHeader}>
                        <Icon name="calendar-month" size={20} color={colors.success} />
                        <Text style={[styles.periodTitle, { color: theme.text }]}>Bu Ay</Text>
                      </View>
                      <Text style={[styles.periodValue, { color: colors.success }]}>
                        {userStats.monthly_stats?.completed || 0}/{userStats.monthly_stats?.total || 0}
                      </Text>
                      <Text style={[styles.periodRate, { color: colors.success }]}>
                        {userStats.monthly_stats?.rate || 0}%
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Icon name="chart-line" size={48} color={colors.primary + '50'} />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    İstatistikler yükleniyor...
                  </Text>
                </View>
              )}
            </View>

            {/* Haftalık Aktivite Grafiği */}
            {renderWeeklyActivityChart()}

            {/* Görev Performans Analizi */}
            {renderTaskPerformanceCard()}
          </View>
        );
        
      case 'Ayarlar':
        return (
          <View style={styles.tabContent}>
            <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card }]}>
              <Icon name="cog" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: theme.text }]}>Grup Ayarları</Text>
              <Icon name="chevron-right" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingItem, { backgroundColor: theme.card }]}
              onPress={handleDeleteGroup}
            >
              <Icon name="delete" size={24} color={colors.error} />
              <Text style={[styles.settingText, { color: colors.error }]}>Grubu Sil</Text>
              <Icon name="chevron-right" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <AppHeader
          title={groupName}
          subtitle={getHeaderSubtitle()}
          iconName="account-group"
          colors={[colors.primary, colors.secondary, colors.accent]}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader
        title={groupName}
        subtitle={getHeaderSubtitle()}
        iconName="account-group"
        colors={[colors.primary, colors.secondary, colors.accent]}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        compact={true}
      />
      
      {renderTabBar()}
      
      <ScrollView
        style={styles.content}
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
      
      {renderInviteModal()}
      {renderTaskModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Filtreleme stilleri
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    // Container için özel stil yok
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  // Görev kartı stilleri
  taskContainer: {
    marginBottom: 16,
  },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    borderRadius: 4,
  },
  taskContent: {
    flex: 1,
    marginLeft: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 6,
    marginLeft: 6,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  taskIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  taskCategory: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskFrequency: {
    fontSize: 12,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskActionButton: {
    padding: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  taskActionText: {
    marginLeft: 4,
    fontSize: 12,
  },
  // Üye kartı stilleri
  memberCard: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  memberUsername: {
    fontSize: 14,
  },
  memberRole: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberRoleText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  searchInput: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  searchResults: {
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  searchResultUsername: {
    fontSize: 14,
  },
  taskInput: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  taskTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createTaskButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  createTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  frequencyContainer: {
    marginBottom: 16,
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  frequencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Ayarlar stilleri
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  // Analiz stilleri
  scoreboardContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scoreboardList: {
    //
  },
  scoreboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  scoreboardRank: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreboardMember: {
    flex: 1,
    marginLeft: 12,
  },
  scoreboardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  scoreboardUsername: {
    fontSize: 14,
  },
  scoreboardScore: {
    width: 60,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  personalStatsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  personalStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  personalStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsContainer: {
    // Ana container
  },
  generalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  periodStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  periodCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  periodTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  periodValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  periodRate: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Haftalık aktivite grafiği stilleri
  weeklyActivityContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weeklyActivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weeklyActivityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  weeklyActivityChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingHorizontal: 8,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  dayBarContainer: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayBar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayRate: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayTasks: {
    fontSize: 9,
  },
  emptyActivityContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  emptyActivityText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  // Görev performans kartı stilleri
  performanceContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  performanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  performanceCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  performanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  performanceTaskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  performanceStats: {
    alignItems: 'center',
  },
  performanceRate: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  performanceCount: {
    fontSize: 12,
    textAlign: 'center',
  },
  taskCardCompleted: {
    opacity: 0.7,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  taskDescriptionCompleted: {
    textDecorationLine: 'line-through',
  },
  taskCompletionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  taskCompletionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GroupDetailScreen; 