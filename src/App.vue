<template>
  <div id="app">
    <d3tree :data="Graph.tree" class="tree"></d3tree>
  </div>
</template>

<script>
import D3tree from './components/D3tree'
import data from '../data/data'

console.log(data)

export default {
  name: 'app',
  data () {
    return data
  },
  components: {
    D3tree
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

tree{
  height: 500px;
}
</style>
