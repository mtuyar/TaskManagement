import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TaskContext = createContext();

export const useTaskContext = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Periyot kontrolü fonksiyonu
  const checkAndResetPeriodicTasks = (taskList) => {
    // Normal tarih kullan
    const today = new Date();
    today.setDate(today.getDate() + 0); // Normal tarih
    const todayString = today.toISOString().split('T')[0];
    
    return taskList.map(task => {
      if (!task.frequency || task.frequency === 'Tek Seferlik') {
        return task; // Tek seferlik görevler değişmez
      }
      
      let currentPeriodStart = '';
      let shouldReset = false;
      
      switch (task.frequency) {
        case 'Günlük':
          currentPeriodStart = todayString;
          shouldReset = task.lastPeriodStart !== currentPeriodStart;
          break;
          
        case 'Haftalık':
          // Haftanın başlangıcı (Pazartesi)
          const dayOfWeek = today.getDay();
          const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Pazar = 0, Pazartesi = 1
          const monday = new Date(today);
          monday.setDate(today.getDate() - mondayOffset);
          currentPeriodStart = monday.toISOString().split('T')[0];
          shouldReset = task.lastPeriodStart !== currentPeriodStart;
          break;
          
        case 'Aylık':
          // Ayın başlangıcı
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          currentPeriodStart = firstDayOfMonth.toISOString().split('T')[0];
          shouldReset = task.lastPeriodStart !== currentPeriodStart;
          break;
          
        default:
          return task;
      }
      
      // Eğer periyot değiştiyse sıfırla
      if (shouldReset) {
        return {
          ...task,
          isCompleted: false,
          lastPeriodStart: currentPeriodStart,
          // Tamamlanma geçmişini koru
          completedDates: task.completedDates || []
        };
      }
      
      return task;
    });
  };

  // AsyncStorage'dan görevleri yükle
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem('tasks');
        if (storedTasks) {
          const parsedTasks = JSON.parse(storedTasks);
          // Periyot kontrolü yap ve gerekirse sıfırla
          const updatedTasks = checkAndResetPeriodicTasks(parsedTasks);
          setTasks(updatedTasks);
          
          // Eğer değişiklik varsa arka planda kaydet
          if (JSON.stringify(parsedTasks) !== JSON.stringify(updatedTasks)) {
            saveTasks(updatedTasks);
          }
        }
      } catch (error) {
        console.error('Görevler yüklenirken hata oluştu:', error);
      } finally {
        // Loading state'i hemen temizle
        setLoading(false);
      }
    };

    // Görevleri hemen yükle
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
    
    // Normal tarih set et
    const now = new Date();
    now.setDate(now.getDate() + 0);
    let lastPeriodStart = '';
    
    switch (newTask.frequency) {
      case 'Günlük':
        lastPeriodStart = now.toISOString().split('T')[0];
        break;
      case 'Haftalık':
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - mondayOffset);
        lastPeriodStart = monday.toISOString().split('T')[0];
        break;
      case 'Aylık':
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        lastPeriodStart = firstDayOfMonth.toISOString().split('T')[0];
        break;
      default:
        lastPeriodStart = '';
    }
    
    const taskWithPeriod = {
      ...newTask,
      lastPeriodStart,
      completedDates: []
    };
    
    // Yeni görevleri state'e ekle
    const updatedTasks = [...tasks, taskWithPeriod];
    setTasks(updatedTasks);
    
    // AsyncStorage'a kaydet
    saveTasks(updatedTasks);
  };

  // Görevi tamamlandı olarak işaretle
  const toggleTaskCompletion = (id) => {
    console.log("Tamamlanma durumu değiştirilen görev ID:", id);
    
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        // Normal tarih al
        const testDate = new Date();
        testDate.setDate(testDate.getDate() + 0);
        const today = testDate.toISOString().split('T')[0];
        
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
        
        // Periyot başlangıç tarihini güncelle
        let lastPeriodStart = task.lastPeriodStart;
        if (!lastPeriodStart) {
          // İlk kez tamamlanıyorsa mevcut periyodu set et
          const now = new Date();
          switch (task.frequency) {
            case 'Günlük':
              lastPeriodStart = today;
              break;
            case 'Haftalık':
              const dayOfWeek = now.getDay();
              const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              const monday = new Date(now);
              monday.setDate(now.getDate() - mondayOffset);
              lastPeriodStart = monday.toISOString().split('T')[0];
              break;
            case 'Aylık':
              const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              lastPeriodStart = firstDayOfMonth.toISOString().split('T')[0];
              break;
          }
        }
        
        console.log("Güncellenen görev:", {
          ...task,
          isCompleted,
          completedDates,
          lastPeriodStart
        });
        
        return {
          ...task,
          isCompleted,
          completedDates,
          lastPeriodStart
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
    // Normal tarih set et
    const now = new Date();
    now.setDate(now.getDate() + 0);
    let lastPeriodStart = '';
    
    switch (suggestion.frequency) {
      case 'Günlük':
        lastPeriodStart = now.toISOString().split('T')[0];
        break;
      case 'Haftalık':
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - mondayOffset);
        lastPeriodStart = monday.toISOString().split('T')[0];
        break;
      case 'Aylık':
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        lastPeriodStart = firstDayOfMonth.toISOString().split('T')[0];
        break;
      default:
        lastPeriodStart = '';
    }
    
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
      lastPeriodStart,
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