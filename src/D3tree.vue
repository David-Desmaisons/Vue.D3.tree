<template>
  <div class="viewport treeclass">
  </div>
</template>
<script>
import euclidianLayout from './euclidian-layout'
import circularLayout from './circular-layout'

import * as d3 from 'd3'
import * as d3Hierarchy from 'd3-hierarchy'
Object.assign(d3, d3Hierarchy)

var i = 0
var currentSelected = null
const types = ['tree', 'cluster']

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
  marginX: {
    type: Number,
    default: 20
  },
  marginY: {
    type: Number,
    default: 20
  }
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

function removeTextAndGraph (selection) {
  ['circle', 'text'].forEach(select => {
    selection.selectAll(select).remove()
  })
}

function translate (vector, {transformNode}) {
  return 'translate(' + transformNode(vector.x, vector.y) + ')'
}

export default {
  props,

  mounted () {
    this.layout = euclidianLayout
    this.layout = circularLayout
    const size = this.getSize()
    const svg = d3.select(this.$el).append('svg')
          .attr('width', size.width)
          .attr('height', size.height)
    const g = svg
    const tree = this.tree
    this.internaldata = {
      svg,
      g,
      tree
    }
    this.sizeSvg()

    window.onresize = this.resize.bind(this)

    if (this.data) {
      this.onData(this.data)
    }
  },

  methods: {
    sizeSvg () {
      this.layout.transformSvg(this.internaldata.svg, this.margin, this.getSize())
    },

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
      this.redraw()
    },

    updateGraph (source) {
      const origin = {
        x: source.x0,
        y: source.y0
      }

      const root = this.internaldata.root
      const links = this.internaldata.g.selectAll('.linktree')
         .data(this.internaldata.tree(root).descendants().slice(1), d => { return d.id })

      const updateLinks = links.enter().append('path')
                    .attr('class', 'linktree')
                    .attr('d', d => { return drawLink(origin, origin, this.layout) })

      const updateAndNewLinks = links.merge(updateLinks)
      updateAndNewLinks.transition().duration(this.duration).attr('d', d => { return drawLink(d, d.parent, this.layout) })

      links.exit().transition().duration(this.duration).attr('d', d => { return drawLink(source, source, this.layout) }).remove()

      const node = this.internaldata.g.selectAll('.nodetree').data(root.descendants(), d => { return d.id })

      const newNodes = node.enter().append('g')
                .attr('class', 'nodetree')
                .attr('transform', d => { return translate(origin, this.layout) })

      const allNodes = newNodes.merge(node)
      allNodes.classed('node--internal', d => { return hasChildren(d) })
        .classed('node--leaf', d => { return !hasChildren(d) })
        .classed('selected', d => { return d === currentSelected })
        .on('click', this.onNodeClick)

      allNodes.transition().duration(this.duration)
        .attr('transform', d => { return translate(d, this.layout) })
        .attr('opacity', 1)

      removeTextAndGraph(node)

      allNodes.append('circle')

      allNodes.append('text')
        .attr('x', d => { return hasChildren(d) ? -13 : 13 })
        .attr('dy', '.35em')
        .attr('text-anchor', d => { return hasChildren(d) ? 'end' : 'start' })
        .text(d => { return d.data.text })
        .on('click', d => {
          currentSelected = (currentSelected === d) ? null : d
          d3.event.stopPropagation()
          this.redraw()
        })

      allNodes.each(function (d) {
        d.x0 = d.x
        d.y0 = d.y
      })

      const exitingNodes = node.exit()
      exitingNodes.transition().duration(this.duration)
                  .attr('transform', d => { return translate(source, this.layout) })
                  .attr('opacity', 0).remove()
      exitingNodes.select('circle').attr('r', 1e-6)
    },

    onNodeClick (d) {
      if (d.children) {
        d._children = d.children
        d.children = null
      } else {
        d.children = d._children
        d._children = null
      }
      this.updateGraph(d)
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
