import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(-1)}
      className="absolute top-4 left-4 p-2 text-gray-600 hover:text-primary transition-colors flex items-center space-x-2"
    >
      <FaArrowLeft />
      <span>Back</span>
    </motion.button>
  );
};

export default BackButton; 