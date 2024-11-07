export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const sendTestNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('Test Notification', {
      body: 'Notifications are working!',
      icon: '/logo192.png'
    });
  }
}; 