<template>
  <div class="viewport graph" v-resize="resize">
  </div>
</template>
<script>
import resize from 'vue-resize-directive'
import layout from './circular-layout'
import {compareString, anchorTodx, translate, removeTextAndGraph, toPromise} from './d3-utils'

import * as d3 from 'd3'
import * as d3Hierarchy from 'd3-hierarchy'
Object.assign(d3, d3Hierarchy)

var i = 0

const props = {
  data: Object,
  links: Array,
  marginX: {
    type: Number,
    default: 0
  },
  marginY: {
    type: Number,
    default: 0
  },
  nodeText: {
    type: String,
    required: true
  },
  identifier: {
    type: Function,
    default: () => i++
  },
  duration: {
    type: Number,
    default: 500
  }
}

const directives = {
  resize
}

export default {
  props,

  directives,

  data () {
    return {
      currentTransform: null,
      layout,
      maxTextLenght: {
        first: 0,
        last: 0
      }
    }
  },

  mounted () {
    const size = this.getSize()
    const svg = d3.select(this.$el).append('svg')
          .attr('width', size.width)
          .attr('height', size.height)
    const g = this.transformSvg(svg.append('g'), size)

    const tree = this.tree
    this.internaldata = {
      svg,
      g,
      tree
    }

    if (!this.data) {
      return
    }

    this.onData(this.data)
    this.links && this.onLinks(this.links)
  },

  methods: {
    getSize () {
      var width = this.$el.clientWidth
      var height = this.$el.clientHeight
      return { width, height }
    },

    resize () {
      const size = this.getSize()
      const {g, svg, tree} = this.internaldata
      svg.attr('width', size.width)
        .attr('height', size.height)
      this.transformSvg(g, size)
      this.layout.size(tree, size, this.margin, this.maxTextLenght)
      this.redraw()
    },

    completeRedraw ({margin = null}) {
      const size = this.getSize()
      this.layout.size(this.internaldata.tree, size, this.margin, this.maxTextLenght)
      this.applyTransition(size, {margin})
      this.redraw()
    },

    transformSvg (g, size) {
      size = size || this.getSize()
      return this.layout.transformSvg(g, this.margin, size, this.maxTextLenght)
    },

    updateTransform (g, size) {
      size = size || this.getSize()
      return this.layout.updateTransform(g, this.margin, size, this.maxTextLenght)
    },

    updateGraph () {
      const {root, g, tree} = this.internaldata

      tree(root)
      const node = g.selectAll('.nodetree').data(root.leaves(), d => d.id)
      const newNodes = node.enter().append('g').attr('class', 'nodetree')
      const allNodes = newNodes.merge(node)

      removeTextAndGraph(node)

      const allNodesPromise = toPromise(allNodes.transition().duration(this.duration)
        .attr('transform', d => translate(d, this.layout))
        .attr('opacity', 1))

      const {transformText} = this.layout
      allNodes.each((d) => {
        d.textInfo = transformText(d, false)
      })
      const text = allNodes.append('text')
        .attr('dy', '.35em')
        .text(d => d.data[this.nodeText])
        .attr('x', d => d.textInfo.x)
        .attr('dx', function (d) { return anchorTodx(d.textInfo.anchor, this) })
        .attr('transform', d => `rotate(${d.textInfo.rotate})`)

      const last = Math.max(...text.nodes().map(node => node.getComputedTextLength())) + 6
      if (last <= this.maxTextLenght.last) {
        return allNodesPromise
      }

      this.instantClean()
      const size = this.getSize()
      this.maxTextLenght = {first: 0, last}
      this.transformSvg(g, size)
      this.layout.size(tree, size, this.margin, this.maxTextLenght)
      return this.updateGraph()
    },

    onData (data) {
      this.clean()
      if (!data) {
        this.internaldata.root = null
        return
      }
      const root = d3.hierarchy(data).sort((a, b) => { return compareString(a.data.text, b.data.text) })
      this.internaldata.root = root
      const map = this.internaldata.map = {}
      root.each(d => {
        const id = this.identifier(d.data)
        d.id = id
        map[id] = d
      })
      const size = this.getSize()
      root.x = size.height / 2
      root.y = 0
      root.x0 = root.x
      root.y0 = root.y
      this.redraw()
    },

    onLinks (links) {
      if (!this.data) {
        return
      }

      const {map, g} = this.internaldata
      const line = d3.radialLine()
              .radius(d => d.y)
              .angle(d => d.x / 180 * Math.PI)
              .curve(d3.curveBundle.beta(0.95))

      const processedLinks = links.map(link => ({source: map[link.source], target: map[link.target]}))
      console.log(processedLinks)

      const edges = g.selectAll('.link').data(processedLinks)

      edges.enter().append('path').attr('class', 'link')
            .merge(edges).attr('d', d => line(d.source.path(d.target)))

      edges.exit().remove()
    },

    clean () {
      ['.nodetree', 'text', '.link'].forEach(selector => {
        this.internaldata.g.selectAll(selector).transition().duration(this.duration).attr('opacity', 0).remove()
      })
    },

    instantClean () {
      ['.nodetree', 'text', '.link'].forEach(selector => {
        this.internaldata.g.selectAll(selector).remove()
      })
    },

    redraw () {
      const root = this.internaldata.root
      if (root) {
        return this.updateGraph(root)
      }
      return Promise.resolve('no graph')
    },

    applyTransition (size, {margin}) {
      const {g} = this.internaldata
      const transitiong = g.transition().duration(this.duration)
      this.transformSvg(transitiong, size)
    }
  },

  computed: {
    tree () {
      const size = this.getSize()
      const tree = d3.cluster()
      this.layout.size(tree, size, this.margin, this.maxTextLenght)
      return tree
    },

    margin () {
      return {x: this.marginX, y: this.marginY}
    }
  },

  watch: {
    data (current, old) {
      this.onData(current)
    },

    links (current, old) {
      this.onLinks(current)
    },

    marginX (newMarginX, oldMarginX) {
      this.completeRedraw({margin: {x: oldMarginX, y: this.marginY}})
    },

    marginY (newMarginY, oldMarginY) {
      this.completeRedraw({margin: {x: this.marginX, y: oldMarginY}})
    }
  }
}
</script>

<style>
.graph .nodetree text {
  font: 10px sans-serif;
}

.graph .nodetree.selected text {
  font-weight: bold;
}

.graph .link {
  fill: none;
  stroke: #555;
  stroke-opacity: 0.4;
  stroke-width: 1.5px;
}
</style>
