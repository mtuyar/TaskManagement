import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Bildirimleri yapılandır - Expo docs'a göre
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Push bildirimleri için kayıt - Expo dokümantasyonuna göre
export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Bildirim izni verilmedi!');
      return;
    }
    
    try {
      const projectId = '492a97aa-3f31-43c3-a5c9-f28fcddd9a18';
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      console.log(token);
    } catch (e) {
      token = `${e}`;
    }
  } else {
    console.log('Fiziksel cihaz gerekli');
  }

  return token;
};

// Görev bildirimi planla - Expo dokümantasyonuna göre TIME_INTERVAL kullan
export const scheduleNotification = async (task, notificationTime) => {
  try {
    // Bildirim zamanı geçmişse yarına ayarla
    const now = new Date();
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    const notificationContent = {
      title: `📋 ${task.title}`,
      body: `Görevinizi tamamlamayı unutmayın! ${task.category} kategorisindeki bu görev sizi bekliyor.`,
      data: { taskId: task.id, category: task.category },
      android: {
        channelId: 'default',
        color: '#4A6FFF',
        priority: 'high',
        vibrate: [0, 250, 250, 250],
        sound: 'default'
      },
      ios: {
        sound: 'default',
        badge: 1
      }
    };

    // Expo dokümantasyonuna göre TIME_INTERVAL trigger
    const secondsUntilNotification = Math.floor((notificationTime.getTime() - now.getTime()) / 1000);
    
    const trigger = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, secondsUntilNotification)
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: trigger,
    });

    console.log('Bildirim planlandı:', notificationId, 'Zaman:', notificationTime, 'Saniye:', secondsUntilNotification);
    return notificationId;
  } catch (error) {
    console.log('Bildirim planlanırken hata:', error);
    console.error('Bildirim planlanırken hata:', error);
    return null;
  }
};

// Günlük tekrarlayan bildirim planla - Expo dokümantasyonuna göre
export const scheduleDailyNotification = async (task, hours, minutes) => {
  try {
    const notificationContent = {
      title: `📋 ${task.title}`,
      body: `Günlük görevinizi tamamlamayı unutmayın! ${task.category} kategorisindeki bu görev sizi bekliyor.`,
      data: { taskId: task.id, category: task.category },
      android: {
        channelId: 'default',
        color: '#4A6FFF',
        priority: 'high',
        vibrate: [0, 250, 250, 250],
        sound: 'default'
      },
      ios: {
        sound: 'default',
        badge: 1
      }
    };

    // Expo dokümantasyonuna göre daily trigger
    const dailyTrigger = {
      hour: hours,
      minute: minutes,
      repeats: true
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: dailyTrigger,
    });

    console.log('Günlük bildirim planlandı:', notificationId, 'Saat:', hours + ':' + minutes);
    return notificationId;
  } catch (error) {
    console.error('Günlük bildirim planlanırken hata:', error);
    return null;
  }
};

// Bildirimi iptal et
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('Bildirim iptal edildi:', notificationId);
    return true;
  } catch (error) {
    console.error('Bildirim iptal edilirken hata:', error);
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
    console.error('Tüm bildirimler iptal edilirken hata:', error);
    return false;
  }
};

// Planlanan bildirimleri getir
export const getScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Planlanan bildirimler:', notifications);
    return notifications;
  } catch (error) {
    console.error('Planlanan bildirimler alınırken hata:', error);
    return [];
  }
};



