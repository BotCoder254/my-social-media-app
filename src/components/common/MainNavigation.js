import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaHome, 
  FaUser, 
  FaBell, 
  FaEnvelope, 
  FaSearch,
  FaCog,
  FaSignOutAlt
} from 'react-icons/fa';

const MainNavigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/feed', icon: FaHome, label: 'Home' },
    { path: '/messages', icon: FaEnvelope, label: 'Messages' },
    { path: '/profile', icon: FaUser, label: 'Profile' },
  ];

  const notifications = [
    { id: 1, text: 'John liked your post', time: '5m ago' },
    { id: 2, text: 'New message from Sarah', time: '10m ago' },
    { id: 3, text: 'You have a new follower', time: '1h ago' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md' : 'bg-white/80 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/feed" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent"
            >
              SocialApp
            </motion.div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`p-2 rounded-full transition-colors ${
                  location.pathname === item.path
                    ? 'text-primary bg-primary-50'
                    : 'text-gray-500 hover:text-primary hover:bg-primary-50'
                }`}
              >
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <item.icon className="text-xl" />
                </motion.div>
              </Link>
            ))}

            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-primary hover:bg-primary-50 rounded-full transition-colors relative"
              >
                <FaBell className="text-xl" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 border border-gray-100"
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        whileHover={{ backgroundColor: '#f3f4f6' }}
                        className="px-4 py-3 cursor-pointer"
                      >
                        <p className="text-sm text-gray-800">{notification.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <div className="relative">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={currentUser?.photoURL || 'https://via.placeholder.com/40'}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation; 