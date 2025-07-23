import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AppHeader = ({
  title,
  subtitle,
  iconName = 'star-outline',
  colors = ['#4A6FFF', '#4A6FFF', '#4A6FFF'],
  rightComponent = null,
  onRightPress = null,
  rightIconName = null,
  rightText = null,
  showBackButton = false,
  onBackPress = null,
  compact = false
}) => {
  return (
    <View style={styles.header}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={colors[0]}
        translucent={true}
        animated={true}
      />
      
      <View
        style={[
          styles.headerGradient,
          compact && styles.headerGradientCompact,
          { backgroundColor: '#4A6FFF' }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {showBackButton && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={onBackPress}
              >
                <Icon name="arrow-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View style={styles.headerTextContainer}>
              <Text style={[
                styles.headerTitle,
                compact && styles.headerTitleCompact
              ]}>
                {title}
              </Text>
              {subtitle && (
                <Text style={[
                  styles.headerSubtitle,
                  compact && styles.headerSubtitleCompact
                ]}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.headerRight}>
            {rightComponent && rightComponent}
            
            {onRightPress && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onRightPress}
              >
                {rightIconName && <Icon name={rightIconName} size={20} color="#FFFFFF" />}
                {rightText && <Text style={styles.headerButtonText}>{rightText}</Text>}
              </TouchableOpacity>
            )}
            
            {iconName && (
              <View style={[
                styles.headerIconContainer,
                compact && styles.headerIconContainerCompact
              ]}>
                <Icon 
                  name={iconName} 
                  size={compact ? 50 : 60} 
                  color="rgba(255, 255, 255, 0.2)" 
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#4A6FFF', // Bildirim çubuğu ile aynı renk
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 0, // Android shadow'u kaldır
  },
  headerGradientCompact: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
    minHeight: 50,
    width: '100%',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4, // Title ile subtitle arasındaki boşluğu azalt
  },
  headerTitleCompact: {
    fontSize: 22,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginTop: 2, // Subtitle'ı title'a daha yakın yap
    marginBottom: 20, // Altında daha fazla boşluk bırak
  },
  headerSubtitleCompact: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2, // Compact modda da subtitle'ı title'a yakın yap
    marginBottom: 16, // Altında daha fazla boşluk bırak
  },
  headerRight: {
    alignItems: 'flex-end',
    position: 'relative',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerIconContainer: {
    position: 'absolute',
    right: 0,
    top: -10,
  },
  headerIconContainerCompact: {
    top: -5,
  },
  backButton: {
    padding: 10,
    marginBottom: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
});

export default AppHeader; 