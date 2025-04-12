import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const EmptyTaskList = ({ onAddTask, theme }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="clipboard-text-outline" size={80} color="#4A6FFF" />
      </View>
      
      <Text style={[styles.title, { color: theme?.text || '#333' }]}>
        Henüz vazife eklemediniz
      </Text>
      
      <Text style={[styles.description, { color: theme?.textSecondary || '#666' }]}>
        Kişisel vazifelerinizi ekleyerek alışkanlıklarınızı takip etmeye başlayın.
      </Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={onAddTask}
      >
        <LinearGradient
          colors={['#4A6FFF', '#6C63FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Icon name="plus" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Vazife Ekle</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(74, 111, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  button: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EmptyTaskList; 