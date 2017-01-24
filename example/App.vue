<template>
  <div id="app" class="container-fluid">
    <div class="col-md-4">
      <div class="form-horizontal">

      <div class="form-group">
        <label for="type" class="control-label col-sm-2">Tree</label>
          <div  class="col-sm-10">
            <select id="type" class="form-control" v-model="type">
              <option>tree</option>
              <option>cluster</option>
            </select>
          </div>
      </div>

      <div class="form-group">
        <label for="layout-type" class="control-label col-sm-2">Layout</label>
          <div  class="col-sm-10">
            <select id="layout-type" class="form-control col-sm-10" v-model="layoutType">
              <option>euclidian</option>
              <option>circular</option>
            </select>       
        </div>
      </div> 

      <div class="form-group">
        <label for="margin-x" class="control-label col-sm-2">Margin-x {{Marginx}}px</label>
        <div class="col-sm-10">
          <input id="margin-x" class="form-control" type="range" min="0" max="200" v-model.number="Marginx">
        </div> 
      </div>        

      <div class="form-group">
        <label for="margin-y" class="control-label col-sm-2">Margin-y {{Marginy}}px</label>
        <div class="col-sm-10">
          <input id="margin-y" class="form-control" type="range" min="0" max="200" v-model.number="Marginy">
        </div> 
      </div>        

      <div class="form-group">
        <label for="velocity" class="control-label col-sm-2">Duration {{duration}}ms</label>
        <div class="col-sm-10">
          <input id="velocity" class="form-control" type="range" min="0" max="3000" v-model.number="duration">
        </div> 
      </div>       

    </div>
  </div>

  <div class="col-md-8">
    <d3tree :data="Graph.tree" :margin-x="Marginx" :margin-y="Marginy" :type="type" :layout-type="layoutType" :duration="duration" class="tree" @clicked="onClick"></d3tree>
  </div>

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
