import { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { FaHeart, FaRegHeart, FaComment, FaShare, FaEllipsisV, FaFileAlt, FaBookmark, FaRegBookmark } from 'react-icons/fa';

import { formatDistanceToNow } from 'date-fns';

import { useAuth } from '../contexts/AuthContext';

import { Link } from 'react-router-dom';

import InfiniteScroll from 'react-infinite-scroll-component';

import LoadingAnimation from './common/LoadingAnimation';

import { db, storage } from '../firebase/config';

import { doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';



const Post = ({ post, onLike, onComment, onDelete, onEdit, onBookmark }) => {

  const { currentUser } = useAuth();

  const [showComments, setShowComments] = useState(false);

  const [comment, setComment] = useState('');

  const [showOptions, setShowOptions] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [editedContent, setEditedContent] = useState(post.content);

  const [isBookmarked, setIsBookmarked] = useState(false);

  const [showShareSuccess, setShowShareSuccess] = useState(false);

  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);

  const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);

  const [showSuccess, setShowSuccess] = useState(false);



  const hasLiked = post.likes?.includes(currentUser.uid);

  const isAuthor = post.authorId === currentUser.uid;



  const handleSubmitComment = (e) => {

    e.preventDefault();

    if (comment.trim()) {

      onComment(post.id, comment);

      setComment('');

    }

  };



  const handleVote = async (optionIndex) => {

    const postRef = doc(db, 'posts', post.id);

    const hasVoted = post.pollOptions.some(option => 

      option.votes.includes(currentUser.uid)

    );



    if (!hasVoted) {

      try {

        const updatedOptions = [...post.pollOptions];

        updatedOptions[optionIndex].votes.push(currentUser.uid);

        

        await updateDoc(postRef, {

          pollOptions: updatedOptions

        });

      } catch (error) {

        console.error('Error voting on poll:', error);

      }

    }

  };



  const handleEdit = async () => {

    if (editedContent.trim() === post.content) {

      setIsEditing(false);

      return;

    }



    await onEdit(post.id, editedContent);

    setIsEditing(false);

  };



  const handleBookmark = async () => {

    try {

      await onBookmark(post.id);

      setIsBookmarked(!isBookmarked);

    } catch (error) {

      console.error('Error bookmarking post:', error);

    }

  };



  const handleShare = async () => {

    try {

      const postUrl = `${window.location.origin}/post/${post.id}`;

      await navigator.clipboard.writeText(postUrl);

      setShowShareSuccess(true);

      setTimeout(() => setShowShareSuccess(false), 2000);

    } catch (error) {

      console.error('Error sharing post:', error);

    }

  };



  const handleDelete = async () => {

    if (window.confirm('Are you sure you want to delete this post?')) {

      try {

        // Delete media if exists

        if (post.mediaURL) {

          const mediaRef = ref(storage, post.mediaURL);

          await deleteObject(mediaRef);

        }

        

        // Delete post document

        await deleteDoc(doc(db, 'posts', post.id));

        

        // Show success notification

        setShowSuccess(true);

        setTimeout(() => setShowSuccess(false), 3000);

      } catch (error) {

        console.error('Error deleting post:', error);

      }

    }

  };



  useEffect(() => {

    const postRef = doc(db, 'posts', post.id);

    const unsubscribe = onSnapshot(postRef, (doc) => {

      if (doc.exists()) {

        const postData = doc.data();

        setLikesCount(postData.likes?.length || 0);

        setCommentsCount(postData.comments?.length || 0);

      }

    });



    return () => unsubscribe();

  }, [post.id]);



  const renderOptionsMenu = () => (

    <AnimatePresence>

      {showOptions && (

        <motion.div

          initial={{ opacity: 0, scale: 0.95 }}

          animate={{ opacity: 1, scale: 1 }}

          exit={{ opacity: 0, scale: 0.95 }}

          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10"

        >

          {isAuthor && (

            <>

              <button

                onClick={() => {

                  setIsEditing(true);

                  setShowOptions(false);

                }}

                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"

              >

                Edit Post

              </button>

              <button

                onClick={handleDelete}

                className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500"

              >

                Delete Post

              </button>

            </>

          )}

          <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">

            Report Post

          </button>

        </motion.div>

      )}

    </AnimatePresence>

  );



  const renderContent = () => {

    if (isEditing) {

      return (

        <div className="px-4 py-2">

          <textarea

            value={editedContent}

            onChange={(e) => setEditedContent(e.target.value)}

            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"

            rows={4}

          />

          <div className="flex justify-end space-x-2 mt-2">

            <button

              onClick={() => {

                setEditedContent(post.content);

                setIsEditing(false);

              }}

              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"

            >

              Cancel

            </button>

            <button

              onClick={handleEdit}

              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"

            >

              Save

            </button>

          </div>

        </div>

      );

    }



    return (

      <div className="px-4 py-2">

        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>

        {post.editedAt && (

          <p className="text-xs text-gray-500 mt-1">

            (edited {formatDistanceToNow(post.editedAt.toDate(), { addSuffix: true })})

          </p>

        )}

        {post.imageURL && (

          <motion.img

            whileHover={{ scale: 1.02 }}

            src={post.imageURL}

            alt="Post content"

            className="mt-3 rounded-lg w-full object-cover max-h-96"

          />

        )}

        {post.pollOptions && post.pollOptions.length > 0 && (

          <div className="mt-4 space-y-2">

            {post.pollOptions.map((option, index) => {

              const totalVotes = post.pollOptions.reduce((sum, opt) => 

                sum + opt.votes.length, 0

              );

              const votePercentage = totalVotes === 0 ? 0 : 

                (option.votes.length / totalVotes) * 100;

              const hasVoted = option.votes.includes(currentUser.uid);



              return (

                <button

                  key={index}

                  onClick={() => handleVote(index)}

                  disabled={post.pollOptions.some(opt => 

                    opt.votes.includes(currentUser.uid)

                  )}

                  className={`w-full relative ${

                    hasVoted ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'

                  } rounded-lg p-3 text-left transition-colors`}

                >

                  <div className="relative z-10">

                    <span>{option.text}</span>

                    <span className="float-right">{Math.round(votePercentage)}%</span>

                  </div>

                  <div

                    className={`absolute top-0 left-0 h-full ${

                      hasVoted ? 'bg-primary-600' : 'bg-gray-200'

                    } rounded-lg transition-all`}

                    style={{ width: `${votePercentage}%`, opacity: 0.3 }}

                  />

                </button>

              );

            })}

            <p className="text-sm text-gray-500 mt-2">

              {post.pollOptions.reduce((sum, option) => 

                sum + option.votes.length, 0

              )} votes

            </p>

          </div>

        )}

        {post.feeling && (

          <p className="text-gray-600 text-sm mt-2">

            Feeling: {post.feeling}

          </p>

        )}

        {post.location && (

          <p className="text-gray-600 text-sm mt-2">

            📍 {post.location}

          </p>

        )}

        {post.tags && post.tags.length > 0 && (

          <div className="flex flex-wrap gap-2 mt-2">

            {post.tags.map((tag, index) => (

              <span

                key={index}

                className="text-primary text-sm hover:underline cursor-pointer"

              >

                #{tag}

              </span>

            ))}

          </div>

        )}

        {post.mediaURL && (

          post.mediaType === 'image' ? (

            <motion.img

              whileHover={{ scale: 1.02 }}

              src={post.mediaURL}

              alt="Post content"

              className="mt-3 rounded-lg w-full object-cover max-h-96"

            />

          ) : (

            <video

              src={post.mediaURL}

              controls

              className="mt-3 rounded-lg w-full max-h-96"

            />

          )

        )}

      </div>

    );

  };



  return (

    <motion.div

      layout

      className="bg-white rounded-xl shadow-md overflow-hidden"

    >

      {/* Post Header */}

      <div className="p-4 flex items-center justify-between">

        <div className="flex items-center space-x-3">

          <Link to={`/profile/${post.authorId}`}>

            <motion.img

              whileHover={{ scale: 1.1 }}

              src={post.authorPhotoURL || 'https://via.placeholder.com/40'}

              alt={post.authorName}

              className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"

            />

          </Link>

          <div>

            <Link 

              to={`/profile/${post.authorId}`}

              className="font-semibold text-gray-800 hover:text-primary transition-colors"

            >

              {post.authorName}

            </Link>

            <p className="text-sm text-gray-500">

              {post.createdAt?.toDate ? 

                formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })

                : 'Just now'

              }

            </p>

          </div>

        </div>

        <div className="relative">

          <motion.button

            whileHover={{ scale: 1.1 }}

            onClick={() => setShowOptions(!showOptions)}

            className="text-gray-500 hover:text-gray-700 p-2"

          >

            <FaEllipsisV />

          </motion.button>

          {renderOptionsMenu()}

        </div>

      </div>



      {/* Post Content */}

      {renderContent()}



      {/* Post Stats */}

      <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 border-t border-gray-100">

        <span>{likesCount} likes</span>

        <span>{commentsCount} comments</span>

      </div>



      {/* Action Buttons */}

      <div className="px-4 py-2 flex items-center justify-between border-t border-gray-100">

        <motion.button

          whileHover={{ scale: 1.1 }}

          whileTap={{ scale: 0.9 }}

          onClick={() => onLike(post.id)}

          className={`flex items-center space-x-2 ${

            hasLiked ? 'text-red-500' : 'text-gray-500'

          } hover:text-red-500 transition-colors p-2`}

        >

          {hasLiked ? <FaHeart className="text-xl" /> : <FaRegHeart className="text-xl" />}

          <span>Like</span>

        </motion.button>



        <motion.button

          whileHover={{ scale: 1.1 }}

          whileTap={{ scale: 0.9 }}

          onClick={() => setShowComments(!showComments)}

          className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors p-2"

        >

          <FaComment className="text-xl" />

          <span>Comment</span>

        </motion.button>



        <motion.button

          whileHover={{ scale: 1.1 }}

          whileTap={{ scale: 0.9 }}

          onClick={handleShare}

          className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors p-2"

        >

          <FaShare className="text-xl" />

          <span>Share</span>

        </motion.button>



        <motion.button

          whileHover={{ scale: 1.1 }}

          whileTap={{ scale: 0.9 }}

          onClick={handleBookmark}

          className={`flex items-center space-x-2 ${

            isBookmarked ? 'text-yellow-500' : 'text-gray-500'

          } hover:text-yellow-500 transition-colors p-2`}

        >

          {isBookmarked ? <FaBookmark className="text-xl" /> : <FaRegBookmark className="text-xl" />}

          <span>Bookmark</span>

        </motion.button>



        {/* Share Success Message */}

        <AnimatePresence>

          {showShareSuccess && (

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              exit={{ opacity: 0, y: -20 }}

              className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"

            >

              Link copied to clipboard!

            </motion.div>

          )}

        </AnimatePresence>

      </div>



      {/* Comments Section */}

      <AnimatePresence>

        {showComments && (

          <motion.div

            initial={{ height: 0, opacity: 0 }}

            animate={{ height: 'auto', opacity: 1 }}

            exit={{ height: 0, opacity: 0 }}

            className="border-t border-gray-100"

          >

            <div className="p-4">

              <form onSubmit={handleSubmitComment} className="mb-4">

                <div className="flex space-x-2">

                  <img

                    src={currentUser.photoURL || 'https://via.placeholder.com/40'}

                    alt="Your avatar"

                    className="w-8 h-8 rounded-full"

                  />

                  <input

                    type="text"

                    value={comment}

                    onChange={(e) => setComment(e.target.value)}

                    placeholder="Write a comment..."

                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"

                  />

                </div>

              </form>



              <div className="space-y-4">

                {post.comments?.map((comment, index) => (

                  <motion.div

                    key={index}

                    initial={{ opacity: 0, y: 20 }}

                    animate={{ opacity: 1, y: 0 }}

                    className="flex space-x-2"

                  >

                    <img

                      src={comment.authorPhotoURL || 'https://via.placeholder.com/32'}

                      alt={comment.authorName}

                      className="w-8 h-8 rounded-full"

                    />

                    <div className="flex-1 bg-gray-100 rounded-lg p-3">

                      <p className="font-semibold text-sm">{comment.authorName}</p>

                      <p className="text-sm text-gray-700">{comment.content}</p>

                    </div>

                  </motion.div>

                ))}

              </div>

            </div>

          </motion.div>

        )}

      </AnimatePresence>

      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
        >
          Post deleted successfully!
        </motion.div>
      )}

    </motion.div>

  );

};



export default Post; 
