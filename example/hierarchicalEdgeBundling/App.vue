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
              <span v-if="highlightedNode">Current Node: {{highlightedNode.data.text}}</span>
              <span v-else>No Node selected.</span>
               <!-- <i v-if="loading" class="fa fa-spinner fa-spin fa-2x fa-fw"></i> -->
            </div>

        </div> 
      </div>     
    </div>

    <event-logger :events="events"/>

  </div>
 
   <div class="col-md-9 panel panel-default">
    <hierarchical-edge-bundling class="graph-root" ref="graph" :maxTextWidth="50" identifier="id" :duration="duration" @mouseNodeOver="mouseNodeOver" @mouseNodeOut="mouseNodeOut" :data="tree" :links="links" node-text="text" :margin-x="marginX" :margin-y="marginY"/>
  </div>

  </div>
</template>

<script>
import {hierarchicalEdgeBundling} from '../../src/'
//  import rawVm from '../../data/DiscogsClientvm'
//  import rawVm from '../../data/nhibernatevm'
import rawVm from '../../data/vm'
import CircularJson from 'circular-json'
import EventLogger from './EventLogger'
const vm = CircularJson.parse(rawVm)

const data = {
  duration: 750,
  marginX: 30,
  marginY: 30,
  events: [],
  loading: false,
  highlightedNode: null,
  tree: vm.Graph.tree,
  links: vm.Graph.links
}

export default {
  name: 'app',
  data () {
    return data
  },
  components: {
    hierarchicalEdgeBundling,
    EventLogger
  },
  methods: {
    changeCurrent (value) {
      this.loading = true
      window.setTimeout(() => {
        this.highlightedNode = value
        this.loading = false
      })
    },
    onEvent (eventName, data) {
      console.log(eventName, data)
      this.events.push({eventName, data: data.data})
    },
    mouseNodeOver (event) {
      this.onEvent('mouseNodeOver', event)
      this.changeCurrent(event.element)
    },
    mouseNodeOut (event) {
      this.onEvent('mouseNodeOut', event)
      this.changeCurrent(null)
    }
  },
  watch: {
    highlightedNode (value) {
      this.$refs['graph'].highlightedNode = value
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
</style>
