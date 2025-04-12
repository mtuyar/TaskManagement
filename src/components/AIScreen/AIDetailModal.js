import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AIDetailModal = ({ 
  modalVisible, 
  setModalVisible, 
  selectedSuggestion, 
  selectedFrequency, 
  setSelectedFrequency, 
  addToPersonalTasks, 
  theme, 
  getCategoryColor 
}) => {
  if (!selectedSuggestion) return null;
  
  const categoryColor = getCategoryColor(selectedSuggestion.category);
  const frequencyOptions = ['Günlük', 'Haftalık', 'Aylık', 'Bir Kez'];
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={[styles.modalHeader, { backgroundColor: categoryColor }]}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Icon name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.modalHeaderContent}>
              <Icon 
                name={selectedSuggestion.icon} 
                size={40} 
                color="#FFF" 
                style={styles.modalHeaderIcon}
              />
              <Text style={styles.modalTitle}>
                {selectedSuggestion.title}
              </Text>
              <View style={styles.modalCategoryBadge}>
                <Text style={styles.modalCategoryText}>
                  {selectedSuggestion.category}
                </Text>
              </View>
            </View>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Açıklama
            </Text>
            <Text style={[styles.modalDescription, { color: theme.text }]}>
              {selectedSuggestion.description}
            </Text>
            
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
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
          </ScrollView>
          
          <View style={styles.modalFooter}>
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
              <Icon name="plus" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.modalAddButtonText}>Vazifelerime Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    padding: 20,
    paddingTop: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderContent: {
    alignItems: 'center',
  },
  modalHeaderIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalCategoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalCategoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  frequencyOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
    minWidth: 100,
  },
  modalAddButton: {
    minWidth: 200,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AIDetailModal; 