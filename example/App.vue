<template>
  <div id="app">

    <label for="velocity">Transtion velocity {{duration}}ms</label>
    <input id="velocity" type="range" min="0" max="1000" v-model.number="duration">

    <label for="type">Tree type</label>
    <select id="type" v-model="type">
      <option>tree</option>
      <option>cluster</option>
    </select>

    <label for="layout-type">Layout type</label>
    <select id="layout-type" v-model="layoutType">
      <option>euclidian</option>
      <option>circular</option>
    </select>

    <d3tree :data="Graph.tree" :type="type" :layout-type="layoutType" :duration="duration" class="tree"></d3tree>
  </div>
</template>

<script>
import D3tree from '../src/D3tree'
import data from '../data/data'
Object.assign(data, {
  type: 'tree',
  layoutType: 'euclidian',
  duration: 750
})

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

.tree {
  height: 500px;
  width: 100%;
}
</style>
