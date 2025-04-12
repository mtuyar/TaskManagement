import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, FlatList, Dimensions, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTaskContext } from '../context/TaskContext';
import { getAISuggestions } from '../services/aiService';
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');

const YapayZekaScreen = () => {
  const [userInput, setUserInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState('Günlük');
  const { addAISuggestionToTasks } = useTaskContext();
  const { theme, isDarkMode } = useTheme();

  const frequencyOptions = ['Günlük', 'Haftalık', 'Aylık', 'Bir Kez'];

  const handleSubmit = async () => {
    if (!userInput.trim()) return;
    
    setIsLoading(true);
    setSuggestions([]);
    
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
    // Frekans ekleyerek görevi ekle
    const taskWithFrequency = {
      ...suggestion,
      frequency: selectedFrequency
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
  
  // Metin girişini temizleme fonksiyonu
  const clearInput = () => {
    setUserInput('');
  };

  // Mor tonlarına dönüş
  const colors = {
    primary: '#673AB7',     // Ana mor renk
    primaryLight: '#BB86FC', // Açık mor
    primaryDark: '#3700B3',  // Koyu mor
    secondary: '#03DAC6',   // Turkuaz
    accent: '#FF9800',      // Turuncu
    success: '#4CAF50',     // Yeşil
    info: '#2196F3',        // Mavi
  };

  // Kategori bazlı renk seçimi fonksiyonu - mor tonlarına ağırlık verildi
  const getCategoryColor = (category) => {
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('sağlık')) return '#9C27B0'; // Mor tonu
    if (lowerCategory.includes('fitness')) return '#7E57C2'; // Mor tonu
    if (lowerCategory.includes('beslenme')) return '#5E35B1'; // Mor tonu
    if (lowerCategory.includes('zihinsel')) return '#673AB7'; // Mor tonu
    if (lowerCategory.includes('kişisel')) return '#8E24AA'; // Mor tonu
    if (lowerCategory.includes('sosyal')) return '#6A1B9A'; // Mor tonu
    if (lowerCategory.includes('üretkenlik')) return '#4527A0'; // Mor tonu
    if (lowerCategory.includes('finans')) return '#512DA8'; // Mor tonu
    
    return colors.primary; // Varsayılan mor
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>Yapay Zeka Asistanı</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Dertlerinizi, sıkıntılarınızı veya hedeflerinizi yazın, size özel alışkanlık önerileri sunalım.
          </Text>
          
          <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Nasıl yardımcı olabilirim?"
              placeholderTextColor={theme.textSecondary}
              value={userInput}
              onChangeText={setUserInput}
              multiline
              returnKeyType="done"
              blurOnSubmit={true}
            />
            
            {userInput.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearInput}
              >
                <Icon name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.sendButton, { 
                backgroundColor: userInput.trim() ? colors.primary : colors.primary + '80'
              }]} 
              onPress={handleSubmit}
              disabled={isLoading || !userInput.trim()}
            >
              <Icon name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Öneriler hazırlanıyor...</Text>
            </View>
          )}
          
          {suggestions.length > 0 && !isLoading && (
            <View style={styles.suggestionsContainer}>
              <Text style={[styles.suggestionsTitle, { color: theme.text }]}>Önerilen Alışkanlıklar</Text>
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.suggestionsListContent}
                style={styles.suggestionsList}
                nestedScrollEnabled={true}
                scrollEnabled={true}
                renderItem={({ item: suggestion }) => {
                  // Kategori bazlı renk seçimi
                  const categoryColor = getCategoryColor(suggestion.category);
                  
                  return (
                    <TouchableOpacity 
                      activeOpacity={0.9}
                      onPress={() => showSuggestionDetails(suggestion)}
                    >
                      <View style={[styles.suggestionItem, { 
                        backgroundColor: theme.card,
                        shadowColor: theme.shadow,
                        borderLeftWidth: 4,
                        borderLeftColor: categoryColor
                      }]}>
                        <Icon name={suggestion.icon} size={32} color={categoryColor} />
                        <View style={styles.suggestionContent}>
                          <Text style={[styles.suggestionTitle, { color: theme.text }]}>{suggestion.title}</Text>
                          <View style={styles.categoryContainer}>
                            <Text style={[styles.suggestionCategory, { 
                              color: '#fff',
                              backgroundColor: categoryColor + 'E6'
                            }]}>
                              {suggestion.category}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity 
                            style={[styles.infoButton, { borderColor: theme.border }]}
                            onPress={(e) => {
                              e.stopPropagation();
                              showSuggestionDetails(suggestion);
                            }}
                          >
                            <Icon name="information-outline" size={22} color="#673AB7" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.addButton, { backgroundColor: "#673AB7" }]}
                            onPress={(e) => {
                              e.stopPropagation();
                              showSuggestionDetails(suggestion);
                            }}
                          >
                            <Icon name="plus" size={22} color="white" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}
          
          {/* Detay ve Ekleme Modalı */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                {selectedSuggestion && (
                  <>
                    {(() => {
                      const categoryColor = getCategoryColor(selectedSuggestion.category);
                      return (
                        <>
                          <View style={styles.modalHeader}>
                            <Icon 
                              name={selectedSuggestion.icon} 
                              size={32} 
                              color={categoryColor} 
                            />
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                              {selectedSuggestion.title}
                            </Text>
                          </View>
                          
                          <View style={[styles.modalCategoryBadge, { backgroundColor: categoryColor }]}>
                            <Text style={[styles.modalCategoryText, { color: '#fff' }]}>
                              {selectedSuggestion.category}
                            </Text>
                          </View>
                          
                          <ScrollView style={styles.modalDescriptionContainer}>
                            <Text style={[styles.modalDescription, { color: theme.text }]}>
                              {selectedSuggestion.description}
                            </Text>
                          </ScrollView>
                          
                          <View style={styles.frequencySection}>
                            <Text style={[styles.frequencyTitle, { color: theme.text }]}>
                              Sıklık Seçin
                            </Text>
                            <View style={styles.frequencyOptions}>
                              {frequencyOptions.map(option => (
                                <TouchableOpacity
                                  key={option}
                                  style={[
                                    styles.frequencyOption,
                                    { 
                                      borderColor: selectedFrequency === option ? categoryColor : theme.border,
                                      backgroundColor: selectedFrequency === option ? categoryColor + '20' : 'transparent'
                                    }
                                  ]}
                                  onPress={() => setSelectedFrequency(option)}
                                >
                                  <Text style={[
                                    styles.frequencyText,
                                    { color: selectedFrequency === option ? categoryColor : theme.textSecondary }
                                  ]}>
                                    {option}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                          
                          <View style={styles.modalButtons}>
                            <TouchableOpacity 
                              style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.border }]}
                              onPress={() => setModalVisible(false)}
                            >
                              <Text style={[styles.modalButtonText, { color: theme.text }]}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.modalButton, styles.modalAddButton, { backgroundColor: categoryColor }]}
                              onPress={() => addToPersonalTasks(selectedSuggestion)}
                            >
                              <Text style={styles.modalAddButtonText}>Ekle</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      );
                    })()}
                  </>
                )}
              </View>
            </View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  input: {
    flex: 1,
    padding: 4,
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
    paddingRight: 30, // Temizleme butonu için yer açıyoruz
  },
  clearButton: {
    position: 'absolute',
    right: 64,
    top: 14,
    padding: 4,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignSelf: 'flex-end',
    marginBottom: 8,
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
  },
  suggestionsList: {
    flex: 1,
    height: height * 0.6,
    maxHeight: 500,
  },
  suggestionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  suggestionsListContent: {
    paddingBottom: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 16,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  suggestionCategory: {
    fontSize: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    flex: 1,
  },
  modalCategoryBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  modalCategoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalDescriptionContainer: {
    maxHeight: 150,
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  // Frekans Seçimi Stilleri
  frequencySection: {
    marginBottom: 20,
  },
  frequencyTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  frequencyOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 12,
  },
  modalCancelButton: {
    borderWidth: 1,
  },
  modalAddButton: {
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
  },
  modalAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default YapayZekaScreen; 