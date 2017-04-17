<template>
  <div class="viewport treeclass" v-resize="resize">
  </div>
</template>
<script>
import resize from 'vue-resize-directive'
import euclidian from './euclidian-layout'
import circular from './circular-layout'

import * as d3 from 'd3'
import * as d3Hierarchy from 'd3-hierarchy'
Object.assign(d3, d3Hierarchy)

function mapMany (arr, mapper) {
  return arr.reduce(function (prev, curr) {
    return prev.concat(mapper(curr))
  }, [])
}

const layout = {
  euclidian,
  circular
}

var i = 0
var currentSelected = null
const types = ['tree', 'cluster']
const layouts = ['circular', 'euclidian']

const props = {
  data: Object,
  duration: {
    type: Number,
    default: 750
  },
  type: {
    type: String,
    default: 'tree',
    validator (value) {
      return types.indexOf(value) !== -1
    }
  },
  layoutType: {
    type: String,
    default: 'euclidian',
    validator (value) {
      return layouts.indexOf(value) !== -1
    }
  },
  marginX: {
    type: Number,
    default: 20
  },
  marginY: {
    type: Number,
    default: 20
  },
  nodeText: {
    type: String,
    required: true
  },
  zoomable: {
    type: Boolean,
    default: false
  }
}

const directives = {
  resize
}

function compareString (a, b) {
  return (a < b) ? -1 : (a > b) ? 1 : 0
}

function drawLink (source, target, {transformNode}) {
  return 'M' + transformNode(source.x, source.y) +
         'C' + transformNode(source.x, (source.y + target.y) / 2) +
         ' ' + transformNode(target.x, (source.y + target.y) / 2) +
         ' ' + transformNode(target.x, target.y)
}

function hasChildren (d) {
  return d.children || d._children
}

function getChildren (d) {
  return d.children ? {children: d.children, visible: true} : (d._children ? {children: d._children, visible: false} : null)
}

function onAllChilddren (d, callback, fatherVisible = undefined) {
  if (callback(d, fatherVisible) === false) {
    return
  }
  var directChildren = getChildren(d)
  directChildren && directChildren.children.forEach(child => onAllChilddren(child, callback, directChildren.visible))
}

function findInParents (node, nodes) {
  if (nodes.indexOf(node) !== -1) {
    return node
  }

  const parent = node.parent
  return (parent === null) ? node : findInParents(parent, nodes)
}

function removeTextAndGraph (selection) {
  ['circle', 'text'].forEach(select => {
    selection.selectAll(select).remove()
  })
}

function translate (vector, {transformNode}) {
  return 'translate(' + transformNode(vector.x, vector.y) + ')'
}

function anchorTodx (d, el) {
  if (d === 'middle') {
    return -el.getBBox().width / 2
  } else if (d === 'end') {
    return -el.getBBox().width
  }
  return 0
}

export default {
  props,

  directives,

  data () {
    return {
      currentTransform: null
    }
  },

  mounted () {
    const size = this.getSize()
    const svg = d3.select(this.$el).append('svg')
          .attr('width', size.width)
          .attr('height', size.height)
    let g = null
    let zoom = null

    if (this.zoomable) {
      g = svg.append('g')
      zoom = d3.zoom().scaleExtent([1, 8]).on('zoom', this.zoomed(g))
      svg.call(zoom)
      g.call(zoom.transform, d3.zoomIdentity)
    } else {
      g = this.layout.transformSvg(svg.append('g'), this.margin, size)
    }

    const tree = this.tree
    this.internaldata = {
      svg,
      g,
      tree,
      zoom
    }

    if (this.data) {
      this.onData(this.data)
    }

    window.onfocus = () => { this.completeRedraw() }
  },

  methods: {
    getSize () {
      var width = this.$el.clientWidth
      var height = this.$el.clientHeight
      return { width, height }
    },

    resize () {
      const size = this.getSize()
      this.internaldata.svg
              .attr('width', size.width)
              .attr('height', size.height)

      this.layout.size(this.internaldata.tree, size, this.margin)
      this.applyZoom(size)
      this.redraw()
    },

    completeRedraw (noTransition = true) {
      const size = this.getSize()
      this.applyTransitionZoom(size)
      this.layout.size(this.internaldata.tree, size, this.margin)
      this.redraw()
    },

    updateGraph (source) {
      let originBuilder = source
      let forExit = source
      if (typeof source === 'object') {
        const origin = {x: source.x0, y: source.y0}
        originBuilder = d => origin
        forExit = d => ({x: source.x, y: source.y})
      }

      const root = this.internaldata.root
      const links = this.internaldata.g.selectAll('.linktree')
         .data(this.internaldata.tree(root).descendants().slice(1), d => d.id)

      const updateLinks = links.enter().append('path')
                    .attr('class', 'linktree')
                    .attr('d', d => drawLink(originBuilder(d), originBuilder(d), this.layout))

      const updateAndNewLinks = links.merge(updateLinks)
      updateAndNewLinks.transition().duration(this.duration).attr('d', d => drawLink(d, d.parent, this.layout))

      links.exit().transition().duration(this.duration).attr('d', d => drawLink(forExit(d), forExit(d), this.layout)).remove()

      const node = this.internaldata.g.selectAll('.nodetree').data(root.descendants(), d => { return d.id })

      const newNodes = node.enter().append('g')
                .attr('class', 'nodetree')
                .attr('transform', d => translate(originBuilder(d), this.layout))

      const allNodes = newNodes.merge(node)
      allNodes.classed('node--internal', d => hasChildren(d))
        .classed('node--leaf', d => !hasChildren(d))
        .classed('selected', d => d === currentSelected)
        .on('click', this.onNodeClick)

      allNodes.transition().duration(this.duration)
        .attr('transform', d => translate(d, this.layout))
        .attr('opacity', 1)

      removeTextAndGraph(node)

      allNodes.append('circle')

      const text = allNodes.append('text')
        .attr('dy', '.35em')
        .text(d => { return d.data[this.nodeText] })
        .on('click', d => {
          currentSelected = (currentSelected === d) ? null : d
          d3.event.stopPropagation()
          this.redraw()
          this.$emit('clicked', {element: d, data: d.data})
        })

      text.attr('x', d => { return d.textInfo ? d.textInfo.x : 0 })
          .attr('dx', function (d) { return d.textInfo ? anchorTodx(d.textInfo.anchor, this) : 0 })
          .attr('transform', d => 'rotate(' + (d.textInfo ? d.textInfo.rotate : 0) + ')')

      const transformer = this.layout.transformText
      allNodes.each((d) => {
        d.textInfo = transformer(d, hasChildren(d))
      })

      text.transition().duration(this.duration)
          .attr('x', d => d.textInfo.x)
          .attr('dx', function (d) { return anchorTodx(d.textInfo.anchor, this) })
          .attr('transform', d => `rotate(${d.textInfo.rotate})`)

      allNodes.each((d) => {
        d.x0 = d.x
        d.y0 = d.y
      })

      const exitingNodes = node.exit()
      exitingNodes.transition().duration(this.duration)
                  .attr('transform', d => translate(forExit(d), this.layout))
                  .attr('opacity', 0).remove()
      exitingNodes.select('circle').attr('r', 1e-6)
    },

    onNodeClick (d) {
      if (d.children) {
        this.collapse(d)
      } else {
        this.expand(d)
      }
    },

    onData (data) {
      if (!data) {
        this.internaldata.root = null
        this.clean()
        return
      }
      const root = d3.hierarchy(data).sort((a, b) => { return compareString(a.data.text, b.data.text) })
      this.internaldata.root = root
      root.each(d => { d.id = i++ })
      const size = this.getSize()
      root.x = size.height / 2
      root.y = 0
      root.x0 = root.x
      root.y0 = root.y
      this.redraw()
    },

    clean () {
      ['.linktree', '.nodetree', 'text', 'circle'].forEach(selector => {
        this.internaldata.g.selectAll(selector).transition().duration(this.duration).attr('opacity', 0).remove()
      })
    },

    redraw () {
      const root = this.internaldata.root
      if (root) {
        this.updateGraph(root)
      }
    },

    getNodeOriginComputer (originalVisibleNodes) {
      return node => {
        const parentVisible = findInParents(node, originalVisibleNodes)
        return {x: parentVisible.x0, y: parentVisible.y0}
      }
    },

    applyZoom (size) {
      const {g, zoom} = this.internaldata
      if (this.zoomable) {
        g.call(zoom.transform, this.currentTransform)
      } else {
        size = size || this.getSize()
        this.internaldata.g = this.layout.transformSvg(g, this.margin, size)
      }
    },

    applyTransitionZoom (size) {
      const {g, zoom} = this.internaldata
      const transitiong = g.transition().duration(this.duration)
      console.log(zoom)
      if (this.zoomable) {
        transitiong.call(zoom.transform, this.currentTransform)
      }
      // else {
      this.layout.transformSvg(transitiong, this.margin, size)
     // }
    },

    zoomed (g) {
      return () => {
        const transform = d3.event.transform
        const size = this.getSize()
        const transformToApply = this.layout.updateTransform(transform, this.margin, size)
        this.currentTransform = transform
        this.$emit('zoom', {transform})
        g.attr('transform', transformToApply)
      }
    },

    // API

    collapse (d, update = true) {
      if (!d.children) {
        return false
      }

      d._children = d.children
      d.children = null
      this.$emit('retract', {element: d, data: d.data})
      update && this.updateGraph(d)
      return true
    },

    expand (d, update = true) {
      if (d.children) {
        return false
      }

      d.children = d._children
      d._children = null
      this.$emit('expand', {element: d, data: d.data})
      update && this.updateGraph(d)
      return true
    },

    expandAll (d, update = true) {
      const lastVisible = d.leaves()
      onAllChilddren(d, child => { this.expand(child, false) })
      update && this.updateGraph(this.getNodeOriginComputer(lastVisible))
    },

    collapseAll (d, update = true) {
      onAllChilddren(d, child => this.collapse(child, false))
      update && this.updateGraph(d)
    },

    show (d, update = true) {
      const path = d.ancestors().reverse()
      const root = path.find(node => node.children === null) || d
      path.forEach(node => this.expand(node, false))
      update && this.updateGraph(root)
    },

    showOnlyChildren (d) {
      const root = this.internaldata.root
      const path = d.ancestors().reverse()
      const shouldBeRetracted = mapMany(path, p => p.children).filter(node => node !== null && (path.indexOf(node) === -1))
      const mapped = {}
      shouldBeRetracted.filter(node => node.children)
                      .forEach(rectractedNode => rectractedNode.each(c => { mapped[c.id] = rectractedNode }))
      const origin = node => {
        const reference = mapped[node.id]
        return {x: reference.x, y: reference.y}
      }
      const updater = node => {
        if (shouldBeRetracted.indexOf(node) !== -1) {
          this.collapse(node, false)
          return false
        }
        return (node !== d)
      }
      onAllChilddren(root, updater)
      this.updateGraph(origin)
    }
  },

  computed: {
    tree () {
      const size = this.getSize()
      const tree = this.type === 'cluster' ? d3.cluster() : d3.tree()
      this.layout.size(tree, size, this.margin)
      return tree
    },

    margin () {
      return {x: this.marginX, y: this.marginY}
    },

    layout () {
      return layout[this.layoutType]
    }
  },

  watch: {
    data (current, old) {
      this.onData(current)
    },

    type () {
      if (!this.internaldata.tree) {
        return
      }
      this.internaldata.tree = this.tree
      this.redraw()
    },

    marginX () {
      this.completeRedraw()
    },

    marginY () {
      this.completeRedraw()
    },

    layoutType () {
      this.completeRedraw()
    }
  }
}
</script>

<style>
.treeclass .nodetree  circle {
  fill: #999;
  r: 2.5;
}

.treeclass .node--internal circle {
  cursor: pointer;
  fill:  #555;
  r: 3;
}

.treeclass .nodetree text {
  font: 10px sans-serif;
  cursor: pointer;
}

.treeclass .nodetree.selected text {
  font-weight: bold;
}

.treeclass .node--internal text {
  text-shadow: 0 1px 0 #fff, 0 -1px 0 #fff, 1px 0 0 #fff, -1px 0 0 #fff;
}

.treeclass .linktree {
  fill: none;
  stroke: #555;
  stroke-opacity: 0.4;
  stroke-width: 1.5px;
}
</style>
