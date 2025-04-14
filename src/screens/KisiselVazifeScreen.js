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
  Dimensions,
  SafeAreaView,
  Alert,
  AsyncStorage
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTaskContext } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { scheduleNotification, cancelNotification } from '../services/notificationService';

// Bileşenler
import TaskItem from '../components/TaskItem';
import TaskFormModal from '../components/TaskFormModal';
import EmptyTaskList from '../components/EmptyTaskList';
import CustomTimePicker from '../components/CustomTimePicker';

const { width, height } = Dimensions.get('window');

const KisiselVazifeScreen = () => {
  // Context ve state tanımlamaları
  const { tasks, addTask, toggleTaskCompletion, deleteTask, updateTask } = useTaskContext();
  const { theme, isDarkMode } = useTheme();

  // Animasyon değerleri
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [140, 60],
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

  // Silme işlemi için onay kutusu
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Renk paleti
  const colors = {
    primary: '#4A6FFF',
    secondary: '#6C63FF',
    accent: '#FF6584',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',
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
    if (activeFilter === 'Aktif') {
      result = result.filter(task => !task.isCompleted);
    } else if (activeFilter === 'Tamamlanan') {
      result = result.filter(task => task.isCompleted);
    } else if (activeFilter === 'Günlük') {
      result = result.filter(task => task.frequency === 'Günlük');
    } else if (activeFilter === 'Haftalık') {
      result = result.filter(task => task.frequency === 'Haftalık');
    } else if (activeFilter === 'Aylık') {
      result = result.filter(task => task.frequency === 'Aylık');
    } else if (activeFilter !== 'Tümü') {
      // Özel kategorilere göre filtrele
      result = result.filter(task => task.category === activeFilter);
    }
    // 'Tümü' filtresi için tüm görevleri göster

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

  // Görevi kaydet (ekle veya güncelle)
  const handleAddTask = (task) => {
    console.log("Kaydedilen görev:", task); // Hata ayıklama için

    if (selectedTask) {
      // Mevcut görevi güncelle
      updateTask({
        ...task,
        id: selectedTask.id,
        createdAt: selectedTask.createdAt,
        completedDates: selectedTask.completedDates || [],
      });
    } else {
      // Yeni görev ekle
      addTask({
        ...task,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isCompleted: false,
        completedDates: [],
      });
    }

    // Modalı kapat
    setModalVisible(false);

    // Seçili görevi temizle
    setSelectedTask(null);
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

    // Eğer görevde bildirim varsa, o bildirim ayarlarını göster
    if (task.notification) {
      setNotificationEnabled(true);

      // Bildirim zamanını ayarla
      if (task.notification.time) {
        const notificationTime = new Date(task.notification.time);
        setNotificationTime(notificationTime);
      }
    } else {
      // Bildirim yoksa, varsayılan değerleri ayarla
      setNotificationEnabled(false);

      // Varsayılan bildirim zamanı: şu andan 1 saat sonra
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      defaultTime.setMinutes(0);
      defaultTime.setSeconds(0);
      setNotificationTime(defaultTime);
    }

    setNotificationModalVisible(true);
  };

  // Bildirim ayarlarını kaydetme
  const handleSetNotification = async () => {
    if (!selectedTask) return;

    try {
      if (notificationEnabled) {
        // Bildirim zamanını ayarla
        let notificationTimeObj;

        try {
          notificationTimeObj = new Date(notificationTime);
          console.log("Bildirim zamanı (ham):", notificationTime);
          console.log("Bildirim zamanı (işlenmiş):", notificationTimeObj);

          // Geçerli bir tarih olduğundan emin olalım
          if (isNaN(notificationTimeObj.getTime())) {
            throw new Error("Geçersiz tarih");
          }
        } catch (error) {
          console.error("Tarih dönüştürme hatası:", error);

          // Hata durumunda şu anki zamanı kullan
          notificationTimeObj = new Date();
          notificationTimeObj.setSeconds(0);
          console.log("Varsayılan zaman kullanılıyor:", notificationTimeObj);

          Alert.alert(
            "Uyarı",
            "Bildirim zamanı ayarlanırken bir sorun oluştu. Şu anki zaman kullanılacak.",
            [{ text: "Tamam" }]
          );
        }

        // Bildirim ID'si oluştur
        const notificationId = `task_${selectedTask.id}`;

        // Önce varsa eski bildirimi iptal et
        if (selectedTask.notification?.id) {
          await cancelNotification(selectedTask.notification.id);
        }

        // Yeni bildirimi planla - notificationTimeObj'yi doğrudan kullan
        // scheduleNotification fonksiyonu içinde gerekli kontroller yapılacak
        await scheduleNotification({
          id: notificationId,
          title: 'Vazife Hatırlatıcı',
          body: selectedTask.title,
          data: { taskId: selectedTask.id },
          time: notificationTimeObj,
          repeat: true
        });

        // Görevi güncelle
        const updatedTask = {
          ...selectedTask,
          notification: {
            id: notificationId,
            enabled: true,
            time: notificationTimeObj.toISOString()
          }
        };

        // Görevi güncelle ve state'i yenile
        updateTask(updatedTask);
        setSelectedTask(updatedTask);

        // Bildirim modalını kapat
        setNotificationModalVisible(false);

        // Başarılı mesajı göster
        Alert.alert(
          "Bildirim Ayarlandı",
          `"${selectedTask.title}" görevi için her gün ${formatTime(notificationTimeObj)} saatinde bildirim alacaksınız.`,
          [{ text: "Tamam" }]
        );
      } else {
        // Bildirimi iptal et
        if (selectedTask.notification?.id) {
          await cancelNotification(selectedTask.notification.id);
        }

        // Görevi güncelle
        const updatedTask = {
          ...selectedTask,
          notification: null
        };

        // Görevi güncelle ve state'i yenile
        updateTask(updatedTask);
        setSelectedTask(updatedTask);

        // Bildirim modalını kapat
        setNotificationModalVisible(false);

        // Bilgi mesajı göster
        Alert.alert(
          "Bildirim İptal Edildi",
          `"${selectedTask.title}" görevi için bildirim iptal edildi.`,
          [{ text: "Tamam" }]
        );
      }
    } catch (error) {
      console.error("Bildirim ayarlanırken hata oluştu:", error);
      Alert.alert(
        "Hata",
        "Bildirim ayarlanırken bir hata oluştu: " + error.message,
        [{ text: "Tamam" }]
      );
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
                    {getActiveTasksCount()}
                  </Text>
                  <Text style={styles.headerStatLabel}>Aktif</Text>
                </View>
                <View style={styles.headerStatDivider} />
                <View style={styles.headerStatItem}>
                  <Text style={styles.headerStatNumber}>
                    {getCompletedTasksCount()}
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

  // Filtre butonlarını render et
  const renderFilterButtons = () => {
    // Varsayılan filtreler - "Aktif" ve "Tamamlanan" en sona taşındı
    const defaultFilters = ['Tümü', 'Günlük', 'Haftalık', 'Aylık', 'Aktif', 'Tamamlanan'];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScrollContent}
      >
        {defaultFilters.map((filter) => {
          // Filtre için renk belirle
          let filterColor = colors.primary;
          if (filter === 'Aktif') filterColor = colors.success;
          else if (filter === 'Tamamlanan') filterColor = colors.accent;
          else if (filter === 'Günlük') filterColor = colors.primary;
          else if (filter === 'Haftalık') filterColor = colors.warning;
          else if (filter === 'Aylık') filterColor = colors.info;

          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.activeFilterButton,
                activeFilter === filter && { backgroundColor: `${filterColor}20` }
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === filter && { color: filterColor, fontWeight: '600' }
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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

  // Vazife düzenleme
  const handleEditTask = (task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  // Vazife kartı bileşeni
  const renderTaskItem = ({ item }) => {
    return (
      <TaskItem
        key={item.id}
        task={item}
        onToggleComplete={toggleTaskCompletion}
        onDelete={confirmDelete}
        onEdit={handleEditTask}
        onPress={showTaskDetails}
        onSetNotification={showNotificationSettings}
      />
    );
  };

  // Vazife ekleme butonu
  const renderAddButton = () => {
    return (
      <TouchableOpacity
        style={styles.addTaskButton}
        onPress={handleAddButtonPress}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.addButtonGradient}
        >
          <Icon name="plus" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Vazife ekleme modalı
  const renderAddTaskModal = () => {
    return (
      <TaskFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddTask}
        initialTask={selectedTask}
        theme={theme}
      />
    );
  };

  // Bildirim modalını yeniden tasarlayalım
  const renderNotificationModal = () => {
    if (!selectedTask) return null;

    // Görevin kategorisine göre renk belirle
    const taskColor = selectedTask.color || categoryColors[selectedTask.category] || colors.primary;

    return (
      <Modal
        visible={notificationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.notificationModal, { backgroundColor: theme.card }]}>
            {/* Modal başlık */}
            <LinearGradient
              colors={[taskColor, `${taskColor}99`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.notificationModalHeader}
            >
              <TouchableOpacity
                style={styles.notificationModalCloseButton}
                onPress={() => setNotificationModalVisible(false)}
              >
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.notificationModalHeaderContent}>
                <Text style={styles.notificationModalTitle}>Bildirim Ayarla</Text>
                <Text style={styles.notificationModalSubtitle}>{selectedTask.title}</Text>
              </View>
            </LinearGradient>

            {/* Bildirim Ayarları */}
            <View style={styles.notificationModalContent}>
              {/* Bildirim Açma/Kapama */}
              <View style={styles.notificationSwitchContainer}>
                <View style={styles.notificationSwitchLabel}>
                  <Icon
                    name={notificationEnabled ? "bell-ring" : "bell-off-outline"}
                    size={20}
                    color={notificationEnabled ? taskColor : theme.textSecondary}
                  />
                  <Text style={[
                    styles.notificationSwitchText,
                    { color: notificationEnabled ? taskColor : theme.textSecondary }
                  ]}>
                    Bildirim {notificationEnabled ? "Açık" : "Kapalı"}
                  </Text>
                </View>

                <Switch
                  value={notificationEnabled}
                  onValueChange={setNotificationEnabled}
                  trackColor={{ false: '#E0E0E0', true: `${taskColor}50` }}
                  thumbColor={notificationEnabled ? taskColor : '#FFF'}
                />
              </View>

              {/* Bildirim Zamanı */}
              {notificationEnabled && (
                <View style={styles.notificationTimeContainer}>
                  <Text style={styles.notificationTimeLabel}>Bildirim Zamanı</Text>

                  <TouchableOpacity
                    style={[styles.notificationTimeButton, { borderColor: taskColor }]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Icon name="clock-outline" size={18} color={taskColor} />
                    <Text style={[styles.notificationTimeText, { color: taskColor }]}>
                      {notificationTime.getHours().toString().padStart(2, '0')}:
                      {notificationTime.getMinutes().toString().padStart(2, '0')}
                    </Text>
                    <Icon name="chevron-down" size={18} color={taskColor} />
                  </TouchableOpacity>

                  {/* Zaman Seçici */}
                  {showTimePicker && (
                    <View style={styles.timePickerWrapper}>
                      <CustomTimePicker
                        value={notificationTime}
                        onChange={handleTimeChange}
                        onClose={() => setShowTimePicker(false)}
                        color={taskColor}
                      />
                    </View>
                  )}
                </View>
              )}

              {/* Bildirim Açıklaması */}
              {notificationEnabled && (
                <View style={styles.notificationHint}>
                  <Icon name="information-outline" size={16} color="#999" />
                  <Text style={styles.notificationHintText}>
                    Bildirim, her gün seçtiğiniz saatte gönderilecektir.
                  </Text>
                </View>
              )}

              {/* Butonlar */}
              <View style={styles.notificationButtonsContainer}>
                <TouchableOpacity
                  style={[styles.notificationButton, styles.notificationCancelButton]}
                  onPress={() => setNotificationModalVisible(false)}
                >
                  <Text style={styles.notificationCancelButtonText}>İptal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.notificationButton,
                    styles.notificationSaveButton,
                    { backgroundColor: taskColor }
                  ]}
                  onPress={handleSetNotification}
                >
                  <Icon name="bell" size={18} color="#FFF" />
                  <Text style={styles.notificationSaveButtonText}>
                    {selectedTask.notification?.enabled ? "Güncelle" : "Kaydet"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Detay modalı
  const renderDetailModal = () => {
    if (!selectedTask) return null;

    // Görevin kategorisine göre renk belirle
    const taskColor = selectedTask.color || categoryColors[selectedTask.category] || colors.primary;
    const categoryIcon = categoryIcons[selectedTask.category] || 'star-outline';

    return (
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModal, { backgroundColor: theme.card }]}>
            {/* Modal başlık - Görevin rengini kullan */}
            <LinearGradient
              colors={[taskColor, taskColor + '99']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.detailModalHeader}
            >
              <TouchableOpacity
                style={styles.detailModalCloseButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Icon name="close" size={28} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.detailModalHeaderContent}>
                <Text style={styles.detailModalTitle}>{selectedTask.title}</Text>

                <View style={styles.detailModalMeta}>
                  <Icon name={categoryIcon} size={16} color="#FFF" />
                  <Text style={styles.detailModalMetaText}>{selectedTask.category}</Text>

                  <View style={styles.detailModalMetaDot} />

                  <Icon name="calendar-outline" size={16} color="#FFF" />
                  <Text style={styles.detailModalMetaText}>{selectedTask.frequency}</Text>

                  {selectedTask.notification && selectedTask.notification.enabled ? (
                    <>
                      <View style={styles.detailModalMetaDot} />
                      <Icon name="bell-ring" size={16} color="#FFC107" />
                      <Text style={styles.detailModalMetaText}>
                        Her gün {new Date(selectedTask.notification.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
            </LinearGradient>

            {/* Modal içerik */}
            <View style={styles.detailModalBody}>
              {/* Açıklama */}
              {selectedTask.description ? (
                <View style={styles.detailModalSection}>
                  <Text style={[styles.detailModalSectionTitle, { color: theme.textSecondary }]}>
                    Açıklama
                  </Text>
                  <Text style={[styles.detailModalDescription, { color: theme.text }]}>
                    {selectedTask.description}
                  </Text>
                </View>
              ) : null}

              {/* Durum */}
              <View style={styles.detailModalSection}>
                <Text style={[styles.detailModalSectionTitle, { color: theme.textSecondary }]}>
                  Durum
                </Text>
                <View style={styles.detailModalStatus}>
                  <View
                    style={[
                      styles.detailModalStatusIndicator,
                      { backgroundColor: selectedTask.isCompleted ? colors.success : colors.warning }
                    ]}
                  />
                  <Text style={[styles.detailModalStatusText, { color: theme.text }]}>
                    {selectedTask.isCompleted ? 'Tamamlandı' : 'Devam Ediyor'}
                  </Text>
                </View>
              </View>

              {/* Bildirim */}
              <View style={styles.detailModalSection}>
                <Text style={[styles.detailModalSectionTitle, { color: theme.textSecondary }]}>
                  Bildirim
                </Text>
                <View style={styles.detailModalNotification}>
                  <Icon
                    name="bell-outline"
                    size={20}
                    color={selectedTask.notification ? colors.warning : theme.textSecondary}
                  />
                  <Text style={[styles.detailModalNotificationText, { color: theme.text }]}>
                    {selectedTask.notification ? `Her gün ${new Date(selectedTask.notification.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Bildirim ayarlanmadı'}
                  </Text>
                </View>
              </View>

              {/* Aksiyon butonları */}
              <View style={styles.detailModalActions}>
                <TouchableOpacity
                  style={[
                    styles.detailModalActionButton,
                    {
                      backgroundColor: selectedTask.notification?.enabled
                        ? '#FFC10720'
                        : `${taskColor}15`
                    }
                  ]}
                  onPress={() => {
                    setDetailModalVisible(false);
                    showNotificationSettings(selectedTask);
                  }}
                >
                  <Icon
                    name={selectedTask.notification?.enabled ? "bell-ring" : "bell-outline"}
                    size={20}
                    color={selectedTask.notification?.enabled ? "#FFC107" : taskColor}
                  />
                  <Text
                    style={[
                      styles.detailActionButtonText,
                      {
                        color: selectedTask.notification?.enabled ? "#FFC107" : taskColor
                      }
                    ]}
                  >
                    {selectedTask.notification?.enabled ? "Bildirimi Düzenle" : "Bildirim Ayarla"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.detailModalActionButton,
                    styles.detailModalCompleteButton,
                    { backgroundColor: selectedTask.isCompleted ? colors.warning : colors.success }
                  ]}
                  onPress={() => {
                    toggleTaskCompletion(selectedTask.id);
                    setDetailModalVisible(false);
                  }}
                >
                  <Icon
                    name={selectedTask.isCompleted ? "refresh" : "check"}
                    size={18}
                    color="#FFF"
                  />
                  <Text style={styles.detailModalCompleteButtonText}>
                    {selectedTask.isCompleted ? 'Tekrar Başlat' : 'Tamamla'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.detailModalDeleteButton,
                  { borderColor: colors.error }
                ]}
                onPress={() => {
                  setDetailModalVisible(false);
                  confirmDelete(selectedTask.id);
                }}
              >
                <Icon name="trash-can-outline" size={18} color={colors.error} />
                <Text style={[styles.detailModalDeleteButtonText, { color: colors.error }]}>
                  Sil
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Boş liste durumunda gösterilecek bileşen
  const renderEmptyList = () => {
    return (
      <EmptyTaskList
        onAddTask={() => setModalVisible(true)}
        theme={theme}
      />
    );
  };

  // Silme işlemi için onay isteyen fonksiyon
  const confirmDelete = (taskId) => {
    setTaskToDelete(taskId);
    setDeleteConfirmVisible(true);
  };

  // Onay sonrası silme işlemi
  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete);
      setDeleteConfirmVisible(false);
      setTaskToDelete(null);
    }
  };

  // Silme işlemini iptal etme
  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
    setTaskToDelete(null);
  };

  // Aktif ve tamamlanan görev sayılarını hesaplayan fonksiyonlar
  const getActiveTasksCount = () => {
    return tasks.filter(task => !task.isCompleted).length;
  };

  const getCompletedTasksCount = () => {
    return tasks.filter(task => task.isCompleted).length;
  };

  // handleTimeChange fonksiyonunu düzeltelim
  const handleTimeChange = (event) => {
    if (event.type === 'set' && event.nativeEvent.timestamp) {
      const selectedTime = new Date(event.nativeEvent.timestamp);
      setNotificationTime(selectedTime);
      setShowTimePicker(false); // Seçim yapıldıktan sonra picker'ı kapat
    }
  };

  // Artı butonuna basıldığında çağrılan fonksiyon
  const handleAddButtonPress = () => {
    // Seçili görevi temizle - böylece boş form açılır
    setSelectedTask(null);

    // Yeni görev kategorisini varsayılan olarak ayarla (isteğe bağlı)
    setNewTaskCategory('Kişisel');

    // Modalı aç
    setModalVisible(true);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Gradient arka plan için */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 70 }}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />

        <View style={styles.container}>
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
            {renderFilterButtons()}
          </View>

          {/* Görev Listesi */}
          <FlatList
            data={filteredTasks}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.taskList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyList}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
          />

          {/* Yeni görev ekleme butonu */}
          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={handleAddButtonPress}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Icon name="plus" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Görev ekleme/düzenleme modalı */}
          <TaskFormModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onSave={handleAddTask}
            initialTask={selectedTask}
            theme={theme}
          />
        </View>
      </SafeAreaView>

      {renderNotificationModal()}
      {renderDetailModal()}

      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModal, { backgroundColor: theme.card }]}>
            <Icon name="alert-circle-outline" size={40} color="#FF6584" style={styles.confirmIcon} />
            <Text style={[styles.confirmTitle, { color: theme.text }]}>Emin misiniz?</Text>
            <Text style={[styles.confirmText, { color: theme.textSecondary }]}>
              Bu vazife kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={cancelDelete}
              >
                <Text style={styles.cancelButtonText}>Vazgeç</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteButton]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.deleteButtonText}>Sil</Text>
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
    backgroundColor: '#FFFFFF',
    paddingTop: 0,
  },
  header: {
    width: '100%',
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 30 : StatusBar.currentHeight + 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,

  },
  headerContent: {
    justifyContent: 'space-between',
    height: '100%',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerDate: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 5,
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  headerStatItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerStatNumber: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  headerStatLabel: {
    fontSize: 11,
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
    paddingVertical: Platform.OS === 'ios' ? 10 : 0,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  notificationModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  notificationModalHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    position: 'relative',
  },
  notificationModalCloseButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 10,
  },
  notificationModalHeaderContent: {
    marginTop: 5,
  },
  notificationModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  notificationModalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    maxWidth: '80%',
  },
  notificationModalContent: {
    padding: 20,
  },
  notificationSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notificationSwitchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationSwitchText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  notificationTimeContainer: {
    marginBottom: 20,
  },
  notificationTimeLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555',
    marginBottom: 10,
  },
  notificationTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#F8F8F8',
  },
  notificationTimeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  notificationHintText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  notificationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  notificationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  notificationCancelButton: {
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  notificationCancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  notificationSaveButton: {
    marginLeft: 10,
  },
  notificationSaveButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  detailModal: {
    width: '90%',
    maxHeight: '65%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  detailModalHeader: {
    padding: 16,
    paddingBottom: 20,
  },
  detailModalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalHeaderContent: {
    marginTop: 10,
  },
  detailModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  detailModalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailModalMetaText: {
    fontSize: 13,
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
    marginBottom: 14,
  },
  detailModalSectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  detailModalDescription: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  detailModalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  detailModalStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  detailModalStatusText: {
    fontSize: 15,
    color: '#333',
  },
  detailModalNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  detailModalNotificationText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
  },
  detailModalActions: {
    flexDirection: 'row',
    marginBottom: 12,
    marginTop: 6,
  },
  detailModalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  detailActionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
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
    marginTop: 4,
  },
  detailModalDeleteButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#F44336',
    marginLeft: 6,
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
  confirmModal: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmIcon: {
    marginBottom: 15,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F7FA',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FF6584',
  },
  deleteButtonText: {
    color: '#FFF',
    fontWeight: '500',
  },
  iosTimePickerContainer: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  activeNotificationContainer: {
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4A6FFF',
  },
  activeNotificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeNotificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  activeNotificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeNotificationTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeNotificationTimeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  activeNotificationTimeValue: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeNotificationTimeValueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timePickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
});

export default KisiselVazifeScreen;