import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Animated,
  ScrollView,
  Switch,
  Platform,
  StatusBar,
  Image,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTaskContext } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { scheduleNotification, cancelNotification } from '../services/notificationService';

const { width, height } = Dimensions.get('window');

const KisiselVazifeScreen = () => {
  // Context ve state tanımlamaları
  const { tasks, addTask, toggleTaskCompletion, deleteTask, updateTask } = useTaskContext();
  const { theme } = useTheme();

  // Animasyon değerleri
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [180, 80],
    extrapolate: 'clamp'
  });

  // State tanımlamaları
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskFrequency, setNewTaskFrequency] = useState('Günlük');
  const [newTaskCategory, setNewTaskCategory] = useState('Kişisel');
  const [activeFilter, setActiveFilter] = useState('Tümü');
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Bildirim ayarları
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Renk paleti
  const colors = {
    primary: '#4A6FFF',
    secondary: '#6C63FF',
    accent: '#FF6584',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    lightBlue: '#E8EFFF',
    lightGray: '#F5F7FA',
    darkBlue: '#3D5AFE',
    textPrimary: '#333333',
    textSecondary: '#666666',
    textLight: '#999999',
    background: '#FFFFFF',
    card: '#FFFFFF',
    border: '#EEEEEE',
  };

  // Kategori renkleri
  const categoryColors = {
    'Kişisel': '#4A6FFF',
    'İş': '#6C63FF',
    'Sağlık': '#4CAF50',
    'Eğitim': '#FF9800',
    'Alışveriş': '#E91E63',
    'Diğer': '#607D8B'
  };

  // Kategori ikonları
  const categoryIcons = {
    'Kişisel': 'account-outline',
    'İş': 'briefcase-outline',
    'Sağlık': 'heart-pulse',
    'Eğitim': 'school-outline',
    'Alışveriş': 'cart-outline',
    'Diğer': 'dots-horizontal-circle-outline'
  };

  // Filtreleme işlemi
  useEffect(() => {
    let result = tasks;

    // Aktif filtreye göre filtrele
    if (activeFilter !== 'Tümü') {
      result = result.filter(task => task.frequency === activeFilter);
    }

    // Arama sorgusuna göre filtrele
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(task =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    setFilteredTasks(result);
  }, [tasks, activeFilter, searchQuery]);

  // Yeni vazife ekleme
  const handleAddTask = () => {
    if (newTaskTitle.trim() === '') {
      return;
    }

    const newTask = {
      title: newTaskTitle,
      description: newTaskDescription,
      frequency: newTaskFrequency,
      category: newTaskCategory,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    addTask(newTask);

    // Form alanlarını temizle
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskFrequency('Günlük');
    setNewTaskCategory('Kişisel');

    // Modalı kapat
    setModalVisible(false);
  };

  // Vazife silme
  const handleDeleteTask = (id) => {
    deleteTask(id);
    if (detailModalVisible) {
      setDetailModalVisible(false);
    }
  };

  // Vazife detaylarını gösterme
  const showTaskDetails = (task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  // Bildirim ayarlarını gösterme
  const showNotificationSettings = (task) => {
    setSelectedTask(task);
    setNotificationEnabled(task.notification?.enabled || false);

    if (task.notification?.time) {
      setNotificationTime(new Date(task.notification.time));
    } else {
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      setNotificationTime(defaultTime);
    }

    setNotificationModalVisible(true);
  };

  // Bildirim ayarlarını kaydetme
  const saveNotificationSettings = async () => {
    if (selectedTask) {
      try {
        // Eğer önceden bir bildirim varsa iptal et
        if (selectedTask.notification?.id) {
          await cancelNotification(selectedTask.notification.id);
        }

        if (!notificationEnabled) {
          // Bildirim devre dışı bırakıldıysa, bildirimi iptal et ve güncelle
          updateTask(selectedTask.id, {
            notification: {
              enabled: false,
              time: null,
              id: null
            }
          });
        } else {
          // Bildirim zamanını ayarla
          const notificationDate = new Date();
          notificationDate.setHours(notificationTime.getHours());
          notificationDate.setMinutes(notificationTime.getMinutes());
          notificationDate.setSeconds(0);

          // Eğer seçilen saat şu anki saatten önceyse, bir sonraki güne ayarla
          const now = new Date();
          if (notificationDate < now) {
            notificationDate.setDate(notificationDate.getDate() + 1);
          }

          // Bildirim ID'si oluştur
          const notificationId = await scheduleNotification(
            selectedTask.id,
            'Vazife Hatırlatıcı',
            `${selectedTask.title} zamanı geldi!`,
            notificationDate
          );

          if (notificationId) {
            // Görevi güncelle
            updateTask(selectedTask.id, {
              notification: {
                enabled: true,
                time: notificationDate.toISOString(),
                id: notificationId
              }
            });
          }
        }

        setNotificationModalVisible(false);
      } catch (error) {
        console.error('Bildirim ayarlanırken hata oluştu:', error);
      }
    }
  };

  // formatDate fonksiyonunu geri ekleyelim
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Zaman formatı yardımcı fonksiyonu
  const formatTime = (date) => {
    if (!date) return '';
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };

  // iOS için tarih seçici
  const renderIOSTimePicker = () => {
    if (!showTimePicker) return null;

    return (
      <View style={styles.iosTimePickerContainer}>
        <DateTimePicker
          value={notificationTime}
          mode="time"
          display="spinner"
          onChange={(event, selectedDate) => {
            if (selectedDate) {
              setNotificationTime(selectedDate);
            }
          }}
          style={styles.iosTimePicker}
        />
        <TouchableOpacity
          style={styles.iosTimePickerDoneButton}
          onPress={() => setShowTimePicker(false)}
        >
          <Text style={styles.iosTimePickerDoneButtonText}>Tamam</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Başlık bileşeni - Daha kompakt ve profesyonel
  const renderHeader = () => {
    // Bugünün tarihini formatlayalım
    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const formattedDate = today.toLocaleDateString('tr-TR', options);
    
    return (
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
            <View style={styles.headerTopRow}>
              <View>
                <Text style={styles.headerTitle}>Vazifeleriniz</Text>
                <Text style={styles.headerDate}>{formattedDate}</Text>
              </View>
              <View style={styles.headerStats}>
                <View style={styles.headerStatItem}>
                  <Text style={styles.headerStatNumber}>
                    {tasks.filter(task => !task.completed).length}
                  </Text>
                  <Text style={styles.headerStatLabel}>Aktif</Text>
                </View>
                <View style={styles.headerStatDivider} />
                <View style={styles.headerStatItem}>
                  <Text style={styles.headerStatNumber}>
                    {tasks.filter(task => task.completed).length}
                  </Text>
                  <Text style={styles.headerStatLabel}>Tamamlanan</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Filtre bileşeni
  const renderFilters = () => {
    const filters = ['Tümü', 'Günlük', 'Haftalık', 'Aylık'];

    return (
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === filter && styles.activeFilterButtonText
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Kategori bileşeni
  const renderCategories = () => {
    const categories = ['Kişisel', 'İş', 'Sağlık', 'Eğitim', 'Alışveriş', 'Diğer'];

    return (
      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Kategoriler</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryCard,
                { backgroundColor: `${categoryColors[category]}15` }
              ]}
              onPress={() => {
                setNewTaskCategory(category);
                setModalVisible(true);
              }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: categoryColors[category] }]}>
                <Icon name={categoryIcons[category]} size={20} color="#FFF" />
              </View>
              <Text style={styles.categoryTitle}>{category}</Text>
              <Text style={styles.categoryCount}>
                {tasks.filter(task => task.category === category).length} vazife
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // TaskCard bileşeni - Alt gölge ekleme
  const TaskCard = ({ task, onPress, onToggle, onNotification, onDelete }) => {
    const categoryColor = categoryColors[task.category] || colors.primary;
    const categoryIcon = categoryIcons[task.category] || 'checkbox-marked-circle-outline';
    
    const isCompleted = task.completed;
    const hasNotification = task.notification?.enabled;
    
    return (
      <View style={styles.taskCardWrapper}>
        <TouchableOpacity 
          style={[
            styles.taskCard, 
            isCompleted && styles.completedTaskCard,
            { borderLeftWidth: 4, borderLeftColor: isCompleted ? colors.success : categoryColor }
          ]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={styles.taskCardContent}>
            <View style={styles.taskCardHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: categoryColor }]}>
                <Icon name={categoryIcon} size={16} color="#FFF" />
              </View>
              
              <View style={styles.taskCardHeaderRight}>
                <View style={[styles.frequencyBadge, { backgroundColor: `${categoryColor}15` }]}>
                  <Text style={[styles.frequencyBadgeText, { color: categoryColor }]}>
                    {task.frequency}
                  </Text>
                </View>
                
                {hasNotification && (
                  <View style={[styles.notificationBadge, { backgroundColor: `${colors.warning}15` }]}>
                    <Icon name="bell" size={12} color={colors.warning} />
                    <Text style={[styles.notificationBadgeText, { color: colors.warning }]}>
                      {formatTime(new Date(task.notification.time))}
                    </Text>
                  </View>
                )}
                
                {isCompleted && (
                  <View style={[styles.completedBadge, { backgroundColor: `${colors.success}15` }]}>
                    <Icon name="check-circle" size={12} color={colors.success} />
                    <Text style={[styles.completedBadgeText, { color: colors.success }]}>
                      Tamamlandı
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.taskCardBody}>
              <Text 
                style={[
                  styles.taskCardTitle, 
                  isCompleted && styles.completedTaskCardTitle
                ]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              
              {task.description && (
                <Text 
                  style={[
                    styles.taskCardDescription,
                    isCompleted && styles.completedTaskCardDescription
                  ]}
                  numberOfLines={1}
                >
                  {task.description}
                </Text>
              )}
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${isCompleted ? 100 : 0}%`,
                      backgroundColor: isCompleted ? colors.success : categoryColor
                    }
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.taskCardFooter}>
              <View style={styles.taskCardActions}>
                {hasNotification ? (
                  <TouchableOpacity 
                    style={[styles.taskCardActionButton, { backgroundColor: `${colors.warning}15` }]}
                    onPress={() => onNotification(task)}
                  >
                    <Icon name="bell" size={16} color={colors.warning} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.taskCardActionButton}
                    onPress={() => onNotification(task)}
                  >
                    <Icon name="bell-outline" size={16} color="#999" />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[
                    styles.taskCardActionButton,
                    { 
                      backgroundColor: isCompleted ? `${colors.warning}15` : `${colors.success}15`,
                      width: 32,
                      height: 32
                    }
                  ]}
                  onPress={() => onToggle(task.id)}
                >
                  <Icon 
                    name={isCompleted ? 'refresh' : 'check'} 
                    size={18}
                    color={isCompleted ? colors.warning : colors.success} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.taskCardActionButton, { backgroundColor: `${colors.error}15` }]}
                  onPress={() => onDelete(task.id)}
                >
                  <Icon name="delete-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.taskCardShadow} />
      </View>
    );
  };

  // Vazife kartı bileşeni
  const renderTaskItem = ({ item }) => {
    return (
      <TaskCard
        task={item}
        onPress={() => showTaskDetails(item)}
        onToggle={toggleTaskCompletion}
        onNotification={showNotificationSettings}
        onDelete={handleDeleteTask}
      />
    );
  };

  // Vazife ekleme butonu
  const renderAddButton = () => {
    return (
      <TouchableOpacity 
        style={styles.addTaskButton}
        onPress={() => setModalVisible(true)}
      >
        <LinearGradient
          colors={['#4A6FFF', '#6C63FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButtonGradient}
        >
          <Icon name="plus" size={24} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Vazife ekleme modalı
  const renderAddTaskModal = () => {
    return (
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addTaskModalContainer}>
            <View style={styles.addTaskModalHeader}>
              <Text style={styles.addTaskModalTitle}>Yeni Vazife</Text>
              <TouchableOpacity 
                style={styles.addTaskModalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="close" size={22} color="#999" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.addTaskModalContent}>
              {/* Başlık Girişi */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Başlık</Text>
                <View style={styles.inputContainer}>
                  <Icon name="format-title" size={20} color="#4A6FFF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.formInput}
                    placeholder="Vazife başlığı girin"
                    placeholderTextColor="#999"
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                  />
                </View>
              </View>
              
              {/* Açıklama Girişi */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Açıklama <Text style={styles.optionalText}>(İsteğe bağlı)</Text></Text>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Vazife açıklaması girin"
                    placeholderTextColor="#999"
                    value={newTaskDescription}
                    onChangeText={setNewTaskDescription}
                    multiline={true}
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
              
              {/* Sıklık Seçimi */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Sıklık</Text>
                <View style={styles.optionsContainer}>
                  {['Günlük', 'Haftalık', 'Aylık'].map((frequency) => (
                    <TouchableOpacity
                      key={frequency}
                      style={[
                        styles.optionButton,
                        newTaskFrequency === frequency && styles.optionButtonActive
                      ]}
                      onPress={() => setNewTaskFrequency(frequency)}
                    >
                      <Icon 
                        name={
                          frequency === 'Günlük' ? 'calendar-today' : 
                          frequency === 'Haftalık' ? 'calendar-week' : 'calendar-month'
                        } 
                        size={16} 
                        color={newTaskFrequency === frequency ? '#FFF' : '#4A6FFF'} 
                        style={styles.optionIcon}
                      />
                      <Text 
                        style={[
                          styles.optionText,
                          newTaskFrequency === frequency && styles.optionTextActive
                        ]}
                      >
                        {frequency}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Kategori Seçimi */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kategori</Text>
                <View style={styles.categoryGrid}>
                  {Object.keys(categoryColors).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        newTaskCategory === category && styles.categoryButtonActive,
                        { borderColor: categoryColors[category] }
                      ]}
                      onPress={() => setNewTaskCategory(category)}
                    >
                      <View 
                        style={[
                          styles.categoryIcon,
                          { backgroundColor: newTaskCategory === category ? categoryColors[category] : `${categoryColors[category]}20` }
                        ]}
                      >
                        <Icon 
                          name={categoryIcons[category]} 
                          size={18} 
                          color={newTaskCategory === category ? '#FFF' : categoryColors[category]} 
                        />
                      </View>
                      <Text 
                        style={[
                          styles.categoryText,
                          { color: newTaskCategory === category ? categoryColors[category] : '#666' }
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.addTaskModalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.addButton,
                  newTaskTitle.trim() === '' && styles.addButtonDisabled
                ]}
                onPress={handleAddTask}
                disabled={newTaskTitle.trim() === ''}
              >
                <Text style={styles.addButtonText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Bildirim modalı
  const renderNotificationModal = () => {
    if (!selectedTask) return null;
    
    const categoryColor = categoryColors[selectedTask.category] || colors.primary;
    
    return (
      <Modal
        visible={notificationModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationModalContainer}>
            {/* Modal Başlık */}
            <View style={styles.notificationModalHeader}>
              <Text style={styles.notificationModalTitle}>Bildirim Ayarla</Text>
              <TouchableOpacity 
                style={styles.notificationModalCloseButton}
                onPress={() => setNotificationModalVisible(false)}
              >
                <Icon name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>
            
            {/* Görev Bilgisi */}
            <View style={styles.notificationTaskInfo}>
              <View 
                style={[
                  styles.notificationTaskIcon, 
                  { backgroundColor: categoryColor }
                ]}
              >
                <Icon 
                  name={categoryIcons[selectedTask.category] || 'checkbox-marked-circle-outline'} 
                  size={18} 
                  color="#FFF" 
                />
              </View>
              <View style={styles.notificationTaskDetails}>
                <Text style={styles.notificationTaskTitle} numberOfLines={1}>
                  {selectedTask.title}
                </Text>
                <Text style={styles.notificationTaskFrequency}>
                  {selectedTask.frequency}
                </Text>
              </View>
            </View>
            
            {/* Bildirim Ayarları */}
            <View style={styles.notificationSettings}>
              {/* Bildirim Açma/Kapama */}
              <View style={styles.notificationSwitchContainer}>
                <View style={styles.notificationSwitchLabel}>
                  <Icon name="bell-outline" size={20} color={colors.primary} style={styles.notificationSwitchIcon} />
                  <Text style={styles.notificationSwitchText}>
                    Bildirimi Etkinleştir
                  </Text>
                </View>
                <Switch
                  value={notificationEnabled}
                  onValueChange={setNotificationEnabled}
                  trackColor={{ false: '#E0E0E0', true: `${categoryColor}50` }}
                  thumbColor={notificationEnabled ? categoryColor : '#FFF'}
                  ios_backgroundColor="#E0E0E0"
                />
              </View>
              
              {/* Bildirim Zamanı */}
              {notificationEnabled && (
                <View style={styles.notificationTimeSection}>
                  <Text style={styles.notificationTimeLabel}>
                    Bildirim Zamanı
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.timePickerButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Icon name="clock-outline" size={20} color={categoryColor} />
                    <Text style={styles.timePickerButtonText}>
                      {formatTime(notificationTime)}
                    </Text>
                    <Icon name="chevron-down" size={20} color="#999" />
                  </TouchableOpacity>
                  
                  {Platform.OS === 'ios' ? (
                    showTimePicker && (
                      <View style={styles.iosTimePickerWrapper}>
                        <DateTimePicker
                          value={notificationTime}
                          mode="time"
                          display="spinner"
                          onChange={(event, selectedDate) => {
                            if (selectedDate) {
                              setNotificationTime(selectedDate);
                            }
                          }}
                          style={styles.iosTimePicker}
                        />
                        <TouchableOpacity
                          style={[styles.iosTimePickerDoneButton, { backgroundColor: categoryColor }]}
                          onPress={() => setShowTimePicker(false)}
                        >
                          <Text style={styles.iosTimePickerDoneButtonText}>Tamam</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  ) : (
                    showTimePicker && (
                      <DateTimePicker
                        value={notificationTime}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowTimePicker(false);
                          if (selectedDate) {
                            setNotificationTime(selectedDate);
                          }
                        }}
                      />
                    )
                  )}
                  
                  <Text style={styles.notificationHint}>
                    Bildirim, seçilen saatte her gün tekrarlanacaktır.
                  </Text>
                </View>
              )}
            </View>
            
            {/* Modal Alt Kısım */}
            <View style={styles.notificationModalFooter}>
              <TouchableOpacity
                style={styles.notificationCancelButton}
                onPress={() => setNotificationModalVisible(false)}
              >
                <Text style={styles.notificationCancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.notificationSaveButton,
                  { backgroundColor: categoryColor }
                ]}
                onPress={saveNotificationSettings}
              >
                <Text style={styles.notificationSaveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Detay modalı
  const renderDetailModal = () => {
    if (!selectedTask) return null;

    const categoryColor = categoryColors[selectedTask.category] || colors.primary;

    return (
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContainer}>
            <LinearGradient
              colors={[categoryColor, `${categoryColor}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.detailModalHeader}
            >
              <View style={styles.detailModalHeaderContent}>
                <TouchableOpacity
                  style={styles.detailModalBackButton}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Icon name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.detailModalHeaderInfo}>
                  <View style={styles.detailModalCategoryBadge}>
                    <Icon name={categoryIcons[selectedTask.category]} size={14} color="#FFF" />
                    <Text style={styles.detailModalCategoryText}>{selectedTask.category}</Text>
                  </View>

                  <Text style={styles.detailModalTitle}>{selectedTask.title}</Text>

                  <View style={styles.detailModalMeta}>
                    <Icon name="clock-outline" size={14} color="#FFFFFF99" />
                    <Text style={styles.detailModalMetaText}>{selectedTask.frequency}</Text>

                    {selectedTask.createdAt && (
                      <>
                        <View style={styles.detailModalMetaDot} />
                        <Icon name="calendar-outline" size={14} color="#FFFFFF99" />
                        <Text style={styles.detailModalMetaText}>
                          {formatDate(selectedTask.createdAt)}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.detailModalBody}>
              {selectedTask.description && (
                <View style={styles.detailModalSection}>
                  <Text style={styles.detailModalSectionTitle}>Açıklama</Text>
                  <Text style={styles.detailModalDescription}>{selectedTask.description}</Text>
                </View>
              )}

              <View style={styles.detailModalSection}>
                <Text style={styles.detailModalSectionTitle}>Durum</Text>
                <View style={styles.detailModalStatus}>
                  <View style={[
                    styles.detailModalStatusIndicator,
                    { backgroundColor: selectedTask.completed ? colors.success : colors.warning }
                  ]} />
                  <Text style={styles.detailModalStatusText}>
                    {selectedTask.completed ? 'Tamamlandı' : 'Devam Ediyor'}
                  </Text>
                </View>
              </View>

              {selectedTask.notification?.enabled && (
                <View style={styles.detailModalSection}>
                  <Text style={styles.detailModalSectionTitle}>Bildirim</Text>
                  <View style={styles.detailModalNotification}>
                    <Icon name="bell-outline" size={18} color={colors.primary} />
                    <Text style={styles.detailModalNotificationText}>
                      {formatTime(new Date(selectedTask.notification.time))}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.detailModalActions}>
                <TouchableOpacity
                  style={[styles.detailModalActionButton, styles.detailModalNotificationButton]}
                  onPress={() => {
                    setDetailModalVisible(false);
                    showNotificationSettings(selectedTask);
                  }}
                >
                  <Icon name="bell-outline" size={20} color={colors.primary} />
                  <Text style={styles.detailModalActionButtonText}>Bildirim Ayarla</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.detailModalActionButton, styles.detailModalCompleteButton]}
                  onPress={() => {
                    toggleTaskCompletion(selectedTask.id);
                    setDetailModalVisible(false);
                  }}
                >
                  <Icon
                    name={selectedTask.completed ? 'refresh' : 'check'}
                    size={20}
                    color="#FFF"
                  />
                  <Text style={styles.detailModalCompleteButtonText}>
                    {selectedTask.completed ? 'Tekrar Başlat' : 'Tamamlandı'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.detailModalDeleteButton}
                onPress={() => handleDeleteTask(selectedTask.id)}
              >
                <Icon name="delete-outline" size={20} color={colors.error} />
                <Text style={styles.detailModalDeleteButtonText}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Boş durum bileşeni
  const renderEmptyComponent = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Icon name="clipboard-text-outline" size={80} color="#CCCCCC" />
        </View>
        <Text style={styles.emptyTitle}>Henüz Vazife Yok</Text>
        <Text style={styles.emptyDescription}>
          Yeni vazifeler ekleyerek günlük, haftalık veya aylık planlarınızı oluşturun.
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.emptyButtonText}>Vazife Ekle</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {renderHeader()}
      
      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Vazife ara..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={18} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Filtreler */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {['Tümü', 'Günlük', 'Haftalık', 'Aylık'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text 
                style={[
                  styles.filterButtonText,
                  activeFilter === filter && styles.activeFilterButtonText
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Görev Listesi */}
      {filteredTasks.length === 0 ? (
        renderEmptyComponent()
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTaskItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.taskList}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Artı Butonu */}
      {renderAddButton()}
      
      {renderAddTaskModal()}
      {renderDetailModal()}
      {renderNotificationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    width: '100%',
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerStatItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerStatDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -25,
    marginBottom: 10,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  filtersContainer: {
    marginBottom: 15,
  },
  filtersScrollContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: '#4A6FFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterButtonText: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  taskList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  taskCardContainer: {
    marginBottom: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  taskCardWrapper: {
    marginBottom: 3,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderLeftWidth: 4,
    position: 'relative',
  },
  taskCardContent: {
    padding: 12,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskCardHeaderRight: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flex: 1,
    marginLeft: 8,
  },
  taskCardBody: {
    marginBottom: 10,
  },
  taskCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  taskCardDescription: {
    fontSize: 13,
    color: '#666',
  },
  taskCheckbox: {
    marginRight: 15,
  },
  taskInfo: {
    flex: 1,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  taskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 4,
  },
  taskBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  taskMoreButton: {
    padding: 5,
  },
  addTaskButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addTaskModalContainer: {
    width: '85%',
    maxWidth: 360,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    maxHeight: '70%',
  },
  addTaskModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  addTaskModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addTaskModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTaskModalContent: {
    padding: 16,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 10,
  },
  formInput: {
    flex: 1,
    height: 42,
    fontSize: 15,
    color: '#333',
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    padding: 12,
  },
  textArea: {
    fontSize: 15,
    color: '#333',
    minHeight: 80,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginHorizontal: 4,
    backgroundColor: '#FAFAFA',
  },
  optionButtonActive: {
    backgroundColor: '#4A6FFF',
    borderColor: '#4A6FFF',
  },
  optionIcon: {
    marginRight: 6,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  optionTextActive: {
    color: '#FFF',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  categoryCard: {
    width: '33.33%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  addTaskModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  addButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4A6FFF',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4A6FFF',
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  notificationModalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  notificationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notificationModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationModalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTaskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notificationTaskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationTaskDetails: {
    flex: 1,
  },
  notificationTaskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  notificationTaskFrequency: {
    fontSize: 13,
    color: '#666',
  },
  notificationSettings: {
    padding: 16,
  },
  notificationSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notificationSwitchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationSwitchIcon: {
    marginRight: 8,
  },
  notificationSwitchText: {
    fontSize: 15,
    color: '#333',
  },
  notificationTimeSection: {
    marginTop: 8,
  },
  notificationTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timePickerButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
  },
  notificationHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  iosTimePickerWrapper: {
    marginTop: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  iosTimePicker: {
    height: 180,
  },
  iosTimePickerDoneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  iosTimePickerDoneButtonText: {
    color: '#FFF',
    fontWeight: '500',
    fontSize: 14,
  },
  notificationModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  notificationCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    marginRight: 10,
  },
  notificationCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  notificationSaveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  notificationSaveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  detailModalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    maxHeight: '80%',
  },
  detailModalHeader: {
    padding: 20,
  },
  detailModalHeaderContent: {
    paddingTop: 20,
  },
  detailModalBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailModalHeaderInfo: {
    marginBottom: 20,
  },
  detailModalCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  detailModalCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFF',
    marginLeft: 6,
  },
  detailModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  detailModalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailModalMetaText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
    marginRight: 12,
  },
  detailModalMetaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 12,
  },
  detailModalBody: {
    padding: 20,
  },
  detailModalSection: {
    marginBottom: 20,
  },
  detailModalSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  detailModalDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  detailModalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailModalStatusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  detailModalStatusText: {
    fontSize: 16,
    color: '#333',
  },
  detailModalNotification: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailModalNotificationText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  detailModalActions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  detailModalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  detailModalNotificationButton: {
    backgroundColor: '#F5F7FA',
  },
  detailModalCompleteButton: {
    backgroundColor: '#4CAF50',
  },
  detailModalCompleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
    marginLeft: 8,
  },
  detailModalDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  detailModalDeleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F44336',
    marginLeft: 8,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedTaskCard: {
    opacity: 0.9,
    backgroundColor: '#F9FFF9',
  },
  completedTaskCardTitle: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  completedTaskCardDescription: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  frequencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 6,
    marginBottom: 4,
  },
  frequencyBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 6,
    marginBottom: 4,
  },
  notificationBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#F0F0F0',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  taskCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCardActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  taskCardShadow: {
    position: 'absolute',
    bottom: -5,
    left: 10,
    right: 10,
    height: 10,
    backgroundColor: 'transparent',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 2,
    zIndex: -1,
    marginBottom: 10,
  },
});

export default KisiselVazifeScreen;