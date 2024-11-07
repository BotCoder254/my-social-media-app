import { motion } from 'framer-motion';

const LoadingAnimation = ({ className = 'w-20 h-20' }) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
      />
    </div>
  );
};

export default LoadingAnimation; 