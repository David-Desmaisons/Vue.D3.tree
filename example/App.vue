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
                    <option>euclidian</option>
                    <option>circular</option>
                  </select>       
              </div>
            </div> 

            <div class="form-group">
              <label for="margin-x" class="control-label col-sm-3">marginx</label>
              <div class="col-sm-7">
                <input id="margin-x" class="form-control" type="range" min="0" max="200" v-model.number="Marginx">
              </div> 
                <div class="col-sm-2">
                  <p>{{Marginx}}px</p>       
              </div> 
            </div>        

            <div class="form-group">
              <label for="margin-y" class="control-label col-sm-3">marginy</label>
              <div class="col-sm-7">
                <input id="margin-y" class="form-control" type="range" min="0" max="200" v-model.number="Marginy">
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
              <p v-if="currentNode">Current Node: {{currentNode.data.text}}</p>
              <p v-else>No Node selected.</p>
            </div>  

            <button type="button" class="btn btn-primary" @click="expandAll">Expand All from current</button>

            <button type="button" class="btn btn-secondary" @click="collapseAll">Collapse All from current</button>

            <button type="button" class="btn btn-success" @click="showOnlyChildren">Show Only Children from current</button>

            <button type="button" class="btn btn-warning" @click="show">Show current</button>
 
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

  <div class="col-md-9">
    <d3tree ref="tree" :zoomable="true" :data="Graph.tree" :node-text="nodeText"  :margin-x="Marginx" :margin-y="Marginy" :type="type" :layout-type="layoutType" :duration="duration" class="tree" @clicked="onClick" @expand="onExpand" @retract="onRetract"></d3tree>
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
  Marginy: 30,
  nodeText: 'text',
  currentNode: null,
  events: []
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
    expandAll () {
      if (this.currentNode) {
        this.$refs['tree'].expandAll(this.currentNode)
      }
    },
    collapseAll () {
      if (this.currentNode) {
        this.$refs['tree'].collapseAll(this.currentNode)
      }
    },
    showOnlyChildren () {
      if (this.currentNode) {
        this.$refs['tree'].showOnlyChildren(this.currentNode)
      }
    },
    show () {
      if (this.currentNode) {
        this.$refs['tree'].show(this.currentNode)
      }
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

.log  {
  height: 500px;
  overflow-x: auto;
  overflow-y: auto;
  overflow: auto;
  text-align: left;
}

</style>
