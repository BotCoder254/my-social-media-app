import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserSettings, updateUserSettings } from '../firebase/settingsService';

const SettingsContext = createContext();

// Default settings with appearance included
const defaultSettings = {
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
};

export const useSettings = () => {
  return useContext(SettingsContext);
};

export const SettingsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState('light');
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (currentUser) {
        const userSettings = await getUserSettings(currentUser.uid);
        if (userSettings) {
          // Merge with default settings to ensure all properties exist
          const mergedSettings = {
            ...defaultSettings,
            ...userSettings,
            appearance: {
              ...defaultSettings.appearance,
              ...(userSettings.appearance || {})
            }
          };
          setSettings(mergedSettings);
          setTheme(mergedSettings.appearance.theme);
          applyTheme(mergedSettings.appearance.theme);
        } else {
          // If no settings exist, use defaults and save them
          setSettings(defaultSettings);
          setTheme(defaultSettings.appearance.theme);
          applyTheme(defaultSettings.appearance.theme);
          await updateUserSettings(currentUser.uid, defaultSettings);
        }
      }
      setLoading(false);
    };

    loadSettings();
  }, [currentUser]);

  const applyTheme = (newTheme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const updateSettings = async (newSettings) => {
    if (currentUser) {
      const mergedSettings = {
        ...defaultSettings,
        ...newSettings,
        appearance: {
          ...defaultSettings.appearance,
          ...(newSettings.appearance || {})
        }
      };
      await updateUserSettings(currentUser.uid, mergedSettings);
      setSettings(mergedSettings);
      if (mergedSettings.appearance?.theme) {
        setTheme(mergedSettings.appearance.theme);
        applyTheme(mergedSettings.appearance.theme);
      }
    }
  };

  const value = {
    theme,
    settings,
    updateSettings,
    loading
  };

  return (
    <SettingsContext.Provider value={value}>
      {!loading && children}
    </SettingsContext.Provider>
  );
};