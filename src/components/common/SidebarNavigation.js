import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaHome, 
  FaUser, 
  FaSignOutAlt, 
  FaCog, 
  FaBars,
  FaBell,
  FaEnvelope,
  FaBookmark,
  FaPlus
} from 'react-icons/fa';

const SidebarNavigation = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const navItems = [
    { path: '/feed', icon: FaHome, label: 'Home' },
    // { path: '/messages', icon: FaEnvelope, label: 'Messages' },
    // { path: '/notifications', icon: FaBell, label: 'Notifications' },
    { path: '/bookmarks', icon: FaBookmark, label: 'Bookmarks' },
    { path: '/profile', icon: FaUser, label: 'Profile' },
    // { path: '/settings', icon: FaCog, label: 'Settings' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <div className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-all duration-300 hidden md:block ${
      isExpanded ? 'w-64' : 'w-20'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Link to="/feed" className="flex items-center">
          {isExpanded ? (
            <span className="text-2xl font-bold text-primary">SocialApp</span>
          ) : (
            <span className="text-2xl font-bold text-primary">SA</span>
          )}
        </Link>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-primary transition-colors"
        >
          <FaBars />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col h-[calc(100%-4rem)] justify-between">
        {/* Navigation Items */}
        <div className="flex flex-col space-y-2 p-4">
          {/* User Profile Section */}
          <div className="flex items-center space-x-3 mb-6 p-2">
            <img
              src={currentUser.photoURL || 'https://via.placeholder.com/40'}
              alt={currentUser.displayName || 'User'}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
            />
            {isExpanded && (
              <div className="overflow-hidden">
                <h3 className="font-semibold text-gray-800 truncate">
                  {currentUser.displayName || 'Anonymous'}
                </h3>
                <p className="text-sm text-gray-500 truncate">{currentUser.email}</p>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="text-xl" />
              {isExpanded && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="text-xl" />
            {isExpanded && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile Bottom Navigation
  const MobileNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              location.pathname === item.path
                ? 'text-primary'
                : 'text-gray-500 hover:text-primary'
            }`}
          >
            <item.icon className="text-xl mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  // Floating Create Post Button
  const FloatingCreateButton = () => (
    <Link
      to="/create"
      className="fixed right-4 bottom-20 md:right-8 md:bottom-8 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-dark transition-colors z-50"
    >
      <FaPlus className="text-xl" />
    </Link>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileNavigation />
      <FloatingCreateButton />
    </>
  );
};

export default SidebarNavigation;