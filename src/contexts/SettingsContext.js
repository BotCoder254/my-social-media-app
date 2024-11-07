import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserSettings, updateUserSettings } from '../firebase/settingsService';

const SettingsContext = createContext();

export const useSettings = () => {
  return useContext(SettingsContext);
};

export const SettingsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState('light');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (currentUser) {
        const userSettings = await getUserSettings(currentUser.uid);
        if (userSettings) {
          setSettings(userSettings);
          setTheme(userSettings.appearance.theme);
          applyTheme(userSettings.appearance.theme);
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
      await updateUserSettings(currentUser.uid, newSettings);
      setSettings(newSettings);
      if (newSettings.appearance?.theme) {
        setTheme(newSettings.appearance.theme);
        applyTheme(newSettings.appearance.theme);
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