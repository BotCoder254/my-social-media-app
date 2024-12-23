import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight, FaUsers, FaShareAlt, FaComments, FaHeart } from 'react-icons/fa';
import LandingNavigation from './common/LandingNavigation';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A1A2F] text-white">
      <LandingNavigation isScrolled={isScrolled} />
      
      {/* Hero Section */}
      <div className="relative min-h-[90vh] flex items-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4ADE80]/10 to-transparent opacity-50" />
        
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-6xl font-bold leading-tight"
              >
                Connect with
                <span className="text-[#4ADE80] block mt-2">Social App</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg text-gray-300 max-w-xl"
              >
                Share your moments, connect with friends, and be part of a vibrant community. Your social journey starts here.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-wrap gap-4"
              >
                <Link 
                  to="/signup" 
                  className="inline-flex items-center px-8 py-3 bg-[#4ADE80] text-[#0A1A2F] rounded-lg font-semibold hover:bg-[#3AA76B] transition-colors"
                >
                  Get Started
                  <FaArrowRight className="ml-2" />
                </Link>
                <Link 
                  to="/login" 
                  className="inline-flex items-center px-8 py-3 border border-[#4ADE80] text-[#4ADE80] rounded-lg font-semibold hover:bg-[#4ADE80] hover:text-[#0A1A2F] transition-colors"
                >
                  Login
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-800"
              >
                <div>
                  <h4 className="text-3xl font-bold text-[#4ADE80]">1M+</h4>
                  <p className="text-gray-400">Active Users</p>
                </div>
                <div>
                  <h4 className="text-3xl font-bold text-[#4ADE80]">100K+</h4>
                  <p className="text-gray-400">Daily Posts</p>
                </div>
                <div>
                  <h4 className="text-3xl font-bold text-[#4ADE80]">50+</h4>
                  <p className="text-gray-400">Countries</p>
                </div>
              </motion.div>
            </div>

            {/* Right Content - Interactive Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="hidden lg:flex justify-center items-center"
            >
              <div className="relative w-full max-w-2xl aspect-square bg-gradient-to-br from-[#4ADE80]/20 to-[#0A1A2F] rounded-full p-8">
                {/* Central Icon */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <FaUsers className="w-24 h-24 text-[#4ADE80]" />
                </div>
                
                {/* Orbiting Icons */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <FaShareAlt className="w-12 h-12 text-[#4ADE80]" />
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                    <FaComments className="w-12 h-12 text-[#4ADE80]" />
                  </div>
                  <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <FaHeart className="w-12 h-12 text-[#4ADE80]" />
                  </div>
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                    <FaUsers className="w-12 h-12 text-[#4ADE80]" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#0A1A2F] to-transparent" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[#4ADE80] rounded-full filter blur-[150px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-[#4ADE80] rounded-full filter blur-[150px] opacity-10" />
      </div>
    </div>
  );
};

export default LandingPage;