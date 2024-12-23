import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { createUserDocument } from '../firebase/userService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const signup = async (email, password) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // Create the user document in Firestore
      await createUserDocument(user.uid, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      return { user };
    } catch (error) {
      throw error;
    }
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      // Create or update the user document for Google Sign In
      await createUserDocument(user.uid, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      return { user };
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (displayName, photoURL) => {
    try {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL
      });
      setCurrentUser(prev => ({...prev, displayName, photoURL}));
    } catch (error) {
      setError(error.message);
    }
  };

  const updateUserEmail = async (newEmail) => {
    try {
      await updateEmail(auth.currentUser, newEmail);
    } catch (error) {
      setError(error.message);
    }
  };

  const updateUserPassword = async (newPassword) => {
    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    error,
    signup,
    login,
    logout,
    googleSignIn,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};