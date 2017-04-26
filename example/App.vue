<template>
  <div id="app" class="container-fluid">
    <div class="col-md-3">

      <div class="panel panel-default">
        <div class="panel-heading">Props</div>

        <div class="panel-body">
            <div class="form-horizontal">

            <div class="form-group">
              <label for="type" class="control-label col-sm-3">type</label>
                <div  class="col-sm-9">
                  <select id="type" class="form-control" v-model="type">
                    <option>tree</option>
                    <option>cluster</option>
                  </select>
                </div>
            </div>

            <div class="form-group">
              <label for="layout-type" class="control-label col-sm-3">layoutType</label>
                <div  class="col-sm-9">
                  <select id="layout-type" class="form-control" v-model="layoutType">
                    <option>euclidean</option>
                    <option>circular</option>
                  </select>       
              </div>
            </div> 

            <div class="form-group">
              <label for="margin-x" class="control-label col-sm-3">marginx</label>
              <div class="col-sm-7">
                <input id="margin-x" class="form-control" type="range" min="-200" max="200" v-model.number="Marginx">
              </div> 
                <div class="col-sm-2">
                  <p>{{Marginx}}px</p>       
              </div> 
            </div>        

            <div class="form-group">
              <label for="margin-y" class="control-label col-sm-3">marginy</label>
              <div class="col-sm-7">
                <input id="margin-y" class="form-control" type="range" min="-200" max="200" v-model.number="Marginy">
              </div>
              <div class="col-sm-2">
                <p>{{Marginy}}px</p>       
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
               <i v-if="isLoading" class="fa fa-spinner fa-spin fa-2x fa-fw"></i>
            </div>  

            <button type="button" :disabled="!currentNode" class="btn btn-primary" @click="expandAll" data-toggle="tooltip" data-placement="top" title="Expand All from current">
            <i class="fa fa-expand" aria-hidden="true"></i>          
            </button>

            <button type="button" :disabled="!currentNode" class="btn btn-secondary" @click="collapseAll" data-toggle="tooltip" data-placement="top" title="Collapse All from current">
            <i class="fa fa-compress" aria-hidden="true"></i>            
            </button>

            <button type="button" :disabled="!currentNode" class="btn btn-success" @click="showOnly" data-toggle="tooltip" data-placement="top" title="Show Only from current">
            <i class="fa fa-search-plus" aria-hidden="true"></i>       
            </button>

            <button type="button" :disabled="!currentNode" class="btn btn-warning" @click="show" data-toggle="tooltip" data-placement="top" title="Show current">
            <i class="fa fa-binoculars" aria-hidden="true"></i>           
            </button>

            <button v-if="zoomable" type="button" class="btn btn-warning" @click="resetZoom" data-toggle="tooltip" data-placement="top" title="Reset Zoom">
            <i class="fa fa-arrows-alt" aria-hidden="true"></i>                             
            </button>

        </div> 
      </div>     
    </div>


    <div class="panel panel-default">
        <div class="panel-heading">Events</div>

        <div class="panel-body log">
          <div v-for="event in events">
            <p><b>Name:</b> {{event.eventName}} <b>Data:</b>{{event.data.text}}</p>
          </div>
        </div>
    </div>

  </div>

  <div class="col-md-9 panel panel-default">
    <d3tree ref="tree" :identifier="getId" :zoomable="zoomable" :data="Graph.tree" :node-text="nodeText"  :margin-x="Marginx" :margin-y="Marginy" :type="type" :layout-type="layoutType" :duration="duration" class="tree" @clicked="onClick" @expand="onExpand" @retract="onRetract"></d3tree>
  </div>
 
   <div class="col-md-9 panel panel-default">
    <d3dependency-graph class="graph-root" ref="graph" :data="forDependency.tree" :links="forDependency.links" :node-text="nodeText"  :margin-x="Marginx" :margin-y="Marginy"></d3dependency-graph>
  </div>

  </div>
</template>

<script>
import D3tree from '../src/D3tree'
import D3dependencyGraph from '../src/D3dependencyGraph'
import data from '../data/data'
import rawVm from '../data/DiscogsClientvm'
import CircularJson from 'circular-json'
const vm = CircularJson.parse(rawVm)

Object.assign(data, {
  type: 'tree',
  layoutType: 'euclidean',
  duration: 750,
  Marginx: 30,
  Marginy: 30,
  nodeText: 'text',
  currentNode: null,
  zoomable: true,
  isLoading: false,
  events: [],
  forDependency: {
    tree: vm.Graph.tree,
    links: vm.Graph.links
  }
})

export default {
  name: 'app',
  data () {
    return data
  },
  components: {
    D3tree,
    D3dependencyGraph
  },
  methods: {
    do (action) {
      if (this.currentNode) {
        this.isLoading = true
        this.$refs['tree'][action](this.currentNode).then(() => { this.isLoading = false })
      }
    },
    getId (node) {
      return node.id
    },
    expandAll () {
      this.do('expandAll')
    },
    collapseAll () {
      this.do('collapseAll')
    },
    showOnly () {
      this.do('showOnly')
    },
    show () {
      this.do('show')
    },
    onClick (evt) {
      this.currentNode = evt.element
      this.onEvent('onClick', evt)
    },
    onExpand (evt) {
      this.onEvent('onExpand', evt)
    },
    onRetract (evt) {
      this.onEvent('onRetract', evt)
    },
    onEvent (eventName, data) {
      this.events.push({eventName, data: data.data})
      console.log({eventName, data: data})
    },
    resetZoom () {
      this.isLoading = true
      this.$refs['tree'].resetZoom().then(() => { this.isLoading = false })
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
