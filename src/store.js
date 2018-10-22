import Vue from 'vue'
import Vuex from 'vuex'
const fb = require('./firebaseConfig')

Vue.use(Vuex)

//Verificamos que el usuario exista para pasarle los datos al cargar la pagina
fb.auth.onAuthStateChanged(user => {
  if (user) {

      //Si el usuario existe(autenticado) le agragamos los balores a las acctions y mutations
      store.commit('setCurrentUser', user)
      store.dispatch('fetchUserProfile')

      //Observar los cambias al actualizar perfil
      fb.usersCollection.doc(user.uid).onSnapshot(doc => {
        store.commit('setUserProfile', doc.data())
      })

      //ordenamos los datos que ns devuelve la collection de post  y creamos un metodo .onSnaptshot para observar cambios
      fb.postsCollection.orderBy('createdOn', 'desc').onSnapshot(querySnapshot=>{

        //creamos una bariable para ver si los poost son de el usuario existente
        let createdByCurrentUser
        console.log(querySnapshot.docChanges()[0].doc.data());

        //si el id de el usuario que creo el post es igual al usuario existente  createdByCurrentUser es true
        if (querySnapshot.docs.length) {
            createdByCurrentUser = store.state.currentUser.uid == querySnapshot.docChanges()[0].doc.data().userId ? true : false
        }

        //validamos que aya habido algun cambio, el tipo de cambio, que el cambio no aya sido de el usuario existente
        if (querySnapshot.docChanges().length !== querySnapshot.docs.length && querySnapshot.docChanges()[0].type == 'added' && !createdByCurrentUser) {

          // si se cumplen las condiciones cremos un post y lo guardamos en hiddenPost
          let post = querySnapshot.docChanges()[0].doc.data()
          post.id = querySnapshot.docChanges()[0].doc.id

          //enviamos el post a una mutacion
          store.commit('setHiddenPosts', post)
        }else{
          console.log(querySnapshot);
          let postsArray=[]

          querySnapshot.forEach(doc => {
            let post = doc.data()
            post.id = doc.id
            postsArray.push(post)
            console.log(doc.data());
          })
          store.commit('setPosts', postsArray)
        }
      })
  }
})

export const store = new Vuex.Store({
  state: {
    currentUser:null,
    userProfile:{},
    posts:[],
    hiddenPosts: []
  },
  mutations: {
    setCurrentUser(state, val){
      state.currentUser = val
    },
    setUserProfile(state, val){
      state.userProfile = val
    },
    setPosts(state,val){
      state.posts = val
    },
    setHiddenPosts(state, val){
      if (val) {
          if(!state.hiddenPosts.some(x => x.id == val.id)){
            state.hiddenPosts.unshift(val)
          }
      } else {
        state.hiddenPosts = []
      }
    }
  },
  actions: {
    clearData({commit}){
      commit('setCurrentUser', null)
      commit('setUserProfile', {})
      commit('setPosts', null)
    },
    fetchUserProfile({commit, state}){
      fb.usersCollection.doc(state.currentUser.uid).get().then( res => {
        commit('setUserProfile', res.data())
      }).catch(err => {
        console.log(err);
      })
    },
    updateProfile({commit, state}, data){
      let name = data.name
      let title = data.title

      fb.usersCollection.doc(state.currentUser.uid).update({name, title}).then(user => {

        fb.postsCollection.where('userId', '==' , state.currentUser.uid).get().then(docs => {
          docs.forEach(doc=>{
            fb.postsCollection.doc(doc.id).update({
              userName: name
            })
          })
        })

        fb.commentsCollection.where('userId', '==', state.currentUser.uid).get().then(docs => {
          docs.forEach(doc => {
            fb.commentsCollection.doc(doc.id).update({
              userName: name
            })
          })
        })
      }).catch(err => {
        console.log(err);
      })
    }
  }
})
