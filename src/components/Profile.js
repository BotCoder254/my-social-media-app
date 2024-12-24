import { useState, useRef, useEffect } from 'react';

import { motion } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';

import { FaCamera, FaEdit, FaUserCircle, FaMapMarkerAlt, FaBriefcase, FaGlobe } from 'react-icons/fa';

import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';

import { storage, db } from '../firebase/config';

import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc, collection, query, where, orderBy, getDocs, limit, startAfter, onSnapshot, writeBatch, serverTimestamp, deleteDoc } from 'firebase/firestore';

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

  const handleDeletePost = async (postId) => {
    try {
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const post = postDoc.data();
        
        // Delete media if exists
        if (post.mediaURL) {
          const mediaRef = ref(storage, post.mediaURL);
          await deleteObject(mediaRef);
        }
        
        // Delete post document
        await deleteDoc(postRef);
        
        // Update local state
        setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEditPost = async (postId, newContent) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        content: newContent,
        editedAt: serverTimestamp()
      });
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, content: newContent, editedAt: new Date() }
            : post
        )
      );
    } catch (error) {
      console.error('Error editing post:', error);
    }
  };

  const handleLike = async (postId) => {
    if (!currentUser) return;
    
    try {
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const post = postDoc.data();
        const likes = post.likes || [];
        const hasLiked = likes.includes(currentUser.uid);
        
        await updateDoc(postRef, {
          likes: hasLiked 
            ? arrayRemove(currentUser.uid)
            : arrayUnion(currentUser.uid)
        });
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleComment = async (postId, commentContent) => {
    if (!currentUser) return;
    
    try {
      const postRef = doc(db, 'posts', postId);
      const newComment = {
        id: Date.now().toString(),
        content: commentContent,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        authorPhotoURL: currentUser.photoURL,
        createdAt: serverTimestamp()
      };
      
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // If no userId is provided, use currentUser's ID

  const profileId = userId || currentUser?.uid;

  const isOwnProfile = currentUser?.uid === profileId;



  useEffect(() => {

    const fetchUserProfile = async () => {
      if (!profileId) return;

      try {
        setLoading(true);
        setPosts([]);

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

        // Fetch initial posts with pagination
        const postsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', profileId),
          orderBy('createdAt', 'desc'),
          limit(POSTS_PER_PAGE)
        );

        const postsSnapshot = await getDocs(postsQuery);
        const fetchedPosts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        setPosts(fetchedPosts);
        setLastVisible(postsSnapshot.docs[postsSnapshot.docs.length - 1]);
        setHasMore(postsSnapshot.docs.length === POSTS_PER_PAGE);
        setLoading(false);

        // Set up real-time listener for post updates
        const unsubscribe = onSnapshot(
          query(
            collection(db, 'posts'),
            where('authorId', '==', profileId),
            orderBy('createdAt', 'desc')
          ),
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              const postData = change.doc.data();
              const post = {
                id: change.doc.id,
                ...postData,
                createdAt: postData.createdAt?.toDate() || new Date()
              };

              if (change.type === 'added' && change.doc.metadata.hasPendingWrites) {
                // Local add
                setPosts(prevPosts => [post, ...prevPosts]);
              } else if (change.type === 'modified') {
                // Update
                setPosts(prevPosts => 
                  prevPosts.map(p => p.id === post.id ? post : p)
                );
              } else if (change.type === 'removed') {
                // Remove
                setPosts(prevPosts => 
                  prevPosts.filter(p => p.id !== post.id)
                );
              }
            });
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [profileId, currentUser?.uid, isOwnProfile]);

  const loadMorePosts = async () => {
    if (!hasMore || loading) return;

    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', profileId),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(POSTS_PER_PAGE)
      );

      const snapshot = await getDocs(postsQuery);
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      setPosts(prevPosts => [...prevPosts, ...newPosts]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading more posts:', error);
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
      const userRef = doc(db, 'users', currentUser.uid);
      const oldProfile = (await getDoc(userRef)).data();
      
      // Update user profile
      await updateDoc(userRef, {
        displayName,
        bio,
        location,
        occupation,
        website,
        updatedAt: serverTimestamp()
      });

      // If display name has changed, update all posts by this user
      if (oldProfile.displayName !== displayName) {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('authorId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
          batch.update(doc.ref, {
            authorName: displayName
          });
        });
        await batch.commit();
      }

      // Update auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName
        });
      }

      setUserProfile(prev => ({
        ...prev,
        displayName,
        bio,
        location,
        occupation,
        website
      }));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo Section */}
      <div className="relative h-40 sm:h-48 md:h-64 lg:h-80 w-full bg-gray-200 overflow-hidden">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500" />
        )}
        
        {isOwnProfile && (
          <label className="absolute bottom-4 right-4 cursor-pointer">
            <input
              type="file"
              ref={coverPhotoRef}
              onChange={handleCoverPhotoChange}
              className="hidden"
              accept="image/*"
            />
            <FaCamera className="text-white text-xl sm:text-2xl hover:text-gray-200" />
          </label>
        )}
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 pb-8">
          {/* Profile Picture and Basic Info */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Profile Picture */}
              <div className="relative flex-shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white bg-gray-200 shadow">
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
                    <FaCamera className="text-gray-600 text-lg hover:text-gray-800" />
                  </label>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-4 sm:mb-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                      {displayName || 'Anonymous'}
                    </h1>
                    {!isOwnProfile && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleFollowToggle}
                        className="mt-2 w-full sm:w-auto px-6 py-2 rounded-full text-sm font-semibold"
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
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mb-4 sm:mb-0"
                    >
                      <FaEdit className="inline-block mr-2" />
                      {editing ? 'Cancel' : 'Edit Profile'}
                    </motion.button>
                  )}
                </div>

                {editing ? (
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                          placeholder="Your display name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                          placeholder="Tell us about yourself"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <div className="relative">
                            <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                              placeholder="Your location"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                          <div className="relative">
                            <FaBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={occupation}
                              onChange={(e) => setOccupation(e.target.value)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                              placeholder="Your occupation"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
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
                        className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md shadow-sm text-sm font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </motion.button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 mt-4">
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
                      <p className="text-gray-600 break-words text-sm sm:text-base">
                        {bio || 'Add a bio to tell people about yourself'}
                      </p>
                    </div>

                    {website && (
                      <div className="flex items-center space-x-2 text-primary">
                        <FaGlobe className="flex-shrink-0" />
                        <a 
                          href={website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:underline truncate text-sm sm:text-base"
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
            <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl font-bold text-gray-900">{followersCount}</div>
                <div className="text-xs sm:text-sm text-gray-500">Followers</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl font-bold text-gray-900">{followingCount}</div>
                <div className="text-xs sm:text-sm text-gray-500">Following</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl font-bold text-gray-900">{posts.length}</div>
                <div className="text-xs sm:text-sm text-gray-500">Posts</div>
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="mt-6 sm:mt-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Posts</h2>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center p-4">
                  <LoadingAnimation />
                </div>
              ) : posts && posts.length > 0 ? (
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
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



export default Profile; 
