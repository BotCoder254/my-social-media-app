import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './config';

export const createUserDocument = async (userId, data) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    const userData = {
      id: userId,
      email: data.email,
      displayName: data.displayName || '',
      photoURL: data.photoURL || '',
      createdAt: new Date().toISOString(),
      settings: {
        appearance: {
          theme: 'light'
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true
        },
        privacy: {
          profileVisibility: 'public',
          showOnlineStatus: true
        }
      },
      ...data
    };

    await setDoc(userRef, userData);
    return userData;
  }

  return userDoc.data();
};

export const getUserDocument = async (userId) => {
  if (!userId) return null;
  
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  return userDoc.exists() ? userDoc.data() : null;
};
