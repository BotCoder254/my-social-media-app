import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lottie from 'lottie-react';
import { 
  FaRocket, 
  FaUserFriends, 
  FaComments, 
  FaHeart,
  FaShieldAlt,
  FaMobileAlt,
  FaGlobe,
  FaArrowRight,
  FaChevronDown
} from 'react-icons/fa';
import HeroAnimation from './common/HeroAnimation';
import LoadingAnimation from './common/LoadingAnimation';
import { GRADIENTS, PLACEHOLDER_IMAGES } from '../animations/constants';
import LandingNavigation from './common/LandingNavigation';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef(null);
  const featuresRef = useRef(null);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [1, 0]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation items
  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' }
  ];

  // Features data
  const features = [
    {
      icon: <FaUserFriends className="text-4xl text-primary" />,
      title: "Connect with Friends",
      description: "Build meaningful connections with people around the world"
    },
    {
      icon: <FaComments className="text-4xl text-primary" />,
      title: "Share Your Thoughts",
      description: "Express yourself and engage in conversations that matter"
    },
    {
      icon: <FaHeart className="text-4xl text-primary" />,
      title: "Spread Love",
      description: "Like and comment on posts that inspire you"
    },
    {
      icon: <FaRocket className="text-4xl text-primary" />,
      title: "Grow Together",
      description: "Join communities and grow with like-minded people"
    }
  ];

  return (
    <div className="min-h-screen">
      <LandingNavigation />
      {/* Hero Section */}
      <div className={`relative min-h-screen flex items-center justify-center ${GRADIENTS.HERO} overflow-hidden`}>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ x: -100 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Connect. Share. <br/>
                <span className="text-primary-200">Make an Impact.</span>
              </h1>
              <p className="text-xl text-primary-100 mb-8 max-w-lg">
                Join our vibrant community where ideas flourish and connections grow. 
                Share your story with the world.
              </p>
              <div className="flex flex-wrap gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to="/signup" 
                    className="inline-flex items-center px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                  >
                    Get Started <FaArrowRight className="ml-2" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ x: 100 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.8 }}
              className="hidden lg:block"
            >
              <HeroAnimation />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section with Parallax */}
      <div 
        ref={featuresRef}
        className="py-24 bg-white relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience a social platform designed with you in mind
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`feature-card group ${GRADIENTS.CARD}`}
              >
                <div className="relative p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  <div className="mb-4 bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <FaShieldAlt className="text-5xl text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
              <p className="text-gray-600">Your data is protected with enterprise-grade security</p>
            </div>
            <div className="text-center">
              <FaMobileAlt className="text-5xl text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Mobile Ready</h3>
              <p className="text-gray-600">Access your account from any device, anywhere</p>
            </div>
            <div className="text-center">
              <FaGlobe className="text-5xl text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Global Community</h3>
              <p className="text-gray-600">Connect with people from around the world</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already part of our community
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              to="/signup" 
              className="inline-flex items-center px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Create Free Account <FaArrowRight className="ml-2" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;