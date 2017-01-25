<template>
  <div id="app" class="container-fluid">
    <div class="col-md-3">
      <div class="form-horizontal">

      <div class="form-group">
        <label for="type" class="control-label col-sm-3">Tree</label>
          <div  class="col-sm-9">
            <select id="type" class="form-control" v-model="type">
              <option>tree</option>
              <option>cluster</option>
            </select>
          </div>
      </div>

      <div class="form-group">
        <label for="layout-type" class="control-label col-sm-3">Layout</label>
          <div  class="col-sm-9">
            <select id="layout-type" class="form-control col-sm-10" v-model="layoutType">
              <option>euclidian</option>
              <option>circular</option>
            </select>       
        </div>
      </div> 

      <div class="form-group">
        <label for="margin-x" class="control-label col-sm-3">Margin-x</label>
        <div class="col-sm-8">
          <input id="margin-x" class="form-control" type="range" min="0" max="200" v-model.number="Marginx">
        </div> 
          <div class="col-sm-1">
            <p>{{Marginx}}px</p>       
        </div> 
      </div>        

      <div class="form-group">
        <label for="margin-y" class="control-label col-sm-3">Margin-y</label>
        <div class="col-sm-8">
          <input id="margin-y" class="form-control" type="range" min="0" max="200" v-model.number="Marginy">
        </div>
        <div class="col-sm-1">
          <p>{{Marginy}}px</p>       
        </div> 
      </div>        

      <div class="form-group">
        <label for="velocity" class="control-label col-sm-3">Duration</label>
        <div class="col-sm-8">
          <input id="velocity" class="form-control" type="range" min="0" max="3000" v-model.number="duration">
        </div>
        <div class="col-sm-1">
          <p>{{duration}}ms</p>       
        </div>
      </div>       

    </div>
  </div>

  <div class="col-md-9">
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
