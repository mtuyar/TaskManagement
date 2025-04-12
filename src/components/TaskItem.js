import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

const TaskItem = ({ task, onToggleComplete, onDelete, onEdit }) => {
  // Eğer task'ta renk bilgisi varsa onu kullan, yoksa varsayılan renk
  const taskColor = task.color || '#4A6FFF';
  
  // İkincil renk (gradient için)
  const secondaryColor = taskColor + '99'; // %60 opaklık
  
  // İkon bilgisi
  const taskIcon = task.icon || 'checkbox-marked-circle-outline';
  
  console.log("TaskItem rendering:", { 
    id: task.id, 
    title: task.title, 
    category: task.category, 
    icon: taskIcon, 
    color: taskColor 
  });
  
  return (
    <View style={styles.container}>
      <View style={[styles.taskItem, { 
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
      }]}>
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
          <Text style={styles.taskTitle} numberOfLines={1}>
            {task.title}
          </Text>
          
          {task.description ? (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {task.description}
            </Text>
          ) : null}
          
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
          </View>
        </View>
        
        {/* Aksiyon butonları */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: `${taskColor}15` }]}
            onPress={() => onToggleComplete(task.id)}
          >
            <Icon 
              name={task.isCompleted ? "check-circle" : "circle-outline"} 
              size={20} 
              color={taskColor} 
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
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  leftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  frequencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});

export default TaskItem; 