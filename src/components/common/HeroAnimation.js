import { motion } from 'framer-motion';

const HeroAnimation = () => {
  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative w-full h-full"
    >
      <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-2xl">
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-32 h-32 bg-white/20 rounded-full"
          />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
    </motion.div>
  );
};

export default HeroAnimation; 