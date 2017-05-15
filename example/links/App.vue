<template>
  <div id="app" class="container-fluid">
    <div class="col-md-3">

      <div class="panel panel-default">
        <div class="panel-heading">Props</div>

        <div class="panel-body">
            <div class="form-horizontal">

            <div class="form-group">
              <label for="margin-x" class="control-label col-sm-3">marginx</label>
              <div class="col-sm-7">
                <input id="margin-x" class="form-control" type="range" min="0" max="200" v-model.number="marginX">
              </div> 
                <div class="col-sm-2">
                  <p>{{marginX}}px</p>       
              </div> 
            </div>        

            <div class="form-group">
              <label for="margin-y" class="control-label col-sm-3">marginy</label>
              <div class="col-sm-7">
                <input id="margin-y" class="form-control" type="range" min="0" max="200" v-model.number="marginY">
              </div>
              <div class="col-sm-2">
                <p>{{marginY}}px</p>       
              </div> 
            </div>        

            <div class="form-group">
              <label for="velocity" class="control-label col-sm-3">Duration</label>
              <div class="col-sm-7">
                <input id="velocity" class="form-control" type="range" min="0" max="3000" v-model.number="duration">
              </div>
              <div class="col-sm-2">
                <p>{{duration}}ms</p>       
              </div>
            </div>  

            <div class="form-group">
              <span v-if="currentNode">Current Node: {{currentNode.data.text}}</span>
              <span v-else>No Node selected.</span>
               <i v-if="false" class="fa fa-spinner fa-spin fa-2x fa-fw"></i>
            </div>  

            <button type="button" :disabled="!currentNode" class="btn btn-primary" data-toggle="tooltip" data-placement="top" title="">
            <i class="fa fa-expand" aria-hidden="true"></i>          
            </button>

            <button type="button" :disabled="!currentNode" class="btn btn-secondary" data-toggle="tooltip" data-placement="top" title="">
            <i class="fa fa-compress" aria-hidden="true"></i>            
            </button>

            <button type="button" :disabled="!currentNode" class="btn btn-success" data-toggle="tooltip" data-placement="top" title="">
            <i class="fa fa-search-plus" aria-hidden="true"></i>       
            </button>

            <button type="button" :disabled="!currentNode" class="btn btn-warning" data-toggle="tooltip" data-placement="top" title="">
            <i class="fa fa-binoculars" aria-hidden="true"></i>           
            </button>

            <button type="button" class="btn btn-warning" data-toggle="tooltip" data-placement="top" title="">
            <i class="fa fa-arrows-alt" aria-hidden="true"></i>                             
            </button>

        </div> 
      </div>     
    </div>

  </div>
 
   <div class="col-md-9 panel panel-default">
    <d3dependency-graph class="graph-root" ref="graph" identifier="id" :duration="duration" @mouseNodeOver="selectedGraphNode=$event.element" @mouseNodeOut="selectedGraphNode=null" :data="forDependency.tree" :links="forDependency.links" node-text="text" :margin-x="marginX" :margin-y="marginY"></d3dependency-graph>
  </div>

  </div>
</template>

<script>
import {D3dependencyGraph} from '../../src/'
import rawVm from '../../data/DiscogsClientvm'
import CircularJson from 'circular-json'
const vm = CircularJson.parse(rawVm)

const data = {
  duration: 750,
  marginX: 30,
  marginY: 30,
  currentNode: null,
  events: [],
  forDependency: {
    tree: vm.Graph.tree,
    links: vm.Graph.links
  }
}

export default {
  name: 'app',
  data () {
    return data
  },
  components: {
    D3dependencyGraph
  },
  computed: {
    selectedGraphNode: {
      get () {
        return this.$refs['graph'].currentNode
      },
      set (value) {
        this.$refs['graph'].currentNode = value
      }
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
  margin-top: 20px;
}

.tree {
  height: 600px;
  width: 100%;
}

.graph-root {
  height: 800px;
  width: 100%;
}

.log  {
  height: 500px;
  overflow-x: auto;
  overflow-y: auto;
  overflow: auto;
  text-align: left;
}

</style>
