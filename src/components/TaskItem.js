import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

const TaskItem = ({ task, onToggleComplete, onDelete, onEdit, onPress, onSetNotification }) => {
  // Eğer task'ta renk bilgisi varsa onu kullan, yoksa varsayılan renk
  const taskColor = task.color || '#4A6FFF';
  
  // İkincil renk (gradient için)
  const secondaryColor = taskColor + '99'; // %60 opaklık
  
  // İkon bilgisi
  const taskIcon = task.icon || 'checkbox-marked-circle-outline';
  
  // Renk paleti
  const colors = {
    primary: '#4A6FFF',
    secondary: '#6C63FF',
    accent: '#FF6584',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
  };
  
  console.log("TaskItem rendering:", { 
    id: task.id, 
    title: task.title, 
    category: task.category, 
    icon: taskIcon, 
    color: taskColor 
  });
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(task)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.taskItem, 
        { 
          backgroundColor: '#FFFFFF',
          shadowColor: '#000000',
        },
        task.isCompleted && styles.completedTaskItem
      ]}>
        {/* Sol kenar gradient */}
        <LinearGradient
          colors={[taskColor, secondaryColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.leftBorder}
        />
        
        {/* İkon container */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[taskColor, secondaryColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBackground}
          >
            <Icon name={taskIcon} size={20} color="#FFFFFF" />
          </LinearGradient>
        </View>
        
        {/* Task içeriği */}
        <View style={styles.taskContent}>
          {/* Kategori ve etiketler - sağ üstte */}
          <View style={styles.taskMeta}>
            {task.category ? (
              <View style={[styles.categoryBadge, { backgroundColor: `${taskColor}20` }]}>
                <Text style={[styles.categoryText, { color: taskColor }]}>
                  {task.category}
                </Text>
              </View>
            ) : null}
            
            {task.frequency ? (
              <View style={[styles.frequencyBadge, { backgroundColor: `${taskColor}10` }]}>
                <Text style={[styles.frequencyText, { color: taskColor }]}>
                  {task.frequency}
                </Text>
              </View>
            ) : null}
            
            {/* Bildirim varsa göster */}
            {(task.notification && task.notification.enabled) ? (
              <View style={[styles.notificationBadge, { backgroundColor: '#FFC10720' }]}>
                <Icon name="bell" size={12} color="#FFC107" />
                <Text style={[styles.notificationText, { color: '#FFC107' }]}>
                  {new Date(task.notification.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>
            ) : null}
          </View>
          
          {/* Başlık ve açıklama - solda */}
          <View style={styles.taskTitleContainer}>
            <Text style={[
              styles.taskTitle, 
              task.isCompleted && styles.completedTaskTitle
            ]} numberOfLines={1}>
              {task.title}
            </Text>
            
            {task.description ? (
              <Text style={[
                styles.taskDescription,
                task.isCompleted && styles.completedTaskDescription
              ]} numberOfLines={2}>
                {task.description}
              </Text>
            ) : null}
          </View>
          
          {/* Aksiyon butonları - sağ altta */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.completeButton,
                { 
                  backgroundColor: task.isCompleted ? `${colors.success}10` : `${taskColor}10`,
                  borderWidth: 1,
                  borderColor: task.isCompleted ? `${colors.success}40` : `${taskColor}40`,
                  borderRadius: 20,
                }
              ]}
              onPress={() => onToggleComplete(task.id)}
            >
              <View style={styles.completeButtonInner}>
                <Icon 
                  name={task.isCompleted ? "check-circle" : "circle-outline"} 
                  size={18} 
                  color={task.isCompleted ? colors.success : taskColor} 
                />
                <Text style={[
                  styles.completeButtonText,
                  { 
                    color: task.isCompleted ? colors.success : taskColor,
                    fontSize: 10,
                    fontWeight: '500'
                  }
                ]}>
                  {task.isCompleted ? "Tamamlandı" : "Tamamla"}
                </Text>
              </View>
              
              {/* Tamamlandı durumunda animasyonlu bir efekt ekleyelim */}
              {task.isCompleted && (
                <View style={[
                  styles.completedIndicator, 
                  { 
                    backgroundColor: colors.success,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    top: -4,
                    right: -4,
                  }
                ]}>
                  <Icon name="check" size={10} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { 
                  backgroundColor: (task.notification && task.notification.enabled) 
                    ? '#FFC10720' 
                    : `${taskColor}15` 
                }
              ]}
              onPress={() => onSetNotification(task)}
            >
              <Icon 
                name="bell-outline" 
                size={18} 
                color={(task.notification && task.notification.enabled) ? '#FFC107' : taskColor} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: `${taskColor}15` }]}
              onPress={() => onEdit(task)}
            >
              <Icon name="pencil-outline" size={18} color={taskColor} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#FFE5E5' }]}
              onPress={() => onDelete(task.id)}
            >
              <Icon name="trash-can-outline" size={18} color="#FF4D4D" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskItem: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  leftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  iconContainer: {
    marginRight: 14,
    alignSelf: 'center',
  },
  iconBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    flexDirection: 'column',
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 3,
    marginLeft: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  frequencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 3,
    marginLeft: 3,
  },
  frequencyText: {
    fontSize: 11,
    fontWeight: '500',
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 3,
    marginLeft: 3,
  },
  notificationText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 3,
  },
  taskTitleContainer: {
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'left',
    marginBottom: 3,
  },
  taskDescription: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'left',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  completeButton: {
    flexDirection: 'row',
    width: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    position: 'relative',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  completeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 3,
  },
  completedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    elevation: 2,
  },
  completedTaskItem: {
    backgroundColor: '#F9FFF9',
    opacity: 0.9,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  completedTaskDescription: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
});

export default TaskItem; 