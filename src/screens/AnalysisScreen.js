import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions,
  Animated,
  StatusBar,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTaskContext } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import AppHeader from '../components/AppHeader';

const { width } = Dimensions.get('window');

// Renk paleti
const colors = {
  primary: '#4A6FFF',
  secondary: '#6C63FF',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  purple: '#9C27B0',
  teal: '#009688',
  pink: '#E91E63',
  orange: '#FF9800',
  lightBlue: '#03A9F4',
  darkBlue: '#3F51B5',
  grey: '#9E9E9E',
  lightGrey: '#F5F5F5',
  darkGrey: '#616161',
};

// Gradyan renkleri
const gradients = {
  primary: ['#4A6FFF', '#6C63FF'],
  secondary: ['#6C63FF', '#8E99F3'],
  success: ['#4CAF50', '#8BC34A'],
  warning: ['#FFC107', '#FFD54F'],
  error: ['#F44336', '#FF7043'],
  purple: ['#9C27B0', '#BA68C8'],
  teal: ['#009688', '#4DB6AC'],
  orange: ['#FF9800', '#FFB74D'],
  pink: ['#E91E63', '#F48FB1'],
  blue: ['#03A9F4', '#4FC3F7'],
};

// Kategori renkleri ve ikonları
const categoryConfig = {
  'Fitness': { color: colors.lightBlue, icon: 'dumbbell' },
  'Zihinsel Sağlık': { color: colors.purple, icon: 'brain' },
  'Sağlık': { color: colors.success, icon: 'heart-pulse' },
  'Kişisel Gelişim': { color: colors.primary, icon: 'book-open-variant' },
  'Üretkenlik': { color: colors.orange, icon: 'clock-time-four' },
  'Sosyal': { color: colors.pink, icon: 'account-group' },
  'Finans': { color: colors.teal, icon: 'cash' },
  'Ev İşleri': { color: colors.grey, icon: 'home' },
};

// Mock veri
const mockTasks = [
  { id: 1, title: 'Sabah Koşusu', category: 'Fitness', completed: true, frequency: 'Günlük', priority: 'Yüksek', streak: 5 },
  { id: 2, title: 'Meditasyon', category: 'Zihinsel Sağlık', completed: true, frequency: 'Günlük', priority: 'Orta', streak: 10 },
  { id: 3, title: 'Su İçmek (2L)', category: 'Sağlık', completed: false, frequency: 'Günlük', priority: 'Yüksek', streak: 0 },
  { id: 4, title: 'Kitap Okuma', category: 'Kişisel Gelişim', completed: true, frequency: 'Günlük', priority: 'Orta', streak: 7 },
  { id: 5, title: 'Vitamin Almak', category: 'Sağlık', completed: true, frequency: 'Günlük', priority: 'Düşük', streak: 15 },
  { id: 6, title: 'Haftalık Planlama', category: 'Üretkenlik', completed: false, frequency: 'Haftalık', priority: 'Yüksek', streak: 0 },
  { id: 7, title: 'Aile Görüşmesi', category: 'Sosyal', completed: true, frequency: 'Haftalık', priority: 'Orta', streak: 3 },
  { id: 8, title: 'Bütçe Kontrolü', category: 'Finans', completed: false, frequency: 'Aylık', priority: 'Yüksek', streak: 0 },
  { id: 9, title: 'Ev Temizliği', category: 'Ev İşleri', completed: true, frequency: 'Haftalık', priority: 'Düşük', streak: 2 },
  { id: 10, title: 'Yeni Beceri Öğrenme', category: 'Kişisel Gelişim', completed: false, frequency: 'Haftalık', priority: 'Orta', streak: 0 },
];

const AnalysisScreen = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('Özet');
  const [selectedPeriod, setSelectedPeriod] = useState('Haftalık');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Mock veriyi kullan
  const tasks = mockTasks;
  
  // Animasyon efekti
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    return () => {
      fadeAnim.setValue(0);
    };
  }, [activeTab, selectedPeriod, selectedCategory]);
  
  // Filtreleme fonksiyonları
  const getFilteredTasks = () => {
    let filtered = [...tasks];
    
    if (selectedCategory !== 'Tümü') {
      filtered = filtered.filter(task => task.category === selectedCategory);
    }
    
    return filtered;
  };
  
  // Tamamlanma oranı hesaplama
  const calculateCompletionRate = (taskList) => {
    if (!taskList || taskList.length === 0) return 0;
    const completedCount = taskList.filter(task => task.completed).length;
    return Math.round((completedCount / taskList.length) * 100);
  };
  
  // Kategori dağılımı hesaplama
  const getCategoryDistribution = () => {
    const filteredTasks = getFilteredTasks();
    const categories = {};
    
    filteredTasks.forEach(task => {
      const category = task.category || 'Diğer';
      if (!categories[category]) {
        categories[category] = { total: 0, completed: 0 };
      }
      categories[category].total++;
      if (task.completed) {
        categories[category].completed++;
      }
    });
    
    return categories;
  };
  
  // Animasyonlu kart bileşeni
  const AnimatedCard = ({ children, delay = 0, style }) => {
    const animStyle = {
      opacity: fadeAnim,
      transform: [
        {
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    };
    
    return (
      <Animated.View style={[styles.card, style, animStyle]}>
      {children}
      </Animated.View>
    );
  };
  
  // Gradyan başlık bileşeni
  const GradientHeader = ({ title, icon, colors }) => {
    return (
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientHeader}
      >
        <Icon name={icon} size={24} color="#FFFFFF" />
        <Text style={styles.gradientHeaderTitle}>{title}</Text>
      </LinearGradient>
    );
  };
  
  // Dönem Seçici bileşeni
  const PeriodSelector = () => {
    return (
      <View style={styles.periodSelector}>
        {['Günlük', 'Haftalık', 'Aylık', 'Yıllık'].map(period => (
        <TouchableOpacity
            key={period}
          style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period)}
        >
          <Text
            style={[
                styles.periodButtonText,
                { color: selectedPeriod === period ? '#FFFFFF' : theme.textSecondary }
            ]}
          >
              {period}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  };
  
  // Özet sekmesi
  const SummaryTab = () => {
    const filteredTasks = getFilteredTasks();
    const completionRate = calculateCompletionRate(filteredTasks);
    const completedCount = filteredTasks.filter(task => task.completed).length;
    const pendingCount = filteredTasks.length - completedCount;
    const categories = getCategoryDistribution();
    
    // En yüksek başarı oranına sahip kategoriyi bul
    let bestCategory = { name: 'Yok', rate: 0 };
    Object.entries(categories).forEach(([name, data]) => {
      const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
      if (rate > bestCategory.rate) {
        bestCategory = { name, rate };
      }
    });
    
    // En uzun seriyi bul
    const longestStreak = Math.max(...filteredTasks.map(task => task.streak || 0));
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Dönem Seçici */}
        <PeriodSelector />
        
        {/* Genel Durum Kartı */}
        <AnimatedCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Icon name="chart-box" size={22} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Genel Durum
              </Text>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Icon name="format-list-checks" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {filteredTasks.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Toplam
              </Text>
        </View>
        
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.success + '15' }]}>
                <Icon name="check-circle" size={24} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {completedCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Tamamlanan
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.warning + '15' }]}>
                <Icon name="clock-time-four" size={24} color={colors.warning} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {pendingCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Bekleyen
              </Text>
            </View>
        </View>
        
          <View style={styles.progressContainer}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text, fontSize: 16 }]}>
                Genel Tamamlanma Oranı
          </Text>
              <View style={styles.completionBadge}>
                <Text style={styles.completionBadgeText}>
                  %{completionRate}
                </Text>
              </View>
            </View>
            
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${completionRate}%` }]}
            />
          </View>
          </View>
        </AnimatedCard>
        
        {/* Başarı Özeti Kartı */}
        <AnimatedCard delay={100}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Icon name="trophy" size={22} color={colors.orange} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Başarı Özeti
              </Text>
            </View>
            </View>
            
          <View style={styles.achievementContainer}>
            <View style={styles.achievementItem}>
              <View style={[styles.achievementIconContainer, { backgroundColor: colors.purple + '15' }]}>
                <Icon name="star" size={24} color={colors.purple} />
              </View>
              <View style={styles.achievementContent}>
                <Text style={[styles.achievementTitle, { color: theme.text }]}>
                  En Başarılı Kategori
                </Text>
                <Text style={[styles.achievementValue, { color: theme.textSecondary }]}>
                  {bestCategory.name} (%{bestCategory.rate})
              </Text>
            </View>
          </View>
            
            <View style={styles.achievementItem}>
              <View style={[styles.achievementIconContainer, { backgroundColor: colors.orange + '15' }]}>
                <Icon name="fire" size={24} color={colors.orange} />
        </View>
              <View style={styles.achievementContent}>
                <Text style={[styles.achievementTitle, { color: theme.text }]}>
                  En Uzun Seri
                </Text>
                <Text style={[styles.achievementValue, { color: theme.textSecondary }]}>
                  {longestStreak} gün
                </Text>
              </View>
            </View>
          </View>
        </AnimatedCard>
        
        {/* Kategori Dağılımı Kartı */}
        <AnimatedCard delay={200}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Icon name="shape" size={22} color={colors.purple} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Kategori Dağılımı
          </Text>
            </View>
          </View>
          
          <View style={styles.categoryListContainer}>
            {Object.entries(categories).map(([category, data]) => {
              const completionRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
              const config = categoryConfig[category] || { color: colors.grey, icon: 'star-outline' };
            
            return (
                <View key={category} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryTitleContainer}>
                      <View style={[styles.categoryIcon, { backgroundColor: config.color + '15' }]}>
                        <Icon name={config.icon} size={16} color={config.color} />
                      </View>
                      <Text style={[styles.categoryTitle, { color: theme.text }]}>
                        {category}
                  </Text>
                    </View>
                    <Text style={[styles.categoryCount, { color: theme.textSecondary }]}>
                      {data.total} vazife
                  </Text>
                </View>
                
                  <View style={[styles.categoryProgressBar, { backgroundColor: theme.border }]}>
                    <LinearGradient
                      colors={[config.color, config.color + '80']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.categoryProgressFill, { width: `${completionRate}%` }]}
                  />
                </View>
              </View>
            );
          })}
        </View>
        </AnimatedCard>
        
        {/* Sıklık Dağılımı Kartı */}
        <AnimatedCard delay={300}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Icon name="calendar-range" size={22} color={colors.teal} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
            Sıklık Dağılımı
          </Text>
            </View>
          </View>
          
          <View style={styles.frequencyContainer}>
          {['Günlük', 'Haftalık', 'Aylık'].map(frequency => {
              const tasks = filteredTasks.filter(t => t.frequency === frequency);
              const completedCount = tasks.filter(t => t.completed).length;
              const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
              
              let frequencyColor;
              switch(frequency) {
                case 'Günlük': frequencyColor = colors.primary; break;
                case 'Haftalık': frequencyColor = colors.purple; break;
                case 'Aylık': frequencyColor = colors.teal; break;
                default: frequencyColor = colors.grey;
              }
            
            return (
              <View key={frequency} style={styles.frequencyItem}>
                  <View style={styles.frequencyHeader}>
                    <Text style={[styles.frequencyTitle, { color: theme.text }]}>
                      {frequency} Vazifeler
                  </Text>
                    <Text style={[styles.frequencyCount, { color: theme.textSecondary }]}>
                      {tasks.length} vazife
                  </Text>
                </View>
                
                  <View style={[styles.frequencyProgressBar, { backgroundColor: theme.border }]}>
                    <LinearGradient
                      colors={[frequencyColor, frequencyColor + '80']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.frequencyProgressFill, { width: `${completionRate}%` }]}
                  />
                </View>
              </View>
            );
          })}
        </View>
        </AnimatedCard>
        
        {/* Motivasyon İpucu Kartı */}
        <AnimatedCard delay={400} style={styles.tipsCard}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tipsGradient}
          >
            <View style={styles.tipsHeader}>
              <Icon name="lightbulb-on" size={24} color="#FFFFFF" />
              <Text style={[styles.tipsTitle, { color: '#FFFFFF' }]}>İpucu</Text>
            </View>
            
            <Text style={[styles.tipsText, { color: '#FFFFFF' }]}>
              Düzenli olarak tamamladığınız vazifelerde daha uzun seriler oluşturmak motivasyonunuzu artırabilir.
          </Text>
          
            <TouchableOpacity style={styles.tipsButton}>
              <Text style={styles.tipsButtonText}>Daha Fazla İpucu</Text>
            </TouchableOpacity>
          </LinearGradient>
        </AnimatedCard>
      </ScrollView>
    );
  };
  
  // Detaylar sekmesi
  const DetailsTab = () => {
    const filteredTasks = getFilteredTasks();
    
    // Kategori bazında gruplandırma
    const categoryGroups = {};
            filteredTasks.forEach(task => {
      const category = task.category || 'Diğer';
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(task);
    });
    
    // Öncelik bazında gruplandırma
    const priorityGroups = {
      'Yüksek': filteredTasks.filter(t => t.priority === 'Yüksek'),
      'Orta': filteredTasks.filter(t => t.priority === 'Orta'),
      'Düşük': filteredTasks.filter(t => t.priority === 'Düşük')
    };
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Dönem Seçici */}
        <PeriodSelector />
        
        {/* Kategori Detayları */}
        <AnimatedCard>
          <GradientHeader
            title="Kategori Detayları"
            icon="shape-outline"
            colors={gradients.purple}
          />
          
          <View style={styles.detailsContainer}>
            {Object.keys(categoryGroups).length > 0 ? (
              Object.keys(categoryGroups).map(category => {
                const tasks = categoryGroups[category];
                const completedCount = tasks.filter(t => t.completed).length;
                const completionRate = Math.round((completedCount / tasks.length) * 100);
                const config = categoryConfig[category] || { color: colors.grey, icon: 'star-outline' };
              
              return (
                  <View key={category} style={styles.detailItem}>
                    <View style={styles.detailHeader}>
                      <View style={styles.detailTitleContainer}>
                        <View style={[styles.detailIcon, { backgroundColor: config.color + '15' }]}>
                          <Icon name={config.icon} size={18} color={config.color} />
                        </View>
                        <Text style={[styles.detailTitle, { color: theme.text }]}>
                      {category}
                    </Text>
                      </View>
                      <Text style={[styles.detailCount, { color: theme.textSecondary }]}>
                        {tasks.length} vazife
                    </Text>
                  </View>
                  
                    <View style={styles.detailStats}>
                      <View style={styles.detailStatItem}>
                        <Text style={[styles.detailStatValue, { color: theme.text }]}>
                          {completedCount}
                        </Text>
                        <Text style={[styles.detailStatLabel, { color: theme.textSecondary }]}>
                          Tamamlanan
                        </Text>
                      </View>
                      
                      <View style={styles.detailStatItem}>
                        <Text style={[styles.detailStatValue, { color: theme.text }]}>
                          {tasks.length - completedCount}
                        </Text>
                        <Text style={[styles.detailStatLabel, { color: theme.textSecondary }]}>
                          Bekleyen
                        </Text>
                      </View>
                      
                      <View style={styles.detailStatItem}>
                        <Text style={[styles.detailStatValue, { color: theme.text }]}>
                          %{completionRate}
                        </Text>
                        <Text style={[styles.detailStatLabel, { color: theme.textSecondary }]}>
                          Tamamlanma
                        </Text>
                      </View>
                    </View>
                    
                    <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                      <LinearGradient
                        colors={[config.color, config.color + '80']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${completionRate}%` }]}
                    />
                  </View>
                </View>
              );
              })
            ) : (
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                Bu dönemde henüz vazife bulunmuyor
              </Text>
            )}
        </View>
        </AnimatedCard>
        
        {/* Öncelik Dağılımı */}
        <AnimatedCard delay={100}>
          <GradientHeader
            title="Öncelik Dağılımı"
            icon="flag"
            colors={gradients.orange}
          />
          
          <View style={styles.priorityContainer}>
            {['Yüksek', 'Orta', 'Düşük'].map(priority => {
              const tasks = priorityGroups[priority] || [];
              const completedCount = tasks.filter(t => t.completed).length;
              const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
              
              let priorityColor;
              switch(priority) {
                case 'Yüksek': priorityColor = colors.error; break;
                case 'Orta': priorityColor = colors.orange; break;
                case 'Düşük': priorityColor = colors.success; break;
                default: priorityColor = colors.grey;
              }
            
            return (
                <View key={priority} style={styles.priorityItem}>
                  <View style={styles.priorityHeader}>
                    <View style={styles.priorityTitleContainer}>
                      <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                      <Text style={[styles.priorityTitle, { color: theme.text }]}>
                        {priority} Öncelik
                    </Text>
                    </View>
                    <Text style={[styles.priorityCount, { color: theme.textSecondary }]}>
                      {tasks.length} vazife
                    </Text>
                  </View>
                  
                  <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${completionRate}%`, backgroundColor: priorityColor }
                      ]} 
                    />
                </View>
                
                  <View style={styles.priorityStats}>
                    <Text style={[styles.priorityStatText, { color: colors.success }]}>
                      {completedCount} tamamlandı
                    </Text>
                    <Text style={[styles.priorityStatText, { color: colors.warning }]}>
                      {tasks.length - completedCount} bekliyor
                    </Text>
                  </View>
                  </View>
            );
            })}
        </View>
        </AnimatedCard>
        
        {/* Vazife Listesi */}
        <AnimatedCard delay={200}>
          <GradientHeader
            title="Vazife Listesi"
            icon="format-list-checks"
            colors={gradients.primary}
          />
          
          <View style={styles.taskListContainer}>
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => {
                const config = categoryConfig[task.category] || { color: colors.grey, icon: 'star-outline' };
    
    return (
                  <View key={task.id} style={styles.taskItem}>
                    <View style={[styles.taskStatusDot, { 
                      backgroundColor: task.completed ? colors.success : colors.warning 
                    }]} />
                    
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, { color: theme.text }]}>
                        {task.title}
                      </Text>
                      
                      <View style={styles.taskMeta}>
                        <View style={[styles.taskCategoryBadge, { backgroundColor: config.color + '20' }]}>
                          <Text style={[styles.taskCategoryText, { color: config.color }]}>
                            {task.category}
                          </Text>
                        </View>
                        
                        <Text style={[styles.taskFrequency, { color: theme.textSecondary }]}>
                          {task.frequency}
                  </Text>
                </View>
              </View>
              
                    {task.streak > 0 && (
                      <View style={[styles.taskStreakBadge, { backgroundColor: colors.orange }]}>
                        <Icon name="fire" size={12} color="#FFFFFF" />
                        <Text style={styles.taskStreakText}>{task.streak}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                Bu dönemde henüz vazife bulunmuyor
                  </Text>
            )}
                </View>
        </AnimatedCard>
      </ScrollView>
    );
  };
  
  // Trendler sekmesi
  const TrendsTab = () => {
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Dönem Seçici */}
        <PeriodSelector />
        
        {/* Basit Çizgi Grafiği */}
        <AnimatedCard>
          <GradientHeader
            title="Haftalık İlerleme"
            icon="chart-line"
            colors={gradients.primary}
          />
          
          <View style={styles.chartContainer}>
            <View style={styles.chartPlaceholder}>
              <Icon name="chart-line" size={48} color={colors.primary} />
              <Text style={styles.chartPlaceholderText}>
                Haftalık ilerleme grafiği burada görüntülenecek
                  </Text>
                </View>
          </View>
        </AnimatedCard>
        
        {/* Basit Çubuk Grafiği */}
        <AnimatedCard delay={100}>
          <GradientHeader
            title="Kategori Bazında Performans"
            icon="chart-bar"
            colors={gradients.teal}
          />
          
          <View style={styles.chartContainer}>
            <View style={styles.chartPlaceholder}>
              <Icon name="chart-bar" size={48} color={colors.teal} />
              <Text style={styles.chartPlaceholderText}>
                Kategori bazında performans grafiği burada görüntülenecek
                  </Text>
                </View>
          </View>
        </AnimatedCard>
        
        {/* Basit Aktivite Isı Haritası */}
        <AnimatedCard delay={200}>
          <GradientHeader
            title="Aktivite Isı Haritası"
            icon="calendar-month"
            colors={gradients.blue}
          />
          
          <View style={styles.heatmapContainer}>
            <View style={styles.chartPlaceholder}>
              <Icon name="calendar-month" size={48} color={colors.blue} />
              <Text style={styles.chartPlaceholderText}>
                Aktivite ısı haritası burada görüntülenecek
                  </Text>
                </View>
          </View>
        </AnimatedCard>
        
        {/* İpuçları ve Öneriler */}
        <AnimatedCard delay={300} style={styles.tipsCard}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tipsGradient}
          >
            <View style={styles.tipsHeader}>
              <Icon name="lightbulb-on" size={24} color="#FFFFFF" />
              <Text style={[styles.tipsTitle, { color: '#FFFFFF' }]}>İpucu</Text>
            </View>
            
            <Text style={[styles.tipsText, { color: '#FFFFFF' }]}>
              Düzenli olarak tamamladığınız vazifelerde daha uzun seriler oluşturmak motivasyonunuzu artırabilir.
                  </Text>
            
            <TouchableOpacity style={styles.tipsButton}>
              <Text style={styles.tipsButtonText}>Daha Fazla İpucu</Text>
            </TouchableOpacity>
          </LinearGradient>
        </AnimatedCard>
      </ScrollView>
    );
  };
  
  // Tab bar bileşeni
  const renderTabBar = () => {
    return (
      <View style={styles.tabBarContainer}>
        <View style={[styles.tabBar, { backgroundColor: theme.card }]}>
          {['Özet', 'Detaylar', 'Trendler'].map((tab) => (
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
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Analiz"
        subtitle="Vazife performansınızı detaylı olarak inceleyin"
        iconName="chart-line"
        colors={gradients.primary}
      />
      
      {renderTabBar()}
      
      {/* İçerik */}
      <View style={styles.contentContainer}>
        {activeTab === 'Özet' && <SummaryTab />}
        {activeTab === 'Detaylar' && <DetailsTab />}
        {activeTab === 'Trendler' && <TrendsTab />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 24,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  gradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  gradientHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  completionBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  achievementContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  achievementValue: {
    fontSize: 14,
  },
  categoryListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryCount: {
    fontSize: 14,
  },
  categoryProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  frequencyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  frequencyItem: {
    marginBottom: 16,
  },
  frequencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  frequencyTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  frequencyCount: {
    fontSize: 14,
  },
  frequencyProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  frequencyProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tipsCard: {
    marginBottom: 20,
  },
  tipsGradient: {
    borderRadius: 16,
    padding: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  tipsText: {
    fontSize: 14,
    marginBottom: 16,
    color: '#FFFFFF',
  },
  tipsButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tipsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailItem: {
    marginBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailCount: {
    fontSize: 14,
  },
  detailStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailStatLabel: {
    fontSize: 12,
  },
  priorityContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  priorityItem: {
    marginBottom: 16,
  },
  priorityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  priorityTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  priorityCount: {
    fontSize: 14,
  },
  priorityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priorityStatText: {
    fontSize: 12,
  },
  taskListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  taskStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  taskCategoryText: {
    fontSize: 12,
  },
  taskFrequency: {
    fontSize: 12,
  },
  taskStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  taskStreakText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  chartContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  chartPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 20,
    marginBottom: 20,
  },
  tabIndicator: {
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  contentContainer: {
    flex: 1,
  },
  heatmapContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
});

export default AnalysisScreen; 