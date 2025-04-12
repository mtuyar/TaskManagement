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
  const addTask = (newTask) => {
    console.log("Context'e eklenen görev:", newTask); // Hata ayıklama için
    
    // Yeni görevleri state'e ekle
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    
    // AsyncStorage'a kaydet
    saveTasks(updatedTasks);
  };

  // Görevi tamamlandı olarak işaretle
  const toggleTaskCompletion = (id) => {
    console.log("Tamamlanma durumu değiştirilen görev ID:", id);
    
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        // Bugünün tarihini al
        const today = new Date().toISOString().split('T')[0];
        
        // Tamamlanma durumunu değiştir
        const isCompleted = !task.isCompleted;
        
        // Tamamlanma tarihlerini güncelle
        let completedDates = task.completedDates || [];
        
        if (isCompleted) {
          // Eğer bugün zaten eklenmediyse ekle
          if (!completedDates.includes(today)) {
            completedDates = [...completedDates, today];
          }
        } else {
          // Eğer bugün varsa çıkar
          completedDates = completedDates.filter(date => date !== today);
        }
        
        console.log("Güncellenen görev:", {
          ...task,
          isCompleted,
          completedDates
        });
        
        return {
          ...task,
          isCompleted,
          completedDates
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    
    // AsyncStorage'a kaydet
    saveTasks(updatedTasks);
  };

  // Görevi güncelle
  const updateTask = (updatedTask) => {
    console.log("Güncellenen görev:", updatedTask); // Hata ayıklama için
    
    // Görevleri güncelle
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    
    setTasks(updatedTasks);
    
    // AsyncStorage'a kaydet
    saveTasks(updatedTasks);
  };

  // Görevi sil
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Yapay zeka önerisini görevlere ekle
  const addAISuggestionToTasks = (suggestion) => {
    const newTask = {
      id: Date.now().toString(),
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      icon: suggestion.icon,
      color: suggestion.color,
      frequency: suggestion.frequency,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      completedDates: [],
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    
    // Async Storage'a kaydet
    saveTasks([...tasks, newTask]);
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