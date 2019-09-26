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
                    <option>horizontal</option>
                    <option>vertical</option>
                    <option>circular</option>
                  </select>
              </div>
            </div> 

            <div class="form-group">
              <label for="layout-type" class="control-label col-sm-3">nodeTextDisplay</label>
                <div  class="col-sm-9">
                  <select id="layout-type" class="form-control" v-model="nodeTextDisplay">
                    <option>all</option>
                    <option>leaves</option>
                    <option>extremities</option>
                  </select>
              </div>
            </div>

            <div class="form-group">
              <label for="layout-type" class="control-label col-sm-3">linkLayout</label>
                <div  class="col-sm-9">
                  <select id="layout-type" class="form-control" v-model="linkLayout">
                    <option>bezier</option>
                    <option>orthogonal</option>
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
              <label for="margin-y" class="control-label col-sm-3">radius</label>
              <div class="col-sm-7">
                <input id="radius" class="form-control" type="range" min="1" max="10" v-model.number="radius">
              </div>
              <div class="col-sm-2">
                <p>{{radius}}px</p>
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
              <label for="leaf-text-margin" class="control-label col-sm-3">leafTextMargin</label>
              <div class="col-sm-7">
                <input id="leaf-text-margin" class="form-control" type="range" min="0" max="100" v-model.number="leafTextMargin">
              </div>
              <div class="col-sm-2">
                <p>{{leafTextMargin}}px</p>
              </div>
            </div>

             <div class="form-group">
              <label for="node-text-margin" class="control-label col-sm-3">nodeTextMargin</label>
              <div class="col-sm-7">
                <input id="node-text-margin" class="form-control" type="range" min="0" max="100" v-model.number="nodeTextMargin">
              </div>
              <div class="col-sm-2">
                <p>{{nodeTextMargin}}px</p>
              </div>
            </div>

            <div class="form-group">
              <label for="minZoom" class="control-label col-sm-3">minZoom</label>
              <div class="col-sm-7">
                <input id="minZoom" class="form-control" type="range" min="0.01" max="1" step="0.05" v-model.number="minZoom">
              </div>
              <div class="col-sm-2">
                <p>{{minZoom}}</p>
              </div>
            </div>

              <div class="form-group">
              <label for="maxZoom" class="control-label col-sm-3">maxZoom</label>
              <div class="col-sm-7">
                <input id="maxZoom" class="form-control" type="range" min="1" max="100" v-model.number="maxZoom">
              </div>
              <div class="col-sm-2">
                <p>{{maxZoom}}</p>
              </div>
            </div>

            <div class="form-group">
              <label for="zoomable" class="">Zoomable</label>
              <input id="zoomable" class="form-check-input" type="checkbox" v-model="zoomable">
            </div>

            <div class="form-group feedback">
              <i v-show="isLoading" class="fa fa-spinner fa-spin fa-2x fa-fw"></i>
              <span v-if="currentData">Current Node: {{currentData.data.text}}</span>
              <span v-else>No Node selected.</span>
            </div>

            <button type="button" :disabled="!currentData" class="btn btn-primary" @click="expandAll" data-toggle="tooltip" data-placement="top" title="Expand All from current">
            <i class="fa fa-expand" aria-hidden="true"></i>
            </button>

            <button type="button" :disabled="!currentData" class="btn btn-secondary" @click="collapseAll" data-toggle="tooltip" data-placement="top" title="Collapse All from current">
            <i class="fa fa-compress" aria-hidden="true"></i>
            </button>

            <button type="button" :disabled="!currentData" class="btn btn-success" @click="showOnly" data-toggle="tooltip" data-placement="top" title="Show Only from current">
            <i class="fa fa-search-plus" aria-hidden="true"></i>
            </button>

            <button type="button" :disabled="!currentData" class="btn btn-warning" @click="show" data-toggle="tooltip" data-placement="top" title="Show current">
            <i class="fa fa-binoculars" aria-hidden="true"></i>
            </button>

            <button v-if="zoomable" type="button" class="btn btn-warning" @click="resetZoom" data-toggle="tooltip" data-placement="top" title="Reset Zoom">
            <i class="fa fa-arrows-alt" aria-hidden="true"></i>
            </button>
            
            <button type="button" class="btn btn-danger" @click="gremlins" data-toggle="tooltip" data-placement="top" :title="isUnderGremlinsAttack ? 'stop attack' :'unleash gremlins'">
            <i class="fa" :disabled="isUnderGremlinsAttack" :class="isUnderGremlinsAttack ? 'fa-exclamation-triangle':'fa-optin-monster'" aria-hidden="true"></i>
            </button>

        </div>
      </div>
    </div>


    <div class="panel panel-default">
        <div class="panel-heading">Events</div>

        <div class="panel-body log">
          <div v-for="(event,index) in events" :key="index">
            <p><b>Name:</b> {{event.eventName}} <b>Data:</b>{{event.data.text}}</p>
          </div>
        </div>
    </div>

  </div>

  <div class="col-md-9 panel panel-default">
    <tree ref="tree"
      v-model="currentData"
      :nodeTextDisplay="nodeTextDisplay"
      :identifier="getId" 
      :nodeTextMargin="nodeTextMargin"
      :zoomable="zoomable"
      :data="Graph.tree"
      :leafTextMargin="leafTextMargin"
      :node-text="nodeText"
      :margin-x="Marginx"
      :margin-y="Marginy"
      :radius="radius"
      :type="type"
      :layout-type="layoutType"
      :linkLayout="linkLayout"
      :duration="duration"
      :minZoom="minZoom"
      :maxZoom="maxZoom"
      contextMenuPlacement="bottom-start"
      class="tree"
      @clickedText="onClick"
      @expand="onExpand"
      @retract="onRetract"
      @clickedNode="onClickNode">

      <!-- <template #node /> -->

      <!-- <template #node="{data, node: {depth}, radius, isRetracted}">
        <template v-if="data.children && data.children.length">
          <path transform="scale(0.05) translate(-10,-250)" :fill="isRetracted? 'red' : 'blue'" d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z">
            <title>{{data.text}} {{depth}}</title>
          </path>
        </template>
        <template v-else>
          <circle r="6" :stroke="zoomable? 'blue' : 'yellow'" :fill="zoomable? 'blue' : 'yellow'">
             <title>{{data.text}} {{depth}}</title>
          </circle>
        </template>
      </template> -->

      <!-- <template #behavior>
        <noBehavior/>
      </template> -->

      <template #popUp="{data,node}">
        <div class="btn-group-vertical">
           <button type="button" class="btn btn-primary" @click="addFor(data)" data-toggle="tooltip" title="Add children">
              <i class="fa fa-plus" aria-hidden="true"></i>
            </button>
            <button type="button" class="btn btn-danger" @click="remove(data, node)" data-toggle="tooltip" title="Remove node">
              <i class="fa fa-trash" aria-hidden="true"></i>
            </button>
        </div>
      </template>
    </tree>
  </div>
  
  </div>
</template>

<script>
import {tree} from '../../src/'
import data from '../../data/data'
import {getGremlin} from './gremlinConfiguration'
import noBehavior from '../../src/behaviors/noBehavior'
let currentId = 500

const removeElement = (arr, element) => {
  const index = arr.indexOf(element)
  if (index === -1) {
    return
  }
  arr.splice(index, 1)
}

Object.assign(data, {
  type: 'tree',
  layoutType: 'horizontal',
  duration: 750,
  Marginx: 30,
  Marginy: 30,
  radius: 3,
  leafTextMargin: 6,
  nodeTextMargin: 6,
  nodeText: 'text',
  currentData: null,
  zoomable: true,
  isLoading: false,
  isUnderGremlinsAttack: false,
  nodeTextDisplay: 'all',
  linkLayout: 'bezier',
  minZoom: 0.8,
  maxZoom: 9,
  events: []
})

export default {
  name: 'app',
  data () {
    return data
  },
  components: {
    tree,
    noBehavior
  },
  methods: {
    async do (action) {
      if (this.currentData) {
        this.isLoading = true
        await this.$refs['tree'][action](this.currentData)
        this.isLoading = false
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
      this.onEvent('clickedText', evt)
    },
    onClickNode (evt) {
      this.onEvent('clickedNode', evt)
    },
    onExpand (evt) {
      this.onEvent('onExpand', evt)
    },
    onRetract (evt) {
      this.onEvent('onRetract', evt)
    },
    onEvent (eventName, data) {
      this.events.push({eventName, data: data.data})
    },
    addFor (data) {
      const newData = {
        id: currentId++,
        children: [],
        text: Math.random().toString(36).substring(7)
      }
      data.children.push(newData)
    },
    remove (data, node) {
      const parent = node.parent.data
      removeElement(parent.children, data)
    },
    resetZoom () {
      if (!this.$refs['tree']) {
        return
      }
      this.isLoading = true
      this.$refs['tree'].resetZoom().then(() => { this.isLoading = false })
    },
    gremlins () {
      if (this.isUnderGremlinsAttack) {
        this.horde.stop()
        return
      }

      const updateType = (type) => {
        switch (type) {
          case 'vertical':
            return 'circular'

          case 'circular':
            return 'horizontal'

          case 'horizontal':
            return 'vertical'
        }
      }

      const updateNodeTextDisplay = (display) => {
        switch (display) {
          case 'all':
            return 'leaves'

          case 'leaves':
            return 'extremities'

          case 'extremities':
            return 'all'
        }
      }

      this.duration = 20
      const changeLayout = () => { this.type = (this.type === 'tree') ? 'cluster' : 'tree' }
      const changeNode = () => { this.linkLayout = (this.linkLayout === 'bezier') ? 'orthogonal' : 'bezier' }
      const changeType = () => { this.layoutType = updateType(this.layoutType) }
      const changeNodeTextDisplay = () => { this.nodeTextDisplay = updateNodeTextDisplay(this.nodeTextDisplay) }
      const resetZoom = this.resetZoom.bind(this)
      const [treeDiv] = this.$el.getElementsByClassName('tree')
      const [gremlinsButton] = this.$el.getElementsByClassName('btn-danger')
      var horde = getGremlin(gremlinsButton, treeDiv, {changeType, changeLayout, changeNode, changeNodeTextDisplay, resetZoom})
      horde.after(() => { this.isUnderGremlinsAttack = false })
      horde.unleash()
      this.horde = horde
      this.isUnderGremlinsAttack = true
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
  height: 800px;
}

.graph-root {
  height: 800px;
  width: 100%;
}

.feedback{
  height: 50px;
  line-height: 50px;
  vertical-align: middle;
}

.log  {
  height: 200px;
  overflow-x: auto;
  overflow-y: auto;
  overflow: auto;
  text-align: left;
}
</style>
