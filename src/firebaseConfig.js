import firebase from 'firebase'
import 'firebase/firebase'
  // Initialize Firebase
  const config = {
    apiKey: "AIzaSyAHfv1aExpxZL26qPmYKnzuDS8m0eAxdGQ",
    authDomain: "vuegram-vue.firebaseapp.com",
    databaseURL: "https://vuegram-vue.firebaseio.com",
    projectId: "vuegram-vue",
    storageBucket: "vuegram-vue.appspot.com",
    messagingSenderId: "1002037375407"
  };
  firebase.initializeApp(config);
  //firebase utils
  const db = firebase.firestore()
  const auth = firebase.auth()
  const currentUser = auth.currentUser

  const settings = { timestampsInSnapshots: true }
  db.settings(settings)

  //firestore collections
  const usersCollection = db.collection('users')
  const postsCollection = db.collection('posts')
  const commentsCollection = db.collection('comments')
  const likesCollection = db.collection('likes')

  export{
    db,
    auth,
    currentUser,
    usersCollection,
    postsCollection,
    commentsCollection,
    likesCollection,
  }
