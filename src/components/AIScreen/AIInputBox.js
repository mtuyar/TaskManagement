import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Text, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AIInputBox = ({ 
  userInput, 
  setUserInput, 
  handleSubmit, 
  isLoading, 
  theme 
}) => {
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  
  const clearInput = () => {
    setUserInput('');
  };

  return (
    <>
      <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.inputHeader}>
          <Text style={[styles.inputTitle, { color: theme.text }]}>Vazife Ekle</Text>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => setInfoModalVisible(true)}
          >
            <Icon name="information-outline" size={20} color="#4A6FFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputWrapper}>
          <Icon name="comment-question-outline" size={22} color="#4A6FFF" style={styles.inputIcon} />
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
        </View>
        
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            { backgroundColor: userInput.trim() ? '#4A6FFF' : 'rgba(74, 111, 255, 0.5)' }
          ]} 
          onPress={handleSubmit}
          disabled={isLoading || !userInput.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="send" size={22} color="white" />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Bilgi Modalı */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setInfoModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Icon name="lightbulb-outline" size={28} color="#4A6FFF" />
              <Text style={[styles.modalTitle, { color: theme.text }]}>Nasıl Kullanılır?</Text>
            </View>
            
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              Yapay zeka asistanımız, hedeflerinize ve ihtiyaçlarınıza uygun alışkanlık önerileri sunar.
            </Text>
            
            <View style={styles.tipContainer}>
              <Icon name="check-circle-outline" size={18} color="#4CAF50" style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: theme.text }]}>
                "Sabahları daha enerjik olmak istiyorum" gibi bir hedef yazın
              </Text>
            </View>
            
            <View style={styles.tipContainer}>
              <Icon name="check-circle-outline" size={18} color="#4CAF50" style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: theme.text }]}>
                "Daha iyi uyumak için öneriler verir misin?" şeklinde sorular sorun
              </Text>
            </View>
            
            <View style={styles.tipContainer}>
              <Icon name="check-circle-outline" size={18} color="#4CAF50" style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: theme.text }]}>
                "Haftalık fitness planı oluştur" gibi spesifik isteklerde bulunun
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: '#4A6FFF' }]}
              onPress={() => setInfoModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Anladım</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginHorizontal: 20,
    marginTop: -25,
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoButton: {
    padding: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  inputIcon: {
    marginTop: 10,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    minHeight: 70,
    maxHeight: 120,
    textAlignVertical: 'top',
    paddingRight: 30,
    lineHeight: 22,
  },
  clearButton: {
    position: 'absolute',
    right: 0,
    top: 10,
    padding: 4,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignSelf: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 15,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AIInputBox; 