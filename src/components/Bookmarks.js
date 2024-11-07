import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Post from './Post';
import LoadingAnimation from './common/LoadingAnimation';

const Bookmarks = () => {
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const handleLike = async (postId) => {
    const postRef = doc(db, 'posts', postId);
    const hasLiked = bookmarkedPosts.find(post => post.id === postId)?.likes?.includes(currentUser.uid);
    
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

  const handleBookmark = async (postId) => {
    const bookmarkRef = doc(db, 'bookmarks', `${currentUser.uid}_${postId}`);
    const bookmarkDoc = await getDoc(bookmarkRef);
    
    try {
      if (bookmarkDoc.exists()) {
        await deleteDoc(bookmarkRef);
        setBookmarkedPosts(prev => prev.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  useEffect(() => {
    const fetchBookmarkedPosts = async () => {
      try {
        const bookmarksRef = collection(db, 'bookmarks');
        const q = query(bookmarksRef, where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        
        const postIds = snapshot.docs.map(doc => doc.data().postId);
        
        // Fetch actual posts
        const posts = [];
        for (const postId of postIds) {
          const postDoc = await getDoc(doc(db, 'posts', postId));
          if (postDoc.exists()) {
            posts.push({ id: postDoc.id, ...postDoc.data() });
          }
        }
        
        setBookmarkedPosts(posts);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      }
      setLoading(false);
    };

    fetchBookmarkedPosts();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bookmarked Posts</h1>
      {bookmarkedPosts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No bookmarked posts yet
        </div>
      ) : (
        bookmarkedPosts.map(post => (
          <Post
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onBookmark={handleBookmark}
          />
        ))
      )}
    </div>
  );
};

export default Bookmarks; 