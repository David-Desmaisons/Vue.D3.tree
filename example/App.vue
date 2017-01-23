<template>
  <div id="app">

    <label for="margin-x">Margin x {{Marginx}}px</label>
    <input id="margin-x" type="range" min="0" max="200" v-model.number="Marginx">

    <label for="margin-y">Margin y {{Marginy}}px</label>
    <input id="margin-y" type="range" min="0" max="200" v-model.number="Marginy">

    <label for="velocity">Transtion velocity {{duration}}ms</label>
    <input id="velocity" type="range" min="0" max="3000" v-model.number="duration">

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

    <d3tree :data="Graph.tree" :margin-x="Marginx" :margin-y="Marginy" :type="type" :layout-type="layoutType" :duration="duration" class="tree" @clicked="onClick"></d3tree>
  </div>
</template>

<script>
import D3tree from '../src/D3tree'
import data from '../data/data'
Object.assign(data, {
  type: 'tree',
  layoutType: 'euclidian',
  duration: 750,
  Marginx: 30,
  Marginy: 30
})

export default {
  name: 'app',
  data () {
    return data
  },
  components: {
    D3tree
  },
  methods: {
    onClick (evt) {
      console.log(evt)
    }
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
  height: 600px;
  width: 100%;
}
</style>
