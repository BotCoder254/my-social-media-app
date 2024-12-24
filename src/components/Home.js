import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove, serverTimestamp, where, limit, startAfter, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Post from './Post';
import CreatePost from './CreatePost';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingAnimation from './common/LoadingAnimation';
import { FaFilter, FaTimes, FaSpinner } from 'react-icons/fa';

const POSTS_PER_PAGE = 5;

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('recent');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastPostRef = useRef(null);
  const { currentUser } = useAuth();
  const observer = useRef();

  // Infinite scroll observer setup
  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMorePosts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadingMore]);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    let q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(POSTS_PER_PAGE)
    );

    if (filter === 'trending') {
      q = query(
        collection(db, 'posts'),
        orderBy('likes', 'desc'),
        limit(POSTS_PER_PAGE)
      );
    } else if (filter === 'following') {
      q = query(
        collection(db, 'posts'),
        where('authorId', 'in', [...(currentUser.following || []), currentUser.uid]),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE)
      );
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
      lastPostRef.current = snapshot.docs[snapshot.docs.length - 1];
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter, currentUser]);

  const loadMorePosts = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    let q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      startAfter(lastPostRef.current),
      limit(POSTS_PER_PAGE)
    );

    if (filter === 'trending') {
      q = query(
        collection(db, 'posts'),
        orderBy('likes', 'desc'),
        startAfter(lastPostRef.current),
        limit(POSTS_PER_PAGE)
      );
    } else if (filter === 'following') {
      if (!currentUser.following?.length) {
        q = query(
          collection(db, 'posts'),
          where('authorId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastPostRef.current),
          limit(POSTS_PER_PAGE)
        );
      } else {
        q = query(
          collection(db, 'posts'),
          where('authorId', 'in', [...(currentUser.following || []), currentUser.uid]),
          orderBy('createdAt', 'desc'),
          startAfter(lastPostRef.current),
          limit(POSTS_PER_PAGE)
        );
      }
    }

    try {
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const newPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPosts(prev => {
          // Filter out any duplicate posts
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
        
        lastPostRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCreatePost = async (postData, media, mediaType, setUploadProgress) => {
    try {
      let mediaURL = null;
      
      if (media) {
        const mediaRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}_${media.name}`);
        
        // Upload media
        const uploadTask = uploadBytesResumable(mediaRef, media);
        
        // Create promise to handle upload
        const uploadPromise = new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.min(90, progress));
            },
            (error) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            }
          );
        });

        mediaURL = await uploadPromise;
      }

      // Create post document
      const newPost = {
        content: postData.content,
        mediaURL,
        mediaType,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        authorPhotoURL: currentUser.photoURL,
        createdAt: serverTimestamp(),
        likes: [],
        comments: [],
        shares: 0,
        feeling: postData.feeling,
        location: postData.location,
        tags: postData.tags,
        pollOptions: postData.pollOptions?.map(option => ({
          text: option,
          votes: []
        })) || [],
        scheduledDate: postData.scheduledDate ? new Date(postData.scheduledDate) : null,
        status: postData.scheduledDate ? 'scheduled' : 'published'
      };

      const docRef = await addDoc(collection(db, 'posts'), newPost);
      setUploadProgress(100);

      // Add to state
      setPosts(prev => [{
        id: docRef.id,
        ...newPost,
        createdAt: new Date()
      }, ...prev]);

    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  const extractHashtags = (content) => {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    return content.match(hashtagRegex) || [];
  };

  const handleLike = async (postId) => {
    const postRef = doc(db, 'posts', postId);
    const hasLiked = posts.find(post => post.id === postId)?.likes?.includes(currentUser.uid);
    
    try {
      await updateDoc(postRef, {
        likes: hasLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
      });
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleComment = async (postId, commentContent) => {
    const postRef = doc(db, 'posts', postId);
    const newComment = {
      content: commentContent,
      authorId: currentUser.uid,
      authorName: currentUser.displayName || 'Anonymous',
      authorPhotoURL: currentUser.photoURL,
      createdAt: new Date().toISOString()
    };

    try {
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const post = posts.find(p => p.id === postId);
      
      // Delete media if exists
      if (post.mediaURL) {
        const mediaRef = ref(storage, post.mediaURL);
        await deleteObject(mediaRef);
      }
      
      // Delete post document
      await deleteDoc(doc(db, 'posts', postId));
      
      // Update state
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEditPost = async (postId, updatedContent) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        content: updatedContent,
        editedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleBookmark = async (postId) => {
    try {
      const bookmarkRef = doc(db, 'bookmarks', `${currentUser.uid}_${postId}`);
      const bookmarkDoc = await getDoc(bookmarkRef);
      
      if (bookmarkDoc.exists()) {
        // Remove bookmark
        await deleteDoc(bookmarkRef);
      } else {
        // Add bookmark
        await setDoc(bookmarkRef, {
          userId: currentUser.uid,
          postId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  return (
    <div className="space-y-6 overflow-y-auto h-full">
      <CreatePost onCreatePost={handleCreatePost} />
      
      {/* Filter Menu */}
      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <FaFilter className="text-gray-500" />
            <span className="capitalize">{filter}</span>
          </button>

          <AnimatePresence>
            {showFilterMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-12 left-0 bg-white rounded-lg shadow-lg py-2 w-48 z-10"
              >
                {['recent', 'trending', 'following'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setFilter(option);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                      filter === option ? 'text-primary' : 'text-gray-700'
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <LoadingAnimation />
        </div>
      ) : (
        <>
          <AnimatePresence>
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                ref={index === posts.length - 1 ? lastPostElementRef : null}
              >
                <Post
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  onDelete={handleDeletePost}
                  onEdit={handleEditPost}
                  onBookmark={handleBookmark}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {loadingMore && (
            <div className="flex justify-center py-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FaSpinner className="text-primary text-2xl" />
              </motion.div>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              No more posts to load
            </div>
          )}

          {posts.length === 0 && !loading && (
            <div className="text-center py-4 text-gray-500">
              No posts found. Be the first to post something!
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;