<template>
  <div id="app">
    <Navigation v-if="currentUser"></Navigation>
    <router-view/>
  </div>
</template>

<script>
import Navigation from './components/Navigation'
import { mapState } from 'vuex'

export default {
  components:{
    Navigation
  },
  data(){
    return{

    }  
  },
  computed:{
    ...mapState(['currentUser'])
  }
}
</script>


<style lang="scss">


</style>
