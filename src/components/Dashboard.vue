<template>
  <div id="dashboard">
    <section>
      <div class="col1">
        <div class="profile">
          <h5>{{ userProfile.name }}</h5>
          <p>{{ userProfile.title }}</p>
          <div class="create-post">
            <p>create a post</p>
            <form @submit.prevent>
              <textarea v-model.trim="post.content"></textarea>
              <button @click="createPost" :disabled=" post.content == '' " class="button">post</button>
            </form>
          </div>
        </div>
      </div>
      <div class="col2">
        <transition name="fade">
            <div v-if="hiddenPosts.length" @click="showNewPosts" class="hidden-posts">
                <p>
                    Click to show <span class="new-posts">{{ hiddenPosts.length }}</span> 
                    new <span v-if="hiddenPosts.length > 1">posts</span><span v-else>post</span>
                </p>
            </div>
        </transition>
        <div v-if="posts.length">
            <div v-for="post in posts" class="post">
                <h5>{{ post.userName }}</h5>
                <span>{{ post.createdOn | formatDate }}</span>
                <p>{{ post.content | trimLength }}</p>
                <ul>
                    <li><a @click="openCommentModal(post)">comments {{ post.comments }}</a></li>
                    <li><a @click="likePost(post.id, post.likes)">likes {{ post.likes }}</a></li>
                    <li><a @click="viewPost(post)">view full post</a></li>
                </ul>
            </div>
        </div>
        <div v-else>
            <p class="no-results">There are currently no posts</p>
        </div>
      </div>
    </section>
    <!-- comment modal -->
    <transition name="fade">
        <div v-if="showCommentModal" class="c-modal">
            <div class="c-container">
                <a @click="closeCommentModal">X</a>
                <p>add a comment</p>
                <form @submit.prevent>
                    <textarea v-model.trim="comment.content"></textarea>
                    <button @click="addComment" :disabled="comment.content == ''" class="button">add comment</button>
                </form>
            </div>
        </div>
    </transition>
    <!-- post modal -->
    <transition name="fade">
        <div v-if="showPostModal" class="p-modal">
            <div class="p-container">
                <a @click="closePostModal" class="close">X</a>
                <div class="post">
                    <h5>{{ fullPost.userName }}</h5>
                    <span>{{ fullPost.createdOn | formatDate }}</span>
                    <p>{{ fullPost.content }}</p>
                    <ul>
                        <li><a>comments {{ fullPost.comments }}</a></li>
                        <li><a @click="likePost(fullPost.id, fullPost.likes)">likes {{ fullPost.likes }}</a></li>
                    </ul>
                </div>
                <div v-show="postComments.length" class="comments">
                    <div v-for="comment in postComments" class="comment">
                        <p>{{ comment.userName }}</p>
                        <span>{{ comment.createdOn | formatDate }}</span>
                        <p>{{ comment.content }}</p>
                    </div>
                </div>
            </div>
        </div>
    </transition>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import moment from 'moment'
  const fb = require('../firebaseConfig.js')
  
  export default {
    data(){
      return{
        post:{
          content: ''
        },
        comment:{
          postId:'',
          userId:'',
          content:'',
          postComments:0
        },
        showCommentModal:false,
        showPostModal: false,
        fullPost: {},
        postComments: []
      }
    },
    computed:{
      //Traemos el array de Store
      ...mapState(['userProfile','currentUser','posts', 'hiddenPosts'])
    },
    methods:{
      //creamos un post y lo enviamos a Firestore
      createPost(){
        console.log(this.userProfile);
        fb.postsCollection.add({
          createdOn: new Date(),
          content: this.post.content,
          userId: this.currentUser.uid,
          userName: this.userProfile.name,
          comments: 0,
          likes:0
        }).then(ref => {
            console.log("Document written with ID: ", ref.id);
            console.log(this.posts);
            //Limpiamos en objeto de post
            this.post.content = ''
        })
        .catch(err => {
            console.error("Error adding document: ", err);
        });
      },
      showNewPosts() {
          //Creamos una variable para concatenerle el o los objetos que bienen en el array hiddenPost
          let updatedPostsArray = this.hiddenPosts.concat(this.posts)
          // Limpia arraa oculato y agrega al array de post 
          this.$store.commit('setHiddenPosts', null)
          this.$store.commit('setPosts', updatedPostsArray)
        },
      openCommentModal(post){
        //Esta funcion abre el modal para comentarios y guarda en el ojeto comment la info que trae el post
        this.comment.postId = post.id
        this.comment.userId = post.userId
        this.comment.postComments = post.comments
        this.showCommentModal = true
      },
      closeCommentModal(){
        //Sierra el modal de comentarios y vacia los datos
        this.comment.postId = ''
        this.comment.userId = ''
        this.comment.content = ''
        this.showCommentModal = false
      },
      addComment(){
        //agreagamos el comentario 

        //creamos una variable para guardar el id del post que ya esta en el objeto
        let postId = this.comment.postId
        //creamos una variable para pasarle el contador de comentarios
        let postComments = this.comment.postComments
        //agreagamos a firebase el comentario a a coleccion  como un obja=eto
        fb.commentsCollection.add({
          createdOn: new Date(),
          content: this.comment.content,
          postId: postId,
          userId: this.currentUser.uid,
          userName: this.userProfile.name
        }).then(doc => {
          //si no hay problemas aumentamos el contador de comentarios dentro de firestore con un "update"
          fb.postsCollection.doc(postId).update({
            comments: postComments + 1
          }).then(()=> {
            //si se aumento correctamente cerramos el modal
            this.closeCommentModal()
          })
        }).catch(err=>{
          console.log(err);
        })
      },
      likePost(postId, postLikes){
        let docId =  `${this.currentUser.uid}_${postId}`

        fb.likesCollection.doc(docId).get().then(doc => {
          if(doc.exists){
            return
          }
          fb.likesCollection.doc(docId).set({
            postId: postId,
            userId: this.currentUser.uid
          }).then(()=>{
            fb.postsCollection.doc(postId).update({
              likes: postLikes + 1
            })
          })
        }).catch(err => {
          console.log(err);
        })
      },
      viewPost(post){
        fb.commentsCollection.where('postId', '==', post.id ).get().then(docs =>{
          let commentsArray = []

          docs.forEach(doc => {
            let comment = doc.data()
            comment.id = doc.id
            commentsArray.push(comment)
          })

          this.postComments = commentsArray
          this.fullPost = post
          this.showPostModal = true
          console.log(this.fullPost);
        }).catch(err => {
          console.log(err);
        })
      },
      closePostModal(){
        this.postComments = []
        this.showPostModal = false
      } 
    },
    filters: {
      //Creamos lo filtros con Moment
        formatDate(val) {
            if (!val) { return '-' }
            let date = val.toDate()
            return moment(date).fromNow()
        },
        trimLength(val) {
            if (val.length < 200) {
                return val
            }
            return `${val.substring(0, 200)}...`
        }
    }
  }
</script>

<style scoped>

</style>