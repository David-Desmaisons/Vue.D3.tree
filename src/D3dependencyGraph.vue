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
    required: true
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
      layout,
      textContraint: null
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
      this.layout.optimizeSize(tree, size, this.margin, this.textContraint)
      this.redraw()
    },

    completeRedraw ({margin = null}) {
      const size = this.getSize()
      this.layout.optimizeSize(this.internaldata.tree, size, this.margin, this.textContraint)
      this.applyTransition(size, {margin})
      this.redraw()
    },

    transformSvg (g, size) {
      size = size || this.getSize()
      return this.layout.transformSvg(g, this.margin, size)
    },

    updateTransform (g, size) {
      size = size || this.getSize()
      return this.layout.updateTransform(g, this.margin, size)
    },

    updateNodes () {
      const {root, g, tree} = this.internaldata

      tree(root)
      const node = g.selectAll('.nodetree').data(root.leaves(), d => d.id)
      const newNodes = node.enter().append('g').attr('class', 'nodetree')
      newNodes.on('mouseover', this.mouseOvered).on('mouseout', this.mouseOuted)

      const allNodes = this.internaldata.nodes = newNodes.merge(node).attr('transform', d => translate(d, this.layout))

      removeTextAndGraph(node)

      const allNodesPromise = toPromise(allNodes.transition().duration(this.duration).attr('opacity', 1))

      const {transformText, transformNode} = this.layout
      allNodes.each((d) => {
        d.textInfo = transformText(d, false)
      })
      const text = allNodes.append('text')
        .attr('dy', '.35em')
        .text(d => d.data[this.nodeText])
        .attr('x', d => d.textInfo.x)
        .attr('dx', function (d) { return anchorTodx(d.textInfo.anchor, this) })
        .attr('transform', d => `rotate(${d.textInfo.rotate})`)

      const tentative = []
      text.each(function (d) { tentative.push({ node: this, data: d, pos: transformNode(d.x, this.getComputedTextLength() + 6) }) })

      const getMaxNode = (position) => {
        const mapped1 = tentative.map(el => ({ node: el.node, x: el.data.x, value: Math.abs(el.pos[position]) }))
        const max = Math.max(...mapped1.map(el => el.value))
        return mapped1.find(el => el.value === max)
      }
      const xExtreme = getMaxNode(0)
      const yExtreme = getMaxNode(1)
      const textContraint = {xExtreme, yExtreme}

      if ((this.textContraint) && (this.textContraint.xExtreme.value === xExtreme.value) &&
            (this.textContraint.yExtreme.value === yExtreme.value)) {
        return allNodesPromise
      }

      this.instantClean()
      this.textContraint = textContraint
      const size = this.getSize()
      this.transformSvg(g, size)
      this.layout.optimizeSize(tree, size, this.margin, this.textContraint)
      return this.updateNodes()
    },

    updateLinks () {
      const {g, links} = this.internaldata
      if (!links) {
        return
      }
      const edges = g.selectAll('.link').data(links)
      const line = this.layout.getLine(d3).curve(d3.curveBundle.beta(0.95))

      const newEdges = edges.enter().append('path').attr('class', 'link')

      const allEdges = this.internaldata.edges = edges.merge(newEdges)
      const promise = toPromise(allEdges.transition().duration(this.duration)
                                    .attr('opacity', 1).attr('d', d => line(d.source.path(d.target))))

      edges.exit().remove()
      return promise
    },

    mouseOvered (d) {
      const {edges, nodes} = this.internaldata
      if (!edges) {
        return
      }
      nodes.each(function (n) { n.target = n.source = false })

      edges.classed('link--target', function (l) {
        if (l.target === d) {
          l.source.source = true
          return true
        }
      })
      .classed('link--source', function (l) {
        if (l.source === d) {
          l.target.target = true
          return true
        }
      })
      .classed('link--ignored', function (l) {
        return (l.source !== d) && ((l.target !== d))
      })
      .filter(function (l) { return l.target === d || l.source === d })
      .raise()

      nodes.classed('node--target', n => n.target)
          .classed('node--source', n => n.source)
          .classed('node--ignored', n => ((!n.target) && (!n.source) && (n !== d)))
    },

    mouseOuted (d) {
      const {edges, nodes} = this.internaldata
      if (!edges) {
        return
      }
      edges.classed('link--target', false)
          .classed('link--source', false)
          .classed('link--ignored', false)

      nodes.classed('node--target', false)
          .classed('node--source', false)
          .classed('node--ignored', false)
    },

    onData (data) {
      this.clean()
      if (!data) {
        this.internaldata.root = this.internaldata.nodes = null
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
      this.updateNodes()
    },

    onLinks (links) {
      if (!this.data) {
        return
      }

      if (!links) {
        this.internaldata.links = this.internaldata.edges = null
      }

      const {map} = this.internaldata
      this.internaldata.links = links.map(link => ({source: map[link.source], target: map[link.target]}))
      this.updateLinks()
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
      const {root} = this.internaldata
      return root ? Promise.all([this.updateNodes(), this.updateLinks()]) : Promise.resolve('no graph')
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
      this.layout.optimizeSize(tree, size, this.margin, this.textContraint)
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
  transition: all 0.5s;
}

.graph .nodetree.selected text {
  font-weight: bold;
}

.graph .link {
  fill: none;
  stroke: blue;
  stroke-opacity: 0.3;
  stroke-width: 1.5px;
  transition: stroke 0.5s, opacity 0.5s;
}

.graph .nodetree.node--source text{
  fill: #2ca02c;
  font-weight: bold;
}

.graph .nodetree.node--target text{
  fill: #d62728;
  font-weight: bold;
}

.graph .nodetree:hover text{
  font-weight: bold;
}

.graph .nodetree.node--ignored text{
  opacity: 0.4;
}

.graph .link--source,
.graph .link--target {
  stroke-opacity: 1;
}

.graph .link--ignored {
  stroke-opacity: 0.1;
}

.graph .link--source {
  stroke: #d62728;
}

.graph .link--target {
  stroke: #2ca02c;
}
</style>
