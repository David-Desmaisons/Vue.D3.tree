<template>
  <div :class="rootClass" v-resize="resize">
  </div>
</template>
<script>
import resize from 'vue-resize-directive'
import layout from './circular-layout'
import {anchorTodx, compareNode, removeTextAndGraph, roundPath, toPromise, translate, updateTexts} from './d3-utils'

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
  rootClass: {
    type: String,
    default: 'graph'
  },
  marginY: {
    type: Number,
    default: 0
  },
  maxTextWidth: {
    type: Number,
    default: -1
  },
  nodeText: {
    type: String,
    required: true
  },
  identifier: {
    required: true,
    validator (value) {
      const valueType = typeof value
      return (valueType === 'string') || (valueType === 'function')
    }
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
  name: 'HierarchicalEdgeBundling',

  props,

  directives,

  data () {
    return {
      textContraint: null,
      highlightedNode: null
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
    this.$el.addEventListener('click', this.handleClickOutside, true)
  },

  beforeDestroy () {
    this.$el.removeEventListener('click', this.handleClickOutside, true)
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
      layout.optimizeSize(tree, size, this.margin, this.textContraint)
      this.redraw()
    },

    handleClickOutside (ev) {
      const el = this.internaldata.svg.node()
      if ((el === ev.target) || (!el.contains(ev.target))) {
        this.$emit('clickOutsideGraph')
      }
    },

    completeRedraw ({margin = null}) {
      const size = this.getSize()
      layout.optimizeSize(this.internaldata.tree, size, this.margin, this.textContraint)
      this.applyTransition(size, {margin})
      this.redraw()
    },

    transformSvg (g, size) {
      size = size || this.getSize()
      return layout.transformSvg(g, this.margin, size)
    },

    updateTransform (g, size) {
      size = size || this.getSize()
      return layout.updateTransform(g, this.margin, size)
    },

    updateNodes () {
      const {root, g, tree} = this.internaldata

      tree(root)
      const node = g.selectAll('.nodetree').data(root.leaves(), d => d._id)
      const newNodes = node.enter().append('g').attr('class', 'nodetree')
      newNodes.on('mouseover', this.mouseOvered).on('mouseout', this.mouseOuted).on('click', this.nodeClick)

      const allNodes = this.internaldata.nodes = newNodes.merge(node)

      removeTextAndGraph(node)

      const allNodesPromise = toPromise(allNodes.transition().duration(this.duration).attr('transform', d => translate(d, layout)).attr('opacity', 1))

      const {transformText, transformNode} = layout
      allNodes.each((d) => {
        d.textInfo = transformText(d, false)
      })
      const text = allNodes.append('text')
        .attr('dy', '.35em')
        .text(d => d.data[this.nodeText])
        .attr('x', d => d.textInfo.x)
        .call(updateTexts, this.maxTextWidth)
        .each(function (d) {
          if (d.textInfo.standardDx == null) {
            d.textInfo.standardDx = anchorTodx(d.textInfo.anchor, this)
          }
        })
        .attr('dx', d => d.textInfo.standardDx)
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
      layout.optimizeSize(tree, size, this.margin, this.textContraint)
      return this.updateNodes()
    },

    updateLinks () {
      const {g, links} = this.internaldata
      if (!links) {
        return
      }
      const edges = g.selectAll('.link').data(links, l => l.source._id + '-' + l.target._id + '-' + l.type)
      const line = layout.getLine(d3).curve(d3.curveBundle.beta(0.95))

      const newEdges = edges.enter().append('path').attr('class', 'link')
                            .attr('d', d => roundPath(line(d.source.path(d.target).map(p => ({x: p.x, y: 0.1})))))

      const allEdges = this.internaldata.edges = edges.merge(newEdges)
      const promise = toPromise(allEdges.transition().duration(this.duration).attr('d', d => roundPath(line(d.source.path(d.target)))))

      edges.exit().remove()
      return promise
    },

    mouseOvered (d) {
      this.emit('mouseNodeOver', d)
    },

    mouseOuted (d) {
      this.emit('mouseNodeOut', d)
    },

    nodeClick (d) {
      this.emit('mouseNodeClick', d)
    },

    emit (name, d) {
      this.$emit(name, {element: d, data: d.data})
    },

    showDependencies (d) {
      const {edges, nodes} = this.internaldata
      if (!edges) {
        return
      }
      nodes.each(n => { n.target = n.source = false })

      const rootElement = d3.selectAll([this.$el]).style('display', 'none').classed('detailed', true)

      edges.filter(l => l.target === d || l.source === d)
      .classed('link--target', function (l) {
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
      .raise()

      const nodesSelected = nodes.filter(n => ((n.target) || (n.source) || (n === d)))
        .classed('node--target', n => n.target)
        .classed('node--source', n => n.source)
        .classed('node--selected', n => n === d)

      rootElement.style('display', 'block')
      nodesSelected.select('text').each(function (d) {
        if (d.textInfo.zoomedDx == null) {
          d.textInfo.zoomedDx = anchorTodx(d.textInfo.anchor, this)
        }
      }).attr('dx', d => d.textInfo.zoomedDx)
    },

    reset (d) {
      const {edges, nodes} = this.internaldata
      if (!edges) {
        return
      }
      const rootElement = d3.selectAll([this.$el]).style('display', 'none').classed('detailed', false)

      edges.classed('link--target', false)
          .classed('link--source', false)

      nodes.classed('node--target', false)
          .classed('node--source', false)
          .classed('node--selected', false)

      nodes.filter(n => ((n.target) || (n.source) || (n === d)))
          .select('text').attr('dx', d => d.textInfo.standardDx)

      rootElement.style('display', 'block')
    },

    onData (data) {
      if (!data) {
        this.internaldata.root = this.internaldata.nodes = null
        return
      }
      const root = d3.hierarchy(data).sort((a, b) => compareNode(a, b, this.nodeText))
      this.internaldata.root = root
      this.$emit('nodesComputed', root)
      const map = this.internaldata.map = {}
      const identifier = this.identifier
      const idGetter = typeof identifier === 'string' ? data => data[identifier] : identifier
      root.each(d => {
        const id = idGetter(d.data)
        d._id = id
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
      this.internaldata.links = links.map(link => ({source: map[link.source], target: map[link.target], type: link.type}))
      this.updateLinks()
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
      layout.optimizeSize(tree, size, this.margin, this.textContraint)
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
    },

    highlightedNode (newCurrent, oldCurrent) {
      oldCurrent && this.reset(oldCurrent)
      newCurrent && this.showDependencies(newCurrent)
      this.$emit('highlightedNodeChanged', {new: newCurrent, old: oldCurrent})
    }
  }
}
</script>

<style>
.graph .link {
  fill: none;
  stroke: blue;
  stroke-opacity: 0.2;
  stroke-width: 1.5px;
  transition: stroke 0.5s, stroke-opacity 0.5s;
}

.graph.detailed .link.link--source,
.graph.detailed .link.link--target {
  stroke-opacity: 1;
}

.graph.detailed .link {
  stroke-opacity: 0.01;
}

.graph .link.link--source {
  stroke: #d62728;
}

.graph .link.link--target {
  stroke: #2ca02c;
}

.graph .nodetree text {
  font: 10px sans-serif;
  transition: opacity 0.5s, fill 0.5s;
}

.graph.detailed .nodetree.node--source text{
  fill: #2ca02c;
}

.graph.detailed .nodetree.node--target text{
  fill: #d62728;
}

.graph.detailed .nodetree.node--selected text,
.graph.detailed .nodetree.node--source text,
.graph.detailed .nodetree.node--target text{
  font-weight: bold;
  opacity: 1;
}

.graph.detailed .nodetree text{
  opacity: 0.1;
}
</style>
