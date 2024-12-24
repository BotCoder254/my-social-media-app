import { useState, useRef, useEffect } from 'react';

import { motion } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';

import { FaCamera, FaEdit, FaUserCircle, FaMapMarkerAlt, FaBriefcase, FaGlobe } from 'react-icons/fa';

import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';

import { storage, db } from '../firebase/config';

import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc, collection, query, where, orderBy, getDocs, limit, startAfter, onSnapshot, writeBatch } from 'firebase/firestore';

import { useParams, useNavigate } from 'react-router-dom';

import { auth } from '../firebase/config';

import Post from './Post';

import InfiniteScroll from 'react-infinite-scroll-component';

import LoadingAnimation from './common/LoadingAnimation';

import { updateProfile } from 'firebase/auth';



const POSTS_PER_PAGE = 5;

const Profile = () => {

  const { currentUser, updateUserProfile } = useAuth();

  const [editing, setEditing] = useState(false);

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');

  const [bio, setBio] = useState('');

  const [location, setLocation] = useState('');

  const [occupation, setOccupation] = useState('');

  const [website, setWebsite] = useState('');

  const [loading, setLoading] = useState(false);

  const [userProfile, setUserProfile] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);

  const [followingCount, setFollowingCount] = useState(0);

  const [posts, setPosts] = useState([]);

  const [isEditMode, setIsEditMode] = useState(false);

  const fileInputRef = useRef();

  const { userId } = useParams();

  const navigate = useNavigate();

  const [lastVisible, setLastVisible] = useState(null);

  const [hasMore, setHasMore] = useState(true);

  const [coverPhoto, setCoverPhoto] = useState('');

  const coverPhotoRef = useRef();

  const [showSuccess, setShowSuccess] = useState(false);

  const lastPostRef = useRef(null);

  const handleDeletePost = () => {};
  const handleEditPost = () => {};



  // If no userId is provided, use currentUser's ID

  const profileId = userId || currentUser?.uid;

  const isOwnProfile = currentUser?.uid === profileId;



  useEffect(() => {

    const fetchUserProfile = async () => {
      if (!profileId) return;

      try {
        setLoading(true);
        setPosts([]);
        setHasMore(true);

        // Fetch user profile
        const userDocRef = doc(db, 'users', profileId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile(userData);
          setIsFollowing(userData.followers?.includes(currentUser?.uid));
          setFollowersCount(userData.followers?.length || 0);
          setFollowingCount(userData.following?.length || 0);
          setCoverPhoto(userData.coverPhoto || '');
          
          if (isOwnProfile) {
            setBio(userData.bio || '');
            setLocation(userData.location || '');
            setOccupation(userData.occupation || '');
            setWebsite(userData.website || '');
            setDisplayName(userData.displayName || '');
          }
        }

        // Fetch all posts first to ensure we have data
        const allPostsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', profileId)
        );

        const allPostsSnapshot = await getDocs(allPostsQuery);

        if (!allPostsSnapshot.empty) {
          // Sort posts by createdAt
          const allPosts = allPostsSnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date()
            }))
            .sort((a, b) => b.createdAt - a.createdAt);

          // Take first POSTS_PER_PAGE posts
          const initialPosts = allPosts.slice(0, POSTS_PER_PAGE);
          setPosts(initialPosts);
          
          // Set lastVisible to the last post in initial batch
          if (initialPosts.length === POSTS_PER_PAGE) {
            const lastPost = allPosts[POSTS_PER_PAGE - 1];
            const lastPostDoc = allPostsSnapshot.docs.find(doc => doc.id === lastPost.id);
            setLastVisible(lastPostDoc);
            setHasMore(allPosts.length > POSTS_PER_PAGE);
          } else {
            setHasMore(false);
          }
        } else {
          setPosts([]);
          setHasMore(false);
        }

        setLoading(false);

        // Set up real-time listener for new posts
        const realtimeQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', profileId),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(realtimeQuery, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const newPost = {
                id: change.doc.id,
                ...change.doc.data(),
                createdAt: change.doc.data().createdAt?.toDate() || new Date()
              };
              
              setPosts(prevPosts => {
                if (prevPosts.some(post => post.id === newPost.id)) {
                  return prevPosts;
                }
                const updatedPosts = [newPost, ...prevPosts];
                return updatedPosts.sort((a, b) => b.createdAt - a.createdAt);
              });
            } else if (change.type === 'modified') {
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === change.doc.id 
                    ? {
                        ...post,
                        ...change.doc.data(),
                        createdAt: change.doc.data().createdAt?.toDate() || post.createdAt
                      }
                    : post
                )
              );
            } else if (change.type === 'removed') {
              setPosts(prevPosts => prevPosts.filter(post => post.id !== change.doc.id));
            }
          });
        });

        return () => {
          unsubscribe();
        };

      } catch (error) {
        console.error('Error fetching user profile and posts:', error);
        setLoading(false);
        setPosts([]);
        setHasMore(false);
      }
    };

    fetchUserProfile();
  }, [profileId, currentUser?.uid, isOwnProfile]);

  const loadMorePosts = async () => {
    if (!lastVisible || !hasMore || loading) return;

    try {
      setLoading(true);

      // Fetch all remaining posts
      const remainingPostsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', profileId),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(POSTS_PER_PAGE)
      );

      const querySnapshot = await getDocs(remainingPostsQuery);
      
      if (!querySnapshot.empty) {
        const newPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          const allPosts = [...prevPosts, ...uniqueNewPosts];
          return allPosts.sort((a, b) => b.createdAt - a.createdAt);
        });

        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.docs.length === POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };



  const handleImageChange = async (e) => {

    const file = e.target.files[0];

    if (file) {

      if (file.size > 5 * 1024 * 1024) { // 5MB limit

        alert('File size should be less than 5MB');

        return;

      }



      setLoading(true);

      try {

        // Create a unique filename

        const filename = `${Date.now()}_${file.name}`;

        const imageRef = ref(storage, `profiles/${currentUser.uid}/${filename}`);

        

        // Upload file

        const uploadTask = uploadBytesResumable(imageRef, file);

        

        // Monitor upload progress

        uploadTask.on('state_changed', 

          (snapshot) => {

            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

            console.log('Upload progress:', progress);

          },

          (error) => {

            console.error('Error uploading file:', error);

          }

        );

        

        // Wait for upload to complete

        await uploadTask;

        

        // Get download URL

        const photoURL = await getDownloadURL(imageRef);

        

        // Update auth profile

        await updateProfile(auth.currentUser, {

          photoURL: photoURL

        });

        

        // Update user document

        const userRef = doc(db, 'users', currentUser.uid);

        await updateDoc(userRef, {

          photoURL: photoURL

        });

        

        // Update posts with new photo URL

        const postsQuery = query(

          collection(db, 'posts'),

          where('authorId', '==', currentUser.uid)

        );

        

        const postsSnapshot = await getDocs(postsQuery);

        const batch = writeBatch(db);

        

        postsSnapshot.docs.forEach((doc) => {

          batch.update(doc.ref, {

            authorPhotoURL: photoURL

          });

        });

        

        await batch.commit();

        

        // Show success message

        setShowSuccess(true);

        setTimeout(() => setShowSuccess(false), 3000);

      } catch (error) {

        console.error('Error updating profile picture:', error);

      }

      setLoading(false);

    }

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      await updateUserProfile(displayName, currentUser.photoURL);

      

      // Update user document in Firestore

      const userRef = doc(db, 'users', currentUser.uid);

      await updateDoc(userRef, {

        displayName,

        bio,

        location,

        occupation,

        website

      });

      

      setEditing(false);

    } catch (error) {

      console.error('Error updating profile:', error);

    }

    setLoading(false);

  };



  const handleFollowToggle = async () => {

    if (isOwnProfile) return; // Prevent following self

    

    const userRef = doc(db, 'users', profileId);

    const currentUserRef = doc(db, 'users', currentUser.uid);



    try {

      if (isFollowing) {

        await updateDoc(userRef, {

          followers: arrayRemove(currentUser.uid)

        });

        await updateDoc(currentUserRef, {

          following: arrayRemove(profileId)

        });

        setFollowersCount(prev => prev - 1);

      } else {

        await updateDoc(userRef, {

          followers: arrayUnion(currentUser.uid)

        });

        await updateDoc(currentUserRef, {

          following: arrayUnion(profileId)

        });

        setFollowersCount(prev => prev + 1);

      }

      setIsFollowing(!isFollowing);

    } catch (error) {

      console.error('Error updating follow status:', error);

    }

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

  const handleCoverPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      try {
        const imageRef = ref(storage, `covers/${currentUser.uid}/${file.name}`);
        await uploadBytes(imageRef, file);
        const coverPhotoURL = await getDownloadURL(imageRef);
        
        // Update user document in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          coverPhoto: coverPhotoURL
        });
        setCoverPhoto(coverPhotoURL);
      } catch (error) {
        console.error('Error updating cover photo:', error);
      }
      setLoading(false);
    }
  };



  if (!userProfile) {

    return (

      <div className="flex justify-center items-center h-screen">

        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>

      </div>

    );

  }



  return (

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Cover Photo */}

      <div className="relative h-64 rounded-xl overflow-hidden group">

        <div 

          className="absolute inset-0 bg-cover bg-center bg-no-repeat"

          style={{ 

            backgroundImage: `url(${coverPhoto || 'https://source.unsplash.com/random/1200x400/?landscape'})` 

          }}

        >

          <div className="absolute inset-0 bg-black/20"></div>

        </div>

        {isOwnProfile && (

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">

            <motion.button

              whileHover={{ scale: 1.1 }}

              whileTap={{ scale: 0.9 }}

              onClick={() => coverPhotoRef.current.click()}

              className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg"

            >

              Change Cover Photo

            </motion.button>

            <input

              type="file"

              ref={coverPhotoRef}

              onChange={handleCoverPhotoChange}

              accept="image/*"

              className="hidden"

            />

          </div>

        )}

      </div>



      {/* Profile Content */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-24 pb-12">
          {/* Profile Picture and Basic Info */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Profile Picture */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white bg-gray-200">
                  {userProfile?.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="w-full h-full text-gray-400" />
                  )}
                </div>
                {isOwnProfile && (
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 cursor-pointer shadow-md">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <FaCamera className="text-gray-600 text-lg sm:text-xl hover:text-gray-800" />
                  </label>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 w-full text-center sm:text-left space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-4 sm:mb-0 space-y-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">
                      {displayName || 'Anonymous'}
                    </h1>
                    {!isOwnProfile && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleFollowToggle}
                        className="w-full sm:w-auto mt-2 px-4 sm:px-6 py-2 rounded-full text-sm font-semibold"
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </motion.button>
                    )}
                  </div>
                  {isOwnProfile && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setEditing(!editing)}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FaEdit className="mr-2" />
                      {editing ? 'Cancel' : 'Edit Profile'}
                    </motion.button>
                  )}
                </div>

                {editing ? (
                  <form onSubmit={handleSubmit} className="space-y-4 w-full">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Display Name</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          placeholder="Your display name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          rows="3"
                          placeholder="Tell us about yourself"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700">Location</label>
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaMapMarkerAlt className="text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="w-full pl-10 rounded-md border-gray-300 focus:border-primary focus:ring-primary"
                              placeholder="Your location"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700">Occupation</label>
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaBriefcase className="text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={occupation}
                              onChange={(e) => setOccupation(e.target.value)}
                              className="w-full pl-10 rounded-md border-gray-300 focus:border-primary focus:ring-primary"
                              placeholder="Your occupation"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setEditing(false)}
                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </motion.button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <FaMapMarkerAlt className="flex-shrink-0" />
                        <span className="truncate">{location || 'Add location'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <FaBriefcase className="flex-shrink-0" />
                        <span className="truncate">{occupation || 'Add occupation'}</span>
                      </div>
                    </div>

                    <div className="prose max-w-none">
                      <p className="text-gray-600 break-words">{bio || 'Add a bio to tell people about yourself'}</p>
                    </div>

                    {website && (
                      <div className="flex items-center space-x-2 text-primary">
                        <FaGlobe className="flex-shrink-0" />
                        <a 
                          href={website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:underline truncate"
                        >
                          {website}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{followersCount}</div>
                <div className="text-xs sm:text-sm text-gray-500">Followers</div>
              </div>
              <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{followingCount}</div>
                <div className="text-xs sm:text-sm text-gray-500">Following</div>
              </div>
              <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{posts.length}</div>
                <div className="text-xs sm:text-sm text-gray-500">Posts</div>
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="mt-6 sm:mt-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Posts</h2>
            <div className="space-y-4">
              {loading && posts.length === 0 ? (
                <div className="flex justify-center p-4">
                  <LoadingAnimation />
                </div>
              ) : posts.length > 0 ? (
                <InfiniteScroll
                  dataLength={posts.length}
                  next={loadMorePosts}
                  hasMore={hasMore}
                  loader={
                    <div className="flex justify-center p-4">
                      <LoadingAnimation />
                    </div>
                  }
                  endMessage={
                    <p className="text-center text-gray-500 py-4">
                      No more posts to show
                    </p>
                  }
                >
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <Post
                        key={post.id}
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                        onDelete={isOwnProfile ? handleDeletePost : undefined}
                        onEdit={isOwnProfile ? handleEditPost : undefined}
                      />
                    ))}
                  </div>
                </InfiniteScroll>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSuccess && (

        <motion.div

          initial={{ opacity: 0, y: -50 }}

          animate={{ opacity: 1, y: 0 }}

          exit={{ opacity: 0, y: -50 }}

          className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"

        >

          Profile updated successfully!

        </motion.div>

      )}

    </div>

  );

};



export default Profile; 
