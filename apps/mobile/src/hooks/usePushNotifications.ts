import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from '../lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications(isAuthenticated: boolean) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | false>(false);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // Register token with backend
        api.post('/notifications/push-token', {
          token,
          device: Platform.OS,
        }).catch(err => console.error("Error registering push token:", err));
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification clicked:', response.notification.request.content.data);
      // Let the main layout handle routing if needed by observing this state
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [isAuthenticated]);

  return {
    expoPushToken,
    notification,
  };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
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
      console.log('Failed to get push token for push notification!');
      return;
    }

    try {
      // You must provide projectId from app.json/app.config.js for EAS builds
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.warn('⚠️ No "projectId" found in Expo config. Push notifications require an EAS projectId to work in production/bare workflow.');
      }

      const tokenOptions: any = {};
      if (projectId) {
        tokenOptions.projectId = projectId;
      }
      
      token = (await Notifications.getExpoPushTokenAsync(tokenOptions)).data;
    } catch (e: any) {
      console.warn("Could not get push token:", e.message || e);
      // Let the user know why push notifications aren't working
      if (__DEV__) {
        alert("Push notifications not working: " + (e.message || "Unknown error"));
      }
    }
  } else {
    console.log('Must use physical device for Push Notifications');
    if (__DEV__) {
      alert("Push notifications require a physical device. Emulators do not generate push tokens.");
    }
  }

  return token;
}
