import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableWithoutFeedback, 
  Keyboard, 
  SafeAreaView, 
  StatusBar,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTaskContext } from '../context/TaskContext';
import { getAISuggestions } from '../services/aiService';
import { useTheme } from '../context/ThemeContext';

// Bileşenler
import AIInputBox from '../components/AIScreen/AIInputBox';
import AISuggestionItem from '../components/AIScreen/AISuggestionItem';
import AIDetailModal from '../components/AIScreen/AIDetailModal';

const YapayZekaScreen = () => {
  const [userInput, setUserInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState('Günlük');
  const { addAISuggestionToTasks } = useTaskContext();
  const { theme, isDarkMode } = useTheme();

  // Renk paleti tanımlayalım
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
    indigo: '#3F51B5',
    cyan: '#00BCD4',
    lime: '#CDDC39',
    brown: '#795548',
    blueGrey: '#607D8B',
  };

  // Renk paleti dizisi
  const colorPalette = [
    colors.primary,    // Mavi
    colors.success,    // Yeşil
    colors.error,      // Kırmızı
    colors.warning,    // Sarı
    colors.purple,     // Mor
    colors.teal,       // Turkuaz
    colors.orange,     // Turuncu
    colors.pink,       // Pembe
    colors.indigo,     // Lacivert
    colors.cyan,       // Açık Mavi
    colors.lime,       // Açık Yeşil
    colors.brown,      // Kahverengi
    colors.blueGrey,   // Mavi Gri
    colors.secondary,  // İkincil Mavi
    colors.accent,     // Vurgu Mavi
    colors.info        // Bilgi Mavisi
  ];

  // Kategori bazlı renk seçimi fonksiyonu - dengeli dağılım
  const getCategoryColor = (category, index = 0) => {
    // Kategori bazlı sabit renkler
    const categoryColors = {
      'sağlık': colors.success,
      'fitness': colors.primary,
      'beslenme': colors.error,
      'zihinsel': colors.purple,
      'kişisel': colors.secondary,
      'sosyal': colors.warning,
      'üretkenlik': colors.info,
      'finans': colors.teal
    };
    
    const lowerCategory = category?.toLowerCase() || '';
    
    // Önce kategori bazlı renk kontrolü
    for (const [key, color] of Object.entries(categoryColors)) {
      if (lowerCategory.includes(key)) {
        return color;
      }
    }
    
    // Kategori eşleşmezse, index'e göre renk ata
    // Bu sayede her öneri farklı bir renk alır
    return colorPalette[index % colorPalette.length];
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;
    
    setIsLoading(true);
    setSuggestions([]);
    Keyboard.dismiss();
    
    try {
      // Yapay zeka servisinden öneriler al
      const aiSuggestions = await getAISuggestions(userInput);
      setSuggestions(aiSuggestions);
    } catch (error) {
      console.error('Öneriler alınırken hata oluştu:', error);
      // Hata durumunda kullanıcıya bilgi ver
      alert('Öneriler alınırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const addToPersonalTasks = (suggestion) => {
    // Renk bilgisini ekleyelim
    const categoryColor = getCategoryColor(suggestion.category, suggestions.findIndex(s => s.id === suggestion.id));
    
    // Frekans ve renk ekleyerek görevi ekle
    const taskWithFrequency = {
      ...suggestion,
      frequency: selectedFrequency,
      color: categoryColor, // Renk bilgisini ekledik
      icon: suggestion.icon // İkon bilgisini ekledik
    };
    
    addAISuggestionToTasks(taskWithFrequency);
    // Kullanıcıya geri bildirim
    alert(`"${suggestion.title}" kişisel vazifelerinize eklendi.`);
    setModalVisible(false);
  };
  
  const showSuggestionDetails = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setSelectedFrequency('Günlük'); // Varsayılan frekansı ayarla
    setModalVisible(true);
  };

  // Klavyeyi kapatma fonksiyonu
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Header bileşeni
  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primary, colors.secondary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Yapay Zeka Asistanı</Text>
            <Text style={styles.headerSubtitle}>
              Hedeflerinize uygun alışkanlık önerileri alın
            </Text>
            <View style={styles.headerIconContainer}>
              <Icon name="robot" size={60} color="rgba(255, 255, 255, 0.2)" />
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={colors.primary} 
        translucent={true}
      />
      
      {renderHeader()}
      
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.content}>
          <AIInputBox 
            userInput={userInput}
            setUserInput={setUserInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            theme={theme}
          />
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A6FFF" />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Öneriler hazırlanıyor...
              </Text>
            </View>
          )}
          
          {suggestions.length > 0 && !isLoading && (
            <View style={styles.suggestionsContainer}>
              <Text style={[styles.suggestionsTitle, { color: theme.text }]}>
                Önerilen Alışkanlıklar
              </Text>
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsListContent}
                renderItem={({ item, index }) => (
                  <AISuggestionItem 
                    suggestion={item}
                    showSuggestionDetails={showSuggestionDetails}
                    theme={theme}
                    getCategoryColor={(category) => getCategoryColor(category, index)}
                  />
                )}
              />
            </View>
          )}
          
          <AIDetailModal 
            modalVisible={modalVisible}
            setModalVisible={setModalVisible}
            selectedSuggestion={selectedSuggestion}
            selectedFrequency={selectedFrequency}
            setSelectedFrequency={setSelectedFrequency}
            addToPersonalTasks={addToPersonalTasks}
            theme={theme}
            getCategoryColor={getCategoryColor}
          />
        </View>
      </TouchableWithoutFeedback>
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
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 30,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    position: 'relative',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    maxWidth: '80%',
    lineHeight: 22,
  },
  headerIconContainer: {
    position: 'absolute',
    right: 0,
    top: -10,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  suggestionsListContent: {
    paddingBottom: 20,
  },
});

export default YapayZekaScreen; 