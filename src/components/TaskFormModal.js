import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

// Renk paleti - bileşen dışında tanımlayalım
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
};

const TaskFormModal = ({ 
  visible, 
  onClose, 
  onSave, 
  initialTask = null,
  theme
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('checkbox-marked-circle-outline');
  const [frequency, setFrequency] = useState('Günlük');
  
  // UI state
  const [activeTab, setActiveTab] = useState('details');
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  // Kategori renkleri
  const categoryColors = {
    'Sağlık': colors.success,
    'Fitness': colors.primary,
    'Beslenme': colors.error,
    'Zihinsel Gelişim': colors.purple,
    'Kişisel Gelişim': colors.secondary,
    'Sosyal': colors.warning,
    'Üretkenlik': colors.info,
    'Finans': colors.teal,
    'Diğer': colors.orange,
  };
  
  // Kategori seçenekleri
  const categories = Object.keys(categoryColors);
  
  // Frekans seçenekleri
  const frequencies = ['Günlük', 'Haftalık', 'Aylık', 'Bir Kez'];
  
  // İkon seçenekleri - kategorilere göre gruplandırılmış ve genişletilmiş
  const iconGroups = {
    'Sağlık & Fitness': [
      'heart', 'heart-pulse', 'pill', 'medical-bag', 'hospital-box', 'water', 'sleep',
      'food-apple', 'meditation', 'run', 'walk', 'bike', 'dumbbell',
      'food', 'food-fork-drink', 'bottle-tonic-plus', 'cup-water', 'silverware-fork-knife',
      'smoking-off', 'smoking', 'hospital', 'bandage', 'eye', 'ear-hearing', 'tooth'
    ],
    'Üretkenlik & Çalışma': [
      'check-circle', 'clipboard-check', 'calendar-check', 'clock-check', 'alarm',
      'book', 'book-open-page-variant', 'notebook', 'pencil', 'briefcase', 'chart-line',
      'laptop', 'desktop-mac', 'cellphone', 'email', 'file-document', 'folder',
      'clock', 'timer', 'calendar', 'calendar-month', 'calendar-today', 'calendar-week',
      'clipboard-list', 'clipboard-text', 'clipboard-outline', 'clipboard-plus',
      'format-list-bulleted', 'format-list-checks', 'format-list-numbered', 'text-box-check'
    ],
    'Kişisel Gelişim': [
      'account', 'account-heart', 'brain', 'lightbulb', 'school', 'certificate',
      'palette', 'music', 'microphone', 'camera', 'movie',
      'book-open-variant', 'bookshelf', 'head-lightbulb', 'head-question', 'head-cog',
      'brush', 'palette-swatch', 'drawing', 'pen',
      'code-tags', 'code-braces',
      'thought-bubble', 'chat', 'message', 'message-text'
    ],
    'Ev & Yaşam': [
      'home', 'home-variant', 'home-automation', 'home-floor-a', 'home-floor-b',
      'broom', 'vacuum', 'washing-machine', 'dishwasher', 'fridge', 'stove',
      'shower', 'toilet', 'bed-empty', 'bed-king', 'sofa',
      'table-furniture', 'desk', 'lamp', 'ceiling-light', 'television', 'radio',
      'flower', 'flower-tulip', 'flower-poppy', 'nature', 'tree', 'pine-tree',
      'dog', 'cat', 'fish', 'bird', 'paw', 'bone'
    ],
    'Finans & Alışveriş': [
      'bank', 'cash', 'cash-multiple', 'credit-card', 'credit-card-outline', 'credit-card-scan',
      'currency-usd', 'currency-eur', 'currency-btc', 'chart-areaspline',
      'chart-bar', 'chart-bell-curve', 'chart-bubble', 'chart-donut', 'chart-pie',
      'shopping', 'shopping-outline', 'cart', 'cart-outline', 'cart-plus', 'basket',
      'store', 'store-24-hour', 'tag', 'tag-outline', 'tag-heart', 'sale',
      'gift', 'gift-outline', 'package-variant', 'package-variant-closed'
    ],
    'Sosyal & İletişim': [
      'account-group', 'account-multiple', 'account-supervisor', 'account-supervisor-circle',
      'human-greeting', 'human-handsup', 'human-male-female', 'handshake',
      'chat-outline', 'message-outline', 'message-text-outline',
      'forum', 'forum-outline', 'email-outline', 'email-open', 'send', 'send-outline',
      'phone', 'phone-outline', 'cellphone', 'video',
      'facebook', 'linkedin', 'youtube', 'whatsapp'
    ],
    'Seyahat & Ulaşım': [
      'airplane', 'airplane-takeoff', 'airplane-landing', 'airport', 'passport',
      'train', 'train-car', 'bus', 'bus-articulated-front', 'tram', 'subway',
      'car', 'car-sports', 'car-hatchback', 'car-estate', 'car-convertible',
      'bike', 'motorbike', 'walk', 'run', 'ferry', 'sail-boat',
      'map', 'map-marker', 'map-marker-outline', 'compass', 'compass-outline',
      'earth', 'beach', 'city', 'city-variant'
    ],
    'Diğer': [
      'star', 'star-outline', 'star-half', 'star-circle', 'star-box',
      'weather-sunny', 'weather-night', 'weather-cloudy', 'weather-rainy', 'weather-snowy',
      'umbrella', 'umbrella-closed', 'sunglasses', 'glasses',
      'gamepad', 'gamepad-variant', 'cards', 'dice-multiple',
      'crown', 'trophy', 'medal', 'podium', 'podium-gold', 'podium-silver',
      'emoticon', 'emoticon-happy', 'emoticon-sad', 'emoticon-cool', 'emoticon-excited'
    ]
  };
  
  // Tüm ikonları düz bir diziye çevir
  const allIcons = Object.values(iconGroups).flat();
  
  // Modal açıldığında form verilerini ayarla
  useEffect(() => {
    if (initialTask) {
      // Düzenleme modunda ise mevcut değerleri yükle
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setCategory(initialTask.category || '');
      setIcon(initialTask.icon || 'checkbox-marked-circle-outline');
      setFrequency(initialTask.frequency || 'Günlük');
    } else {
      // Yeni görev için her zaman boş değerler
      setTitle('');
      setDescription('');
      setCategory('');
      setIcon('checkbox-marked-circle-outline');
      setFrequency('Günlük');
    }
  }, [initialTask, visible]);
  
  // Formu kaydet
  const handleSave = () => {
    // Validasyon kontrolleri
    if (!title.trim()) {
      alert('Lütfen bir başlık girin');
      return;
    }
    
    if (!category) {
      alert('Lütfen bir kategori seçin');
      return;
    }
    
    if (!icon) {
      alert('Lütfen bir ikon seçin');
      return;
    }
    
    if (!frequency) {
      alert('Lütfen bir sıklık seçin');
      return;
    }
    
    const task = {
      id: initialTask?.id || Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      category: category,
      icon: icon,
      frequency: frequency,
      color: categoryColors[category] || colors.primary,
      isCompleted: initialTask?.isCompleted || false,
      createdAt: initialTask?.createdAt || new Date().toISOString(),
      completedDates: initialTask?.completedDates || [],
    };
    
    onSave(task);
    onClose();
  };
  
  // Kategori seçimi - key ekleyelim
  const renderCategoryItem = (item) => {
    const isSelected = category === item;
    const categoryColor = categoryColors[item];
    
    return (
      <TouchableOpacity
        key={`category-${item}`}
        style={[
          styles.categoryItem,
          isSelected && { borderColor: categoryColor, borderWidth: 2 }
        ]}
        onPress={() => setCategory(item)}
      >
        <LinearGradient
          colors={[categoryColor, `${categoryColor}99`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.categoryColor,
            isSelected && { opacity: 1 }
          ]}
        />
        <Text style={[
          styles.categoryText,
          isSelected && { color: categoryColor, fontWeight: '600' }
        ]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // Frekans seçimi - key ekleyelim
  const renderFrequencyItem = (item) => {
    const isSelected = frequency === item;
    
    return (
      <TouchableOpacity
        key={`frequency-${item}`}
        style={[
          styles.frequencyItem,
          isSelected && { 
            borderColor: colors.primary,
            backgroundColor: `${colors.primary}15`,
          }
        ]}
        onPress={() => setFrequency(item)}
      >
        <Text style={[
          styles.frequencyText,
          isSelected && { color: colors.primary, fontWeight: '600' }
        ]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // İkon seçimi
  const renderIconItem = ({ item }) => {
    const isSelected = icon === item;
    const iconColor = isSelected ? colors.primary : '#777';
    
    return (
      <TouchableOpacity
        style={[
          styles.iconItem,
          isSelected && { 
            backgroundColor: `${colors.primary}15`,
            borderColor: colors.primary
          }
        ]}
        onPress={() => setIcon(item)}
      >
        <Icon name={item} size={24} color={iconColor} />
      </TouchableOpacity>
    );
  };
  
  // İkon gruplarını render et
  const renderIconGroups = () => {
    return Object.entries(iconGroups).map(([groupName, icons]) => (
      <View key={`group-${groupName}`} style={styles.iconGroup}>
        <LinearGradient
          colors={['#4A6FFF', '#6C63FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.iconGroupHeader}
        >
          <Text style={styles.iconGroupTitle}>{groupName}</Text>
        </LinearGradient>
        <View style={styles.iconGrid}>
          {icons.map(iconName => (
            <TouchableOpacity
              key={`icon-${iconName}`}
              style={[
                styles.iconItem,
                icon === iconName && { 
                  backgroundColor: `${colors.primary}15`,
                  borderColor: colors.primary,
                  borderWidth: 2
                }
              ]}
              onPress={() => setIcon(iconName)}
            >
              <Icon 
                name={iconName} 
                size={24} 
                color={icon === iconName ? colors.primary : '#777'} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ));
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {initialTask ? 'Vazife Düzenle' : 'Yeni Vazife Ekle'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'details' && { 
                    borderBottomColor: colors.primary,
                    borderBottomWidth: 2
                  }
                ]}
                onPress={() => setActiveTab('details')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'details' && { color: colors.primary }
                ]}>
                  Detaylar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'category' && { 
                    borderBottomColor: colors.primary,
                    borderBottomWidth: 2
                  }
                ]}
                onPress={() => setActiveTab('category')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'category' && { color: colors.primary }
                ]}>
                  Kategori
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'icon' && { 
                    borderBottomColor: colors.primary,
                    borderBottomWidth: 2
                  }
                ]}
                onPress={() => setActiveTab('icon')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'icon' && { color: colors.primary }
                ]}>
                  İkon
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Form Content */}
            <ScrollView style={styles.formContent}>
              {/* Detaylar Tab */}
              {activeTab === 'details' && (
                <View style={styles.formSection}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Başlık</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="Vazife başlığı"
                      placeholderTextColor={theme.textSecondary}
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Açıklama</Text>
                    <TextInput
                      style={[styles.textArea, { color: theme.text, borderColor: theme.border }]}
                      placeholder="Vazife açıklaması (isteğe bağlı)"
                      placeholderTextColor={theme.textSecondary}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Sıklık</Text>
                    <View style={styles.frequencyContainer}>
                      {frequencies.map(item => renderFrequencyItem(item))}
                    </View>
                  </View>
                </View>
              )}
              
              {/* Kategori Tab */}
              {activeTab === 'category' && (
                <View style={styles.formSection}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Kategori Seçin
                  </Text>
                  <View style={styles.categoriesContainer}>
                    {categories.map(item => renderCategoryItem(item))}
                  </View>
                </View>
              )}
              
              {/* İkon Tab */}
              {activeTab === 'icon' && (
                <View style={styles.formSection}>
                  <View style={styles.selectedIconPreview}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Seçilen İkon
                    </Text>
                    <View style={styles.iconPreviewContainer}>
                      <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconPreviewGradient}
                      >
                        <Icon name={icon} size={40} color="#FFFFFF" />
                      </LinearGradient>
                    </View>
                  </View>
                  
                  <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
                    İkon Seçin
                  </Text>
                  <View style={styles.iconContainer}>
                    {renderIconGroups()}
                  </View>
                </View>
              )}
            </ScrollView>
            
            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSave}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>
                    {initialTask ? 'Güncelle' : 'Kaydet'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#777777',
  },
  formContent: {
    maxHeight: 400,
  },
  formSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 100,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  frequencyItem: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  frequencyText: {
    fontSize: 14,
    color: '#555555',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    opacity: 0.7,
  },
  categoryText: {
    fontSize: 14,
    color: '#555555',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGroup: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconGroupHeader: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  iconGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  iconItem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    backgroundColor: '#F9F9F9',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#777777',
  },
  saveButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedIconPreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconPreviewContainer: {
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconPreviewGradient: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TaskFormModal; 