import { motion } from 'framer-motion';

const GradientBackground = ({ children, gradient, className = '' }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className={`absolute inset-0 ${gradient}`}
      />
      <div className="relative z-10">{children}</div>
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
    </div>
  );
};

export default GradientBackground; 