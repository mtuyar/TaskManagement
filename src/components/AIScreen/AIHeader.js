import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AIHeader = ({ theme }) => {
  return (
    <LinearGradient
      colors={['#4A6FFF', '#6C63FF', '#8A84FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { 
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
      }]}
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
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 30,
    paddingHorizontal: 20,
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
});

export default AIHeader; 