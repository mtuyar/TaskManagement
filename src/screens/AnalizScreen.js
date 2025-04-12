import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTaskContext } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';

const AnalysisScreen = () => {
  const { tasks } = useTaskContext();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('Özet');
  const [selectedFrequency, setSelectedFrequency] = useState('Tümü');
  
  // Ekran genişliğini al
  const screenWidth = Dimensions.get('window').width - 40;
  
  // Sıklık bazında görevleri filtrele
  const getFilteredTasks = () => {
    if (selectedFrequency === 'Tümü') {
      return tasks;
    }
    return tasks.filter(task => task.frequency === selectedFrequency);
  };
  
  // Tamamlanma oranı hesapla
  const calculateCompletionRate = (taskList) => {
    if (taskList.length === 0) return 0;
    const completedCount = taskList.filter(task => task.completed).length;
    return Math.round((completedCount / taskList.length) * 100);
  };
  
  // Sıklık dağılımı hesapla
  const calculateFrequencyDistribution = () => {
    const frequencies = {
      'Günlük': 0,
      'Haftalık': 0,
      'Aylık': 0
    };
    
    tasks.forEach(task => {
      if (frequencies[task.frequency] !== undefined) {
        frequencies[task.frequency]++;
      }
    });
    
    return [
      {
        name: 'Günlük',
        count: frequencies['Günlük'],
        color: '#673AB7',
        legendFontColor: theme.text,
        legendFontSize: 13
      },
      {
        name: 'Haftalık',
        count: frequencies['Haftalık'],
        color: '#9C27B0',
        legendFontColor: theme.text,
        legendFontSize: 13
      },
      {
        name: 'Aylık',
        count: frequencies['Aylık'],
        color: '#7E57C2',
        legendFontColor: theme.text,
        legendFontSize: 13
      }
    ];
  };
  
  // Haftalık ilerleme verileri (örnek veri)
  const getWeeklyProgressData = () => {
    // Gerçek uygulamada bu veriler veritabanından çekilebilir
    return {
      labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
      datasets: [
        {
          data: [
            Math.round(Math.random() * 100),
            Math.round(Math.random() * 100),
            Math.round(Math.random() * 100),
            Math.round(Math.random() * 100),
            Math.round(Math.random() * 100),
            Math.round(Math.random() * 100),
            Math.round(Math.random() * 100)
          ],
          color: (opacity = 1) => `rgba(103, 58, 183, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
  };
  
  // Kategori dağılımı hesapla
  const calculateCategoryDistribution = (taskList) => {
    const categories = {};
    
    taskList.forEach(task => {
      if (!categories[task.category]) {
        categories[task.category] = 0;
      }
      categories[task.category]++;
    });
    
    // Renk paleti
    const colors = [
      '#673AB7', '#9C27B0', '#7E57C2', '#5E35B1', 
      '#8E24AA', '#6A1B9A', '#4527A0', '#512DA8'
    ];
    
    return Object.keys(categories).map((category, index) => ({
      name: category,
      count: categories[category],
      color: colors[index % colors.length],
      legendFontColor: theme.text,
      legendFontSize: 13
    }));
  };
  
  // Tamamlanma durumuna göre dağılım
  const calculateCompletionDistribution = (taskList) => {
    const completed = taskList.filter(task => task.completed).length;
    const pending = taskList.length - completed;
    
    return [
      {
        name: 'Tamamlandı',
        count: completed,
        color: '#4CAF50',
        legendFontColor: theme.text,
        legendFontSize: 13
      },
      {
        name: 'Bekliyor',
        count: pending,
        color: '#FFA000',
        legendFontColor: theme.text,
        legendFontSize: 13
      }
    ];
  };
  
  // Özet kartı bileşeni
  const SummaryCard = ({ title, value, icon, color, subtitle }) => (
    <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
      <View style={styles.summaryCardHeader}>
        <Text style={[styles.summaryCardTitle, { color: theme.text }]}>{title}</Text>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.summaryCardValue, { color }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.summaryCardSubtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
  
  // Grafik kartı bileşeni
  const ChartCard = ({ title, children }) => (
    <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
      <Text style={[styles.chartCardTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
  
  // Sıklık seçim butonları
  const FrequencySelector = () => (
    <View style={styles.frequencySelector}>
      {['Tümü', 'Günlük', 'Haftalık', 'Aylık'].map(frequency => (
        <TouchableOpacity
          key={frequency}
          style={[
            styles.frequencyButton,
            selectedFrequency === frequency && { 
              backgroundColor: '#673AB7',
              borderColor: '#673AB7'
            },
            { borderColor: theme.border }
          ]}
          onPress={() => setSelectedFrequency(frequency)}
        >
          <Text
            style={[
              styles.frequencyButtonText,
              { color: selectedFrequency === frequency ? '#fff' : theme.text }
            ]}
          >
            {frequency}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  
  // Tab butonları
  const TabButtons = () => (
    <View style={styles.tabButtons}>
      {['Özet', 'Grafikler', 'Detaylar'].map(tab => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            activeTab === tab && { 
              borderBottomColor: '#673AB7',
              borderBottomWidth: 3
            }
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === tab ? '#673AB7' : theme.textSecondary }
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  
  // Özet tab içeriği
  const SummaryTab = () => {
    const filteredTasks = getFilteredTasks();
    const completionRate = calculateCompletionRate(filteredTasks);
    
    return (
      <View style={styles.tabContent}>
        <FrequencySelector />
        
        <View style={styles.summaryCardsContainer}>
          <SummaryCard
            title="Toplam Vazife"
            value={filteredTasks.length}
            icon="format-list-bulleted"
            color="#673AB7"
          />
          
          <SummaryCard
            title="Tamamlanma Oranı"
            value={`%${completionRate}`}
            icon="check-circle"
            color="#4CAF50"
            subtitle={`${filteredTasks.filter(t => t.completed).length} / ${filteredTasks.length}`}
          />
        </View>
        
        <View style={styles.summaryCardsContainer}>
          <SummaryCard
            title="Bildirim Ayarlı"
            value={filteredTasks.filter(t => t.notification?.enabled).length}
            icon="bell"
            color="#FFA000"
          />
          
          <SummaryCard
            title="Aktif Vazifeler"
            value={filteredTasks.filter(t => !t.completed).length}
            icon="clock-outline"
            color="#2196F3"
          />
        </View>
        
        <View style={[styles.progressContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.progressTitle, { color: theme.text }]}>
            Tamamlanma Durumu
          </Text>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${completionRate}%`, backgroundColor: '#4CAF50' }
              ]} 
            />
          </View>
          
          <View style={styles.progressLabels}>
            <View style={styles.progressLabel}>
              <View style={[styles.progressLabelDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.progressLabelText, { color: theme.text }]}>
                Tamamlandı ({filteredTasks.filter(t => t.completed).length})
              </Text>
            </View>
            
            <View style={styles.progressLabel}>
              <View style={[styles.progressLabelDot, { backgroundColor: '#FFA000' }]} />
              <Text style={[styles.progressLabelText, { color: theme.text }]}>
                Bekliyor ({filteredTasks.filter(t => !t.completed).length})
              </Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.progressContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.progressTitle, { color: theme.text }]}>
            Sıklık Dağılımı
          </Text>
          
          {['Günlük', 'Haftalık', 'Aylık'].map(frequency => {
            const count = tasks.filter(t => t.frequency === frequency).length;
            const percentage = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
            
            return (
              <View key={frequency} style={styles.frequencyItem}>
                <View style={styles.frequencyItemHeader}>
                  <Text style={[styles.frequencyItemTitle, { color: theme.text }]}>
                    {frequency}
                  </Text>
                  <Text style={[styles.frequencyItemCount, { color: theme.text }]}>
                    {count} vazife
                  </Text>
                </View>
                
                <View style={styles.frequencyItemBar}>
                  <View 
                    style={[
                      styles.frequencyItemFill, 
                      { 
                        width: `${percentage}%`, 
                        backgroundColor: frequency === 'Günlük' ? '#673AB7' : 
                                         frequency === 'Haftalık' ? '#9C27B0' : '#7E57C2' 
                      }
                    ]} 
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };
  
  // Grafikler tab içeriği
  const ChartsTab = () => {
    const filteredTasks = getFilteredTasks();
    
    return (
      <View style={styles.tabContent}>
        <FrequencySelector />
        
        {tasks.length > 0 && (
          <ChartCard title="Sıklık Dağılımı">
            <PieChart
              data={calculateFrequencyDistribution()}
              width={screenWidth}
              height={180}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </ChartCard>
        )}
        
        {filteredTasks.length > 0 && (
          <ChartCard title="Kategori Dağılımı">
            <PieChart
              data={calculateCategoryDistribution(filteredTasks)}
              width={screenWidth}
              height={180}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </ChartCard>
        )}
        
        <ChartCard title="Haftalık İlerleme">
          <LineChart
            data={getWeeklyProgressData()}
            width={screenWidth}
            height={220}
            chartConfig={{
              backgroundColor: theme.card,
              backgroundGradientFrom: theme.card,
              backgroundGradientTo: theme.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(103, 58, 183, ${opacity})`,
              labelColor: (opacity = 1) => theme.text,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#673AB7"
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        </ChartCard>
      </View>
    );
  };
  
  // Detaylar tab içeriği
  const DetailsTab = () => {
    const filteredTasks = getFilteredTasks();
    
    // Sıklık bazında gruplandırma
    const groupByFrequency = () => {
      const groups = {
        'Günlük': [],
        'Haftalık': [],
        'Aylık': []
      };
      
      filteredTasks.forEach(task => {
        if (groups[task.frequency]) {
          groups[task.frequency].push(task);
        }
      });
      
      return groups;
    };
    
    const frequencyGroups = groupByFrequency();
    
    return (
      <View style={styles.tabContent}>
        <FrequencySelector />
        
        {Object.keys(frequencyGroups).map(frequency => {
          const tasks = frequencyGroups[frequency];
          if (selectedFrequency !== 'Tümü' && frequency !== selectedFrequency) return null;
          if (tasks.length === 0) return null;
          
          const completedCount = tasks.filter(t => t.completed).length;
          const completionRate = Math.round((completedCount / tasks.length) * 100);
          
          return (
            <View key={frequency} style={styles.detailSection}>
              <View style={styles.detailSectionHeader}>
                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>
                  {frequency} Vazifeler
                </Text>
                <View style={styles.detailSectionBadge}>
                  <Text style={styles.detailSectionBadgeText}>
                    {tasks.length} vazife
                  </Text>
                </View>
              </View>
              
              <View style={[styles.detailCard, { backgroundColor: theme.card }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Toplam Vazife
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {tasks.length}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Tamamlanan
                  </Text>
                  <Text style={[styles.detailValue, { color: '#4CAF50' }]}>
                    {completedCount}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Bekleyen
                  </Text>
                  <Text style={[styles.detailValue, { color: '#FFA000' }]}>
                    {tasks.length - completedCount}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Tamamlanma Oranı
                  </Text>
                  <Text style={[styles.detailValue, { color: '#673AB7' }]}>
                    %{completionRate}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Bildirim Ayarlı
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {tasks.filter(t => t.notification?.enabled).length}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TabButtons />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {activeTab === 'Özet' && <SummaryTab />}
        {activeTab === 'Grafikler' && <ChartsTab />}
        {activeTab === 'Detaylar' && <DetailsTab />}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabButtons: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 10,
    backgroundColor: theme.card,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  frequencySelector: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  frequencyButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryCardSubtitle: {
    fontSize: 12,
  },
  chartCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  progressContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLabelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  progressLabelText: {
    fontSize: 12,
  },
  frequencyItem: {
    marginBottom: 12,
  },
  frequencyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  frequencyItemTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  frequencyItemCount: {
    fontSize: 14,
  },
  frequencyItemBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  frequencyItemFill: {
    height: '100%',
    borderRadius: 4,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  detailSectionBadge: {
    backgroundColor: '#673AB7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 12,
  },
  detailSectionBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  detailCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AnalysisScreen; 