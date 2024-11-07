import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FaHome, FaUser, FaBell, FaSignOutAlt } from 'react-icons/fa';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/feed" className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-primary font-bold text-xl"
              >
                SocialApp
              </motion.div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <motion.div whileHover={{ scale: 1.1 }}>
              <Link
                to="/feed"
                className="text-gray-600 hover:text-primary p-2 rounded-full hover:bg-gray-100"
              >
                <FaHome className="text-xl" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }}>
              <button className="text-gray-600 hover:text-primary p-2 rounded-full hover:bg-gray-100">
                <FaBell className="text-xl" />
              </button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }}>
              <Link
                to="/profile"
                className="text-gray-600 hover:text-primary p-2 rounded-full hover:bg-gray-100"
              >
                <FaUser className="text-xl" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex items-center"
            >
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-primary p-2 rounded-full hover:bg-gray-100"
              >
                <FaSignOutAlt className="text-xl" />
              </button>
            </motion.div>

            <div className="flex items-center">
              <img
                src={currentUser?.photoURL || 'https://via.placeholder.com/40'}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 