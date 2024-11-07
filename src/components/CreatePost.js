import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaImage, 
  FaVideo, 
  FaSmile, 
  FaTimes, 
  FaHashtag,
  FaPoll,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaPlus
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import LoadingAnimation from './common/LoadingAnimation';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const UploadProgressBar = ({ progress }) => {
  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        className="h-1 bg-primary"
        style={{
          transition: 'width 0.3s ease-in-out'
        }}
      />
    </div>
  );
};

const CreatePost = ({ onCreatePost }) => {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [feeling, setFeeling] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState([]);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [scheduledDate, setScheduledDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const fileInputRef = useRef();
  const videoInputRef = useRef();
  const contentRef = useRef();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleMediaChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size should be less than 10MB');
        return;
      }
      setMedia(file);
      setMediaType(type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setIsExpanded(true);
    }
  };

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const cursorPosition = contentRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPosition);
    const textAfterCursor = content.slice(cursorPosition);
    setContent(textBeforeCursor + emoji + textAfterCursor);
    setShowEmojiPicker(false);
  };

  const handleAddTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim() || media) {
      setIsUploading(true);
      try {
        const postData = {
          content,
          feeling,
          location,
          tags,
          pollOptions: showPollCreator ? pollOptions.filter(opt => opt.trim()) : [],
          scheduledDate: scheduledDate ? scheduledDate.toISOString() : null
        };

        await onCreatePost(postData, media, mediaType, setUploadProgress);
        
        // Show success message
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        // Reset form
        setContent('');
        setMedia(null);
        setMediaPreview(null);
        setIsExpanded(false);
        setFeeling('');
        setLocation('');
        setTags([]);
        setPollOptions(['', '']);
        setScheduledDate(null);
        setShowPollCreator(false);
        setUploadProgress(0);
      } catch (error) {
        console.error('Error creating post:', error);
      }
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Progress Bar */}
      {isUploading && <UploadProgressBar progress={uploadProgress} />}

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            Post created successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        className="bg-white rounded-xl shadow-md p-4 relative"
      >
        {isUploading && (
          <div className="absolute inset-0 bg-black/10 rounded-xl flex items-center justify-center z-40">
            <div className="text-center text-primary">
              <p className="mt-2 font-medium">Creating post...</p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <motion.img
            whileHover={{ scale: 1.05 }}
            src={currentUser.photoURL || 'https://via.placeholder.com/40'}
            alt={currentUser.displayName}
            className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
          />
          <div className="flex-grow">
            <motion.div
              onClick={() => setIsExpanded(true)}
              className={`bg-gray-50 rounded-full cursor-pointer hover:bg-gray-100 transition-colors ${
                isExpanded ? 'rounded-lg' : ''
              }`}
            >
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className={`w-full bg-transparent px-4 py-2 resize-none focus:outline-none ${
                  isExpanded ? 'min-h-[120px] rounded-lg' : 'rounded-full'
                }`}
                rows={isExpanded ? 3 : 1}
              />
            </motion.div>

            {/* Media Preview */}
            <AnimatePresence>
              {mediaPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative mt-4 group"
                >
                  {mediaType === 'image' ? (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="rounded-lg max-h-60 w-full object-cover"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      controls
                      className="rounded-lg max-h-60 w-full"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setMedia(null);
                        setMediaPreview(null);
                        setMediaType(null);
                      }}
                      className="bg-red-500 text-white p-2 rounded-full"
                    >
                      <FaTimes />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tags Display */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <motion.span
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-primary-100 text-primary px-2 py-1 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>#{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </motion.span>
                ))}
              </div>
            )}

            {/* Poll Creator */}
            {showPollCreator && (
              <div className="mt-4 space-y-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handlePollOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 bg-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                    />
                    {index > 1 && (
                      <button
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-600"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button
                    onClick={handleAddPollOption}
                    className="text-primary hover:text-primary-600 flex items-center space-x-1"
                  >
                    <FaPlus className="text-sm" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>
            )}

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current.click()}
                        className="flex items-center space-x-2 text-gray-500 hover:text-primary px-3 py-1.5 rounded-full hover:bg-gray-100"
                      >
                        <FaImage className="text-lg" />
                        <span className="text-sm">Photo</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => videoInputRef.current.click()}
                        className="flex items-center space-x-2 text-gray-500 hover:text-primary px-3 py-1.5 rounded-full hover:bg-gray-100"
                      >
                        <FaVideo className="text-lg" />
                        <span className="text-sm">Video</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-primary px-3 py-1.5 rounded-full hover:bg-gray-100"
                      >
                        <FaSmile className="text-lg" />
                        <span className="text-sm">Feeling</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const location = prompt('Enter location:');
                          if (location) setLocation(location);
                        }}
                        className="flex items-center space-x-2 text-gray-500 hover:text-primary px-3 py-1.5 rounded-full hover:bg-gray-100"
                      >
                        <FaMapMarkerAlt className="text-lg" />
                        <span className="text-sm">Location</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const tag = prompt('Enter tag (without #):');
                          if (tag) handleAddTag(tag);
                        }}
                        className="flex items-center space-x-2 text-gray-500 hover:text-primary px-3 py-1.5 rounded-full hover:bg-gray-100"
                      >
                        <FaHashtag className="text-lg" />
                        <span className="text-sm">Tags</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPollCreator(!showPollCreator)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-primary px-3 py-1.5 rounded-full hover:bg-gray-100"
                      >
                        <FaPoll className="text-lg" />
                        <span className="text-sm">Poll</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-primary px-3 py-1.5 rounded-full hover:bg-gray-100"
                      >
                        <FaCalendarAlt className="text-lg" />
                        <span className="text-sm">Schedule</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute z-50 mt-2">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}

                  {/* Date Picker */}
                  {showDatePicker && (
                    <div className="mt-2">
                      <DatePicker
                        selected={scheduledDate}
                        onChange={(date) => setScheduledDate(date)}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                        minDate={new Date()}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholderText="Select date and time"
                      />
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex justify-end mt-4 space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsExpanded(false);
                        setShowEmojiPicker(false);
                        setShowPollCreator(false);
                        setShowDatePicker(false);
                      }}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmit}
                      disabled={!content.trim() && !media}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleMediaChange(e, 'image')}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={videoInputRef}
          onChange={(e) => handleMediaChange(e, 'video')}
          accept="video/*"
          className="hidden"
        />
      </motion.div>
    </>
  );
};

export default CreatePost; 