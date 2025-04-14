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

// Bildirim izinlerini kontrol et ve iste
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
      await Notifications.setNotificationChannelAsync('default', {
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

// Günlük tekrar eden bildirim ayarla
export const scheduleNotification = async (task, time) => {
  try {
    // Daha önce ayarlanmış bildirim varsa iptal et
    if (task.notificationId) {
      await cancelNotification(task.notificationId);
    }

    const now = new Date();
    const notificationTime = new Date(time);

    // Geçmiş zaman verildiyse, yarına al
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    const hours = notificationTime.getHours();
    const minutes = notificationTime.getMinutes();

    const notificationContent = {
      title: `Hatırlatma: ${task.title}`,
      body: task.description || 'Vazifeyi tamamlamayı unutmayın!',
      data: { taskId: task.id },
    };

    const trigger = {
      hour: hours,
      minute: minutes,
      repeats: true, // her gün tekrar et
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: trigger,
    });

    console.log(`Günlük bildirim ayarlandı: ${notificationId}, Saat: ${hours}:${minutes}`);
    return notificationId;
  } catch (error) {
    console.error('Bildirim ayarlanırken hata oluştu:', error);
    return null;
  }
};

// Bildirim iptali
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Bildirim iptal edildi: ${notificationId}`);
    return true;
  } catch (error) {
    console.error('Bildirim iptal edilirken hata oluştu:', error);
    return false;
  }
};
