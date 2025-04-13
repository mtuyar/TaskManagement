import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Bildirimleri yapılandır
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Bildirim izinlerini kontrol et ve gerekirse iste
export const registerForPushNotificationsAsync = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Bildirim izni alınamadı!');
      return false;
    }
    
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Bildirim izni alınırken hata oluştu:', error);
    return false;
  }
};

// Bildirim planla
export const scheduleNotification = async ({ id, title, body, data, time, repeat = false }) => {
  try {
    // Zaman kontrolü
    if (!time || !(time instanceof Date) || isNaN(time.getTime())) {
      console.error("Geçersiz bildirim zamanı:", time);
      throw new Error("Geçersiz bildirim zamanı");
    }
    
    console.log("Bildirim planlanıyor:", { id, title, body, time: time.toISOString(), repeat });
    
    // Bildirim içeriğini oluştur
    const notificationContent = {
      title,
      body,
      data: data || {},
    };
    
    // Bildirim tetikleyicisini oluştur
    const trigger = {
      hour: time.getHours(),
      minute: time.getMinutes(),
      repeats: repeat
    };
    
    console.log("Bildirim tetikleyicisi:", trigger);
    
    // Bildirimi planla
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
      identifier: id
    });
    
    console.log("Bildirim başarıyla planlandı, ID:", notificationId);
    return notificationId;
  } catch (error) {
    console.error("Bildirim planlanırken hata oluştu:", error);
    throw error;
  }
};

// Bildirimi iptal et
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Bildirim iptal edildi: ${notificationId}`);
    return true;
  } catch (error) {
    console.error('Bildirim iptal edilirken hata oluştu:', error);
    throw error;
  }
};

// Tüm bildirimleri iptal et
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Tüm bildirimler iptal edildi');
    return true;
  } catch (error) {
    console.error('Tüm bildirimler iptal edilirken hata oluştu:', error);
    throw error;
  }
};

// Planlanmış bildirimleri getir
export const getScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('Planlanmış bildirimler alınırken hata oluştu:', error);
    throw error;
  }
};

// Bildirimleri dinle
export const addNotificationReceivedListener = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

// Bildirime tıklanma olayını dinle
export const addNotificationResponseReceivedListener = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

// Dinleyicileri kaldır
export const removeNotificationSubscription = (subscription) => {
  subscription && Notifications.removeNotificationSubscription(subscription);
}; 