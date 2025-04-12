import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
// import * as Device from 'expo-device'; // Bu satırı kaldırın veya yorum satırına alın

// Bildirimleri yapılandır
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// Bildirim izinlerini kontrol et ve iste
export const requestNotificationPermissions = async () => {
  try {
    // Emülatör kontrolünü kaldırın
    // if (Device.isDevice === false) {
    //   console.log('Emülatörde bildirimler tam olarak çalışmayabilir');
    // }
    
    // Android için kanal oluştur
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: true,
      });
    }

    // İzinleri kontrol et
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Eğer izin yoksa, iste
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Bildirim izni verilmedi');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Bildirim izni alınırken hata oluştu:', error);
    return false;
  }
};

// Bildirim planla - Saatlik tekrarlanan bildirim
export const scheduleNotification = async (
  taskId,
  title,
  body,
  date,
  isRepeating = false
) => {
  try {
    const hasPermission = await requestNotificationPermissions();
    
    if (!hasPermission) {
      console.log('Bildirim izni verilmedi');
      return null;
    }
    
    // Bildirim zamanını ayarla
    const notificationTime = new Date(date);
    
    // Konsola bilgi yazdır
    console.log('Bildirim planlanıyor:');
    console.log('Başlık:', title);
    console.log('İçerik:', body);
    console.log('Saat:', notificationTime.getHours() + ':' + notificationTime.getMinutes());
    
    // Önce tüm mevcut bildirimleri iptal et
    await cancelAllNotifications();
    
    // Trigger oluştur
    let trigger;
    
    if (isRepeating) {
      // Tekrarlanan bildirim için trigger
      trigger = {
        hour: notificationTime.getHours(),
        minute: notificationTime.getMinutes(),
        repeats: true,
      };
      
      console.log(`Tekrarlanan bildirim saati: ${trigger.hour}:${trigger.minute}`);
    } else {
      // Tek seferlik bildirim için trigger
      // Şu anki zamanı al
      const now = new Date();
      
      // Bildirim zamanını ayarla
      const scheduledTime = new Date();
      scheduledTime.setHours(notificationTime.getHours());
      scheduledTime.setMinutes(notificationTime.getMinutes());
      scheduledTime.setSeconds(0);
      scheduledTime.setMilliseconds(0);
      
      // Eğer bildirim zamanı geçmişse, bir sonraki güne ayarla
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
        console.log('Bildirim zamanı geçmiş, yarına planlanıyor');
      }
      
      // Tarih nesnesini doğrudan kullan
      trigger = scheduledTime;
      
      console.log(`Tek seferlik bildirim zamanı: ${scheduledTime.toLocaleString()}`);
    }
    
    // Bildirimi planla
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { taskId },
        sound: true,
      },
      trigger,
    });
    
    console.log('Bildirim planlandı, ID:', notificationId);
    
    // Planlanan bildirimleri kontrol et
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Planlanan bildirimler:', scheduledNotifications);
    
    return notificationId;
  } catch (error) {
    console.error('Bildirim planlanırken hata oluştu:', error);
    return null;
  }
};

// Bildirimi iptal et
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('Bildirim iptal edildi, ID:', notificationId);
    return true;
  } catch (error) {
    console.error('Bildirim iptal edilirken hata oluştu:', error);
    return false;
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
    return false;
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

// Planlanan bildirimleri getir
export const getAllScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('Bildirimler alınırken hata oluştu:', error);
    return [];
  }
}; 