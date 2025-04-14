import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CustomTimePicker = ({ 
  value, 
  onChange, 
  onClose, 
  color = '#4A6FFF',
  textColor = '#000000'
}) => {
  const [selectedHour, setSelectedHour] = useState(value.getHours());
  const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());
  
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  
  const handleConfirm = () => {
    const newDate = new Date(value);
    newDate.setHours(selectedHour);
    newDate.setMinutes(selectedMinute);
    onChange({ type: 'set', nativeEvent: { timestamp: newDate.getTime() } });
    onClose();
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bildirim Saati</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <Icon name="close" size={14} color="#999" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.pickerContainer}>
          <ScrollView style={styles.pickerColumn}>
            {hours.map(hour => (
              <TouchableOpacity
                key={`hour-${hour}`}
                style={[
                  styles.pickerItem,
                  selectedHour === hour && { backgroundColor: `${color}20` }
                ]}
                onPress={() => setSelectedHour(hour)}
              >
                <Text style={[
                  styles.pickerItemText,
                  selectedHour === hour && { color, fontWeight: 'bold' }
                ]}>
                  {hour.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={styles.pickerSeparator}>:</Text>
          
          <ScrollView style={styles.pickerColumn}>
            {minutes.map(minute => (
              <TouchableOpacity
                key={`minute-${minute}`}
                style={[
                  styles.pickerItem,
                  selectedMinute === minute && { backgroundColor: `${color}20` }
                ]}
                onPress={() => setSelectedMinute(minute)}
              >
                <Text style={[
                  styles.pickerItemText,
                  selectedMinute === minute && { color, fontWeight: 'bold' }
                ]}>
                  {minute.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: color }]}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Tamam</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '80%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 0,
    position: 'relative',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 150,
  },
  pickerColumn: {
    height: 150,
    width: 60,
  },
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 18,
  },
  pickerSeparator: {
    fontSize: 24,
    marginHorizontal: 10,
  },
  confirmButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '500',
  }
});

export default CustomTimePicker; 