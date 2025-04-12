import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

const AISuggestionItem = ({ suggestion, showSuggestionDetails, theme, getCategoryColor }) => {
  const categoryColor = getCategoryColor(suggestion.category);
  
  // Gradient için ikinci renk oluştur (biraz daha açık ton)
  const secondaryColor = categoryColor + '99'; // %60 opaklık ekleyerek açık ton
  
  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => showSuggestionDetails(suggestion)}
      style={styles.container}
    >
      <View style={[styles.suggestionItem, { 
        backgroundColor: theme.card,
        shadowColor: theme.shadow,
      }]}>
        {/* Sol kenar gradient */}
        <LinearGradient
          colors={[categoryColor, secondaryColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.leftBorder}
        />
        
        {/* İkon container - arkaplan kaldırıldı */}
        <View style={styles.iconWrapper}>
          <Icon name={suggestion.icon} size={24} color={categoryColor} />
        </View>
        
        <View style={styles.suggestionContent}>
          <Text style={[styles.suggestionTitle, { color: theme.text }]} numberOfLines={1}>
            {suggestion.title}
          </Text>
          <View style={styles.categoryContainer}>
            <LinearGradient
              colors={[categoryColor, secondaryColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.categoryBadge}
            >
              <Text style={styles.suggestionCategory}>
                {suggestion.category}
              </Text>
            </LinearGradient>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          {/* Bilgi ikonu */}
          <TouchableOpacity 
            style={[styles.infoButton]}
            onPress={(e) => {
              e.stopPropagation();
              showSuggestionDetails(suggestion);
            }}
          >
            <Icon name="information-outline" size={18} color={categoryColor} />
          </TouchableOpacity>
          
          {/* Ekle butonu */}
          <TouchableOpacity 
            style={[styles.addButton]}
            onPress={(e) => {
              e.stopPropagation();
              showSuggestionDetails(suggestion);
            }}
          >
            <LinearGradient
              colors={[categoryColor, secondaryColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Icon name="plus" size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative', // Sol kenardaki gradient için
  },
  leftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 5,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryBadge: {
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  suggestionCategory: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 2,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default AISuggestionItem; 