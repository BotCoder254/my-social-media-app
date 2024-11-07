import Lottie from 'lottie-react';
import { motion } from 'framer-motion';
import { LOTTIE_ANIMATIONS } from '../../animations/constants';

const FeatureAnimation = ({ animationKey, className }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Lottie
        animationData={LOTTIE_ANIMATIONS[animationKey]}
        loop={true}
        autoplay={true}
      />
    </motion.div>
  );
};

export default FeatureAnimation; 