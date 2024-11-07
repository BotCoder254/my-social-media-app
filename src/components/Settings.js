import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  FaBell, 
  FaLock, 
  FaPalette, 
  FaGlobe, 
  FaUserShield, 
  FaToggleOn, 
  FaToggleOff,
  FaMoon,
  FaSun,
  FaUniversalAccess,
  FaDatabase
} from 'react-icons/fa';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import { requestNotificationPermission, sendTestNotification } from '../utils/notifications';
import { useSettings } from '../contexts/SettingsContext';
import { updateUserPrivacy, updateUserTheme, updateUserNotifications } from '../firebase/settingsService';
import LoadingAnimation from './common/LoadingAnimation';

const Settings = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Define defaultSettings before using it
  const defaultSettings = {
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      mentionNotifications: true,
      followNotifications: true,
      postNotifications: true,
      messageNotifications: true,
      newsletterSubscription: true
    },
    privacy: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowMessages: 'everyone',
      showActivity: true,
      showLastSeen: true,
      allowTagging: 'everyone',
      allowComments: 'everyone',
      blockList: []
    },
    appearance: {
      theme: 'light',
      fontSize: 'medium',
      reducedMotion: false,
      highContrast: false,
      compactMode: false,
      showAnimations: true,
      colorScheme: 'default'
    },
    language: {
      preferred: 'en',
      autoTranslate: false,
      translateFrom: ['all'],
      contentLanguages: ['en']
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      trustedDevices: [],
      loginHistory: [],
      activeDevices: [],
      passwordChangeReminder: '90days',
      dataDownload: false,
      accountRecoveryEmail: ''
    },
    accessibility: {
      screenReader: false,
      keyboardShortcuts: true,
      captions: false,
      textToSpeech: false,
      contrastMode: 'normal',
      reducedMotion: false,
      highContrast: false
    },
    dataUsage: {
      autoPlayVideos: 'wifi',
      imageQuality: 'high',
      saveData: false,
      cacheSize: '1GB'
    }
  };

  const [settings, setSettings] = useState(defaultSettings);

  // Move useEffect to the top, before any conditional returns
  useEffect(() => {
    if (currentUser) {
      const userStatusRef = doc(db, 'users', currentUser.uid);
      const updateOnlineStatus = async () => {
        if (settings.privacy.showOnlineStatus) {
          await updateDoc(userStatusRef, {
            online: true,
            lastSeen: serverTimestamp()
          });
        }
      };

      updateOnlineStatus();

      // Update last seen when user goes offline
      const handleBeforeUnload = async () => {
        if (settings.privacy.showOnlineStatus) {
          await updateDoc(userStatusRef, {
            online: false,
            lastSeen: serverTimestamp()
          });
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [currentUser, settings.privacy.showOnlineStatus]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().settings) {
          // Merge default settings with user settings
          setSettings(prevSettings => ({
            ...defaultSettings, // Use defaultSettings as base
            ...userDoc.data().settings
          }));
        } else {
          // Initialize user settings in Firestore
          await updateDoc(userRef, { settings: defaultSettings });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to load settings');
      }
    };

    fetchSettings();
  }, [currentUser]);

  // Add error display
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  // Add loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingAnimation />
      </div>
    );
  }

  // Update handleSettingChange to include error handling
  const handleSettingChange = async (category, setting, value) => {
    try {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [setting]: value
        }
      }));

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        [`settings.${category}.${setting}`]: value
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating setting:', error);
      setError('Failed to update setting');
      
      // Revert the setting if update fails
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [setting]: prev[category][setting]
        }
      }));
    }
  };

  const handleTwoFactorAuth = async () => {
    try {
      // Here you would implement your 2FA logic
      // This is just a placeholder
      const newValue = !settings.security.twoFactorAuth;
      await handleSettingChange('security', 'twoFactorAuth', newValue);
      
      if (newValue) {
        // Generate and show 2FA QR code
        // You would need to implement this based on your 2FA provider
        alert('2FA setup would happen here');
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error);
    }
  };

  const handleLanguageChange = async (language) => {
    try {
      await handleSettingChange('language', 'preferred', language);
      // Here you would implement language change logic
      // This might involve loading new translations, etc.
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleAppearanceChange = async (theme) => {
    try {
      await handleSettingChange('appearance', 'theme', theme);
      // Apply theme change immediately
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Error changing appearance:', error);
    }
  };

  const handlePrivacyChange = async (setting, value) => {
    try {
      await handleSettingChange('privacy', setting, value);
      if (setting === 'profileVisibility') {
        // Update user's profile visibility in posts
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          profileVisibility: value
        });
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
    }
  };

  const handleNotificationChange = async (setting, value) => {
    try {
      if (setting === 'pushNotifications' && value) {
        const permissionGranted = await requestNotificationPermission();
        if (!permissionGranted) {
          alert('Please enable notifications in your browser settings');
          return;
        }
        // Send a test notification
        sendTestNotification();
      }
      await handleSettingChange('notifications', setting, value);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  const tabs = [
    { id: 'notifications', icon: FaBell, label: 'Notifications' },
    { id: 'privacy', icon: FaUserShield, label: 'Privacy' },
    { id: 'appearance', icon: FaPalette, label: 'Appearance' },
    { id: 'language', icon: FaGlobe, label: 'Language' },
    { id: 'security', icon: FaLock, label: 'Security' },
    { id: 'accessibility', icon: FaUniversalAccess, label: 'Accessibility' },
    { id: 'dataUsage', icon: FaDatabase, label: 'Data Usage' }
  ];

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Email Notifications</h3>
          <p className="text-sm text-gray-500">Receive email notifications about activity</p>
        </div>
        <button
          onClick={() => handleSettingChange('notifications', 'emailNotifications', !settings.notifications.emailNotifications)}
          className="text-2xl text-primary"
        >
          {settings.notifications.emailNotifications ? <FaToggleOn /> : <FaToggleOff />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Push Notifications</h3>
          <p className="text-sm text-gray-500">Receive push notifications on your device</p>
        </div>
        <button
          onClick={() => handleNotificationChange('pushNotifications', !settings.notifications.pushNotifications)}
          className="text-2xl text-primary"
        >
          {settings.notifications.pushNotifications ? <FaToggleOn /> : <FaToggleOff />}
        </button>
      </div>

      {/* Add more notification settings */}
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Profile Visibility</h3>
        <p className="text-sm text-gray-500 mb-2">Control who can see your profile</p>
        <select
          value={settings.privacy.profileVisibility}
          onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="public">Public</option>
          <option value="followers">Followers Only</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Online Status</h3>
          <p className="text-sm text-gray-500">Show when you're active</p>
        </div>
        <button
          onClick={() => handleSettingChange('privacy', 'showOnlineStatus', !settings.privacy.showOnlineStatus)}
          className="text-2xl text-primary"
        >
          {settings.privacy.showOnlineStatus ? <FaToggleOn /> : <FaToggleOff />}
        </button>
      </div>

      {/* Add more privacy settings */}
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Theme</h3>
        <p className="text-sm text-gray-500 mb-2">Choose your preferred theme</p>
        <div className="flex space-x-4">
          <button
            onClick={() => handleAppearanceChange('light')}
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              settings.appearance.theme === 'light' ? 'bg-primary text-white' : 'bg-gray-100'
            }`}
          >
            <FaSun />
            <span>Light</span>
          </button>
          <button
            onClick={() => handleAppearanceChange('dark')}
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              settings.appearance.theme === 'dark' ? 'bg-primary text-white' : 'bg-gray-100'
            }`}
          >
            <FaMoon />
            <span>Dark</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-medium">Font Size</h3>
        <p className="text-sm text-gray-500 mb-2">Adjust the text size</p>
        <select
          value={settings.appearance.fontSize}
          onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* Add more appearance settings */}
    </div>
  );

  const renderLanguageSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Preferred Language</h3>
        <p className="text-sm text-gray-500 mb-2">Select your preferred language</p>
        <select
          value={settings.language.preferred}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          {/* Add more languages */}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Auto-Translate</h3>
          <p className="text-sm text-gray-500">Automatically translate posts to your language</p>
        </div>
        <button
          onClick={() => handleSettingChange('language', 'autoTranslate', !settings.language.autoTranslate)}
          className="text-2xl text-primary"
        >
          {settings.language.autoTranslate ? <FaToggleOn /> : <FaToggleOff />}
        </button>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Two-Factor Authentication</h3>
          <p className="text-sm text-gray-500">Add an extra layer of security</p>
        </div>
        <button
          onClick={handleTwoFactorAuth}
          className="text-2xl text-primary"
        >
          {settings.security.twoFactorAuth ? <FaToggleOn /> : <FaToggleOff />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Login Alerts</h3>
          <p className="text-sm text-gray-500">Get notified of new login attempts</p>
        </div>
        <button
          onClick={() => handleSettingChange('security', 'loginAlerts', !settings.security.loginAlerts)}
          className="text-2xl text-primary"
        >
          {settings.security.loginAlerts ? <FaToggleOn /> : <FaToggleOff />}
        </button>
      </div>

      {/* Add more security settings */}
    </div>
  );

  const renderAccessibilitySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Screen Reader</h3>
          <p className="text-sm text-gray-500">Optimize for screen readers</p>
        </div>
        <button
          onClick={() => handleSettingChange('accessibility', 'screenReader', !settings.accessibility.screenReader)}
          className="text-2xl text-primary"
        >
          {settings.accessibility.screenReader ? <FaToggleOn /> : <FaToggleOff />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Keyboard Shortcuts</h3>
          <p className="text-sm text-gray-500">Enable keyboard navigation</p>
        </div>
        <button
          onClick={() => handleSettingChange('accessibility', 'keyboardShortcuts', !settings.accessibility.keyboardShortcuts)}
          className="text-2xl text-primary"
        >
          {settings.accessibility.keyboardShortcuts ? <FaToggleOn /> : <FaToggleOff />}
        </button>
      </div>
    </div>
  );

  const renderDataUsageSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Auto-Play Videos</h3>
        <p className="text-sm text-gray-500 mb-2">When to auto-play videos</p>
        <select
          value={settings.dataUsage.autoPlayVideos}
          onChange={(e) => handleSettingChange('dataUsage', 'autoPlayVideos', e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="always">Always</option>
          <option value="wifi">Only on Wi-Fi</option>
          <option value="never">Never</option>
        </select>
      </div>

      <div>
        <h3 className="font-medium">Image Quality</h3>
        <p className="text-sm text-gray-500 mb-2">Set image loading quality</p>
        <select
          value={settings.dataUsage.imageQuality}
          onChange={(e) => handleSettingChange('dataUsage', 'imageQuality', e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'notifications':
        return renderNotificationSettings();
      case 'privacy':
        return renderPrivacySettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'language':
        return renderLanguageSettings();
      case 'security':
        return renderSecuritySettings();
      case 'accessibility':
        return renderAccessibilitySettings();
      case 'dataUsage':
        return renderDataUsageSettings();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {renderActiveTab()}
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            Settings updated successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings; 