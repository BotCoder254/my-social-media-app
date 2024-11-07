import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';

const BackNavigation = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      whileHover={{ scale: 1.05, x: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/')}
      className="fixed top-6 left-6 z-50 flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md"
    >
      <FaArrowLeft className="text-lg" />
      <span className="font-medium">Back to Home</span>
    </motion.button>
  );
};

export default BackNavigation; 