import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TaskContext = createContext();

export const useTaskContext = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // AsyncStorage'dan görevleri yükle
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem('tasks');
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        }
      } catch (error) {
        console.error('Görevler yüklenirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Görevleri AsyncStorage'a kaydet
  const saveTasks = async (tasksToSave) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasksToSave));
    } catch (error) {
      console.error('Görevler kaydedilirken hata oluştu:', error);
    }
  };

  // Görevler değiştiğinde kaydet
  useEffect(() => {
    if (!loading) {
      saveTasks(tasks);
    }
  }, [tasks, loading]);

  // Yeni görev ekle
  const addTask = (task) => {
    const newTask = {
      ...task,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  // Görevi tamamlandı olarak işaretle
  const toggleTaskCompletion = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // Görevi güncelle
  const updateTask = (updatedTask) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };

  // Görevi sil
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Yapay zeka önerisini görevlere ekle
  const addAISuggestionToTasks = (suggestion) => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: suggestion.title,
      category: suggestion.category,
      icon: suggestion.icon || 'checkbox-marked-circle-outline',
      frequency: suggestion.frequency,
      completed: false,
      createdAt: new Date().toISOString(),
      description: suggestion.description || '',
      source: 'ai'
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      loading,
      addTask,
      toggleTaskCompletion,
      updateTask,
      deleteTask,
      addAISuggestionToTasks,
    }}>
      {children}
    </TaskContext.Provider>
  );
}; 