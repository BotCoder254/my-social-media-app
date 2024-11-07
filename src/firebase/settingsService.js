import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';

export const updateUserSettings = async (userId, settings) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { settings });
};

export const updateUserPrivacy = async (userId, privacySettings) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'settings.privacy': privacySettings,
    'profileVisibility': privacySettings.profileVisibility,
    'onlineStatus': privacySettings.showOnlineStatus
  });
};

export const updateUserTheme = async (userId, theme) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'settings.appearance.theme': theme
  });
};

export const updateUserNotifications = async (userId, notificationSettings) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'settings.notifications': notificationSettings,
    'emailNotifications': notificationSettings.emailNotifications
  });
};

export const getUserSettings = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  return userDoc.exists() ? userDoc.data().settings : null;
}; 