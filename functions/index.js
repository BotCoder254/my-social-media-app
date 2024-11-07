const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.publishScheduledPosts = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    const scheduledPostsQuery = await admin
      .firestore()
      .collection('scheduledPosts')
      .where('status', '==', 'pending')
      .where('scheduledDate', '<=', now)
      .get();

    const batch = admin.firestore().batch();

    scheduledPostsQuery.docs.forEach((doc) => {
      const scheduledPost = doc.data();
      const postRef = admin.firestore().doc(`posts/${scheduledPost.postId}`);
      
      batch.update(postRef, { status: 'published' });
      batch.update(doc.ref, { status: 'completed' });
    });

    await batch.commit();
}); 