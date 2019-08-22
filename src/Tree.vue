<script>
import resize from 'vue-resize-directive'
import { interpolatePath } from 'd3-interpolate-path'

import horizontal from './layout/horizontal'
import vertical from './layout/vertical'
import circular from './layout/circular'
import { drawLink as bezier } from './linkLayout/bezier'
import { drawLink as orthogonal } from './linkLayout/orthogonal'
import standardBehavior from './behaviors/StandardBehavior'
import {compareString, toPromise, findInParents, mapMany, translate} from './d3-utils'
import {renderInVueContext, renderTemplateSlot} from './vueHelper'

import * as d3 from 'd3'

const layout = {
  horizontal,
  circular,
  vertical
}

const linkLayouts = {
  bezier,
  orthogonal
}

var i = 0
const types = ['tree', 'cluster']
const layouts = ['circular', 'horizontal', 'vertical']
const nodeDisplays = ['all', 'leaves', 'extremities']
const linkLayoutsType = ['bezier', 'orthogonal']

const props = {
  data: {
    type: Object,
    required: false
  },
  selected: {
    type: Object,
    required: false
  },
  duration: {
    type: Number,
    default: 750
  },
  type: {
    type: String,
    default: 'tree',
    validator (value) {
      return types.includes(value)
    }
  },
  layoutType: {
    type: String,
    default: 'horizontal',
    validator (value) {
      return layouts.includes(value)
    }
  },
  linkLayout: {
    type: String,
    default: 'bezier',
    validator (value) {
      return linkLayoutsType.includes(value)
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
    default: 'name'
  },
  identifier: {
    type: Function,
    default: () => i++
  },
  zoomable: {
    type: Boolean,
    default: false
  },
  minZoom: {
    type: Number,
    default: 0.8
  },
  maxZoom: {
    type: Number,
    default: 9
  },
  nodeTextDisplay: {
    type: String,
    default: 'all',
    validator (value) {
      return nodeDisplays.includes(value)
    }
  },
  radius: {
    type: Number,
    default: 3
  },
  leafTextMargin: {
    type: Number,
    default: 6
  },
  nodeTextMargin: {
    type: Number,
    default: 6
  }
}

const directives = {
  resize
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

function filterTextNode (nodeTextDisplay, root) {
  switch (nodeTextDisplay) {
    case 'all':
      return d => true

    case 'leaves':
      return d => !hasChildren(d)

    case 'extremities':
      return d => !hasChildren(d) || d === root
  }
}

export default {
  name: 'D3Tree',

  props,

  directives,

  model: {
    prop: 'selected',
    event: 'change'
  },

  render (h) {
    const {setSelected, collapse, collapseAll, expand, expandAll, show, toggleExpandCollapse} = this
    const rawActions = {setSelected, collapse, collapseAll, expand, expandAll, show, toggleExpandCollapse}
    this.actions = Object.keys(rawActions).reduce((current, key) => {
      current[key] = rawActions[key].bind(this)
      return current
    }, {})
    const getProps = () => {
      const {actions, graphNodes: nodes} = this
      return {nodes, actions}
    }
    this._behaviour = renderTemplateSlot(getProps, this.$scopedSlots.behavior, standardBehavior)
    return h('div', {class: 'viewport treeclass', directives: [{name: 'resize', value: this.resize}]})
  },

  data () {
    return {
      currentTransform: null,
      maxTextLenght: {
        first: 0,
        last: 0
      },
      graphNodes: {
        clickedNode: null,
        clickedText: null
      }
    }
  },

  mounted () {
    const size = this.getSize()
    const svg = d3.select(this.$el).append('svg')
          .attr('width', size.width)
          .attr('height', size.height)
    const {zoomable, tree} = this
    const g = zoomable ? svg.append('g') : this.transformSvg(svg.append('g'), size)

    this.internaldata = {
      svg,
      g,
      tree
    }

    this.internaldata.zoom = zoomable ? this.setUpZoom() : null
    this.data && this.onData(this.data)
  },

  methods: {
    setSelected (node) {
      this.$emit('change', node)
    },

    getSize () {
      const {$el: {clientWidth: width, clientHeight: height}} = this
      return { width, height }
    },

    resize () {
      const size = this.getSize()
      this.internaldata.svg
              .attr('width', size.width)
              .attr('height', size.height)
      this.layout.size(this.internaldata.tree, size, this.margin, this.maxTextLenght)
      this.applyZoom(size)
      this.redraw()
    },

    setUpZoom () {
      const { minZoom, maxZoom, internaldata: { svg, g } } = this
      const zoom = d3.zoom().scaleExtent([minZoom, maxZoom])
      zoom.on('zoom', this.zoomed(g))
      svg.call(zoom).on('wheel', () => d3.event.preventDefault())
      svg.call(zoom.transform, this.currentTransform || d3.zoomIdentity)
      return zoom
    },

    removeZoom () {
      const { internaldata } = this
      internaldata.zoom.on('zoom', null)
      internaldata.zoom = null
    },

    updateZoom () {
      if (!this.zoomable) {
        return
      }
      this.removeZoom()
      this.setUpZoom()
    },

    completeRedraw ({margin = null, layout = null}) {
      const size = this.getSize()
      this.layout.size(this.internaldata.tree, size, this.margin, this.maxTextLenght)
      this.applyTransition(size, {margin, layout})
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

    updateGraph (source) {
      source = source || this.internaldata.root
      let originBuilder = source
      let forExit = source
      const originAngle = source.layoutInfo ? source.layoutInfo.rotate : 0
      const origin = {x: source.x0, y: source.y0}

      if (arguments.length === 0) {
        originBuilder = d => {
          if (d.parent == null) {
            return origin
          }
          if (d.parent.x0 !== undefined) {
            return {x: d.parent.x0, y: d.parent.y0}
          }
          if (d.parent._x0 !== undefined) {
            return {x: d.parent._x0, y: d.parent._y0}
          }
          return origin
        }
        forExit = d => ({x: source.x, y: source.y})
        source = this.internaldata.root
      } else if (typeof source === 'object') {
        originBuilder = d => origin
        forExit = d => ({x: source.x, y: source.y})
      }

      const root = this.internaldata.root
      const links = this.internaldata.g.selectAll('.linktree')
         .data(this.internaldata.tree(root).descendants().slice(1), d => d.id)

      const newLinks = links.enter().append('path').attr('class', 'linktree').lower()
      const nodes = this.internaldata.g.selectAll('.nodetree').data(root.descendants(), d => d.id)
      const newNodes = nodes.enter().append('g').attr('class', d => `nodetree node-rank-${d.depth}`)
      const allNodes = newNodes.merge(nodes)

      nodes.each(function (d) {
        d._x0 = d.x
        d._y0 = d.y
      })

      const { layout, duration, drawLink } = this

      newLinks.attr('d', d => drawLink(originBuilder(d), originBuilder(d), layout))
      const updateAndNewLinks = links.merge(newLinks)
      const updateAndNewLinksPromise = toPromise(updateAndNewLinks
        .transition().duration(duration)
        .attrTween('d', function (d) {
          const previous = d3.select(this).attr('d')
          const final = drawLink(d, d.parent, layout)
          return interpolatePath(previous, final)
        })
      )
      const exitingLinksPromise = toPromise(links.exit().transition().duration(duration).attr('d', d => drawLink(forExit(d), forExit(d), layout)).remove())

      const {actions, radius, selected, $scopedSlots: {node}} = this
      const getHtml = node ? d => renderInVueContext({
        scope: node,
        props: {
          actions,
          radius,
          node: d,
          data: d.data,
          isRetracted: !!d._children,
          isSelected: d.data === selected
        }
      }, this.redraw) : d => `<circle r="${radius}"/>`

      newNodes.attr('transform', d => `${translate(originBuilder(d), layout)} rotate(${originAngle}) scale(0.1)`)
        .append('g')
        .attr('class', 'node')

      newNodes
        .append('text')
        .attr('dy', '.35em')
        .attr('x', 0)
        .attr('dx', 0)
        .on('click', this.onNodeTextClick)

      allNodes
        .select('.node')
        .html(getHtml)

      allNodes.classed('node--internal', d => hasChildren(d))
        .classed('node--leaf', d => !hasChildren(d))
        .classed('selected', d => d.data === selected)
        .on('click', this.onNodeClick)

      const { leafTextMargin, nodeTextMargin, layout: {layoutNode}, nodeTextDisplay } = this
      const showNode = filterTextNode(nodeTextDisplay, root)
      allNodes.filter(d => !showNode(d)).select('text').text('')
      const text = allNodes.filter(showNode).select('text').text(d => d.data[this.nodeText])

      allNodes.each((d) => {
        d.layoutInfo = layoutNode(hasChildren(d), {leaf: leafTextMargin, node: nodeTextMargin}, d)
      })

      const allNodesPromise = toPromise(allNodes.transition().duration(duration)
        .attr('transform', d => `${translate(d, layout)} rotate(${d.layoutInfo.rotate})`)
        .attr('opacity', 1))

      text.attr('x', d => d.layoutInfo.x)
          .attr('y', d => d.layoutInfo.y)
          .attr('text-anchor', d => d.layoutInfo.anchor)
          .attr('transform', d => `rotate(${d.layoutInfo.textRotate})`)

      allNodes.each((d) => {
        d.x0 = d.x
        d.y0 = d.y
      })

      const exitingNodes = nodes.exit()
      exitingNodes.select('.node').transition().duration(duration)
                  .attr('transform', 'scale(0.1)')

      const exitingNodesPromise = toPromise(exitingNodes.transition().duration(duration)
                  .attr('transform', d => `${translate(forExit(d), layout)} rotate(${d.parent.layoutInfo.rotate})`)
                  .attr('opacity', 0).remove())

      const leaves = root.leaves()
      const extremeNodes = text.filter(d => leaves.indexOf(d) !== -1).nodes()
      const last = Math.max(...extremeNodes.map(node => node.getComputedTextLength())) + leafTextMargin
      const first = text.node().getComputedTextLength() + leafTextMargin
      if (last <= this.maxTextLenght.last && first <= this.maxTextLenght.first) {
        this._scheduledRedraw = false
        return Promise.all([allNodesPromise, exitingNodesPromise, updateAndNewLinksPromise, exitingLinksPromise])
      }

      this.maxTextLenght = {first, last}
      const size = this.getSize()
      if (this.zoomable) {
        this.internaldata.svg.call(this.internaldata.zoom.transform, this.currentTransform)
      } else {
        const {g} = this.internaldata
        this.transformSvg(g, size)
      }
      this.layout.size(this.internaldata.tree, size, this.margin, this.maxTextLenght)
      return this.updateGraph(source)
    },

    onNodeTextClick (d) {
      this.graphNodes.clickedNode = null
      this.onEvent('clickedText', d)
    },

    onNodeClick (d) {
      this.graphNodes.clickedText = null
      this.onEvent('clickedNode', d)
    },

    onEvent (name, d) {
      this.graphNodes[name] = null
      this.graphNodes[name] = d
      this.$emit(name, {element: d, data: d.data})
      d3.event.stopPropagation()
    },

    toggleExpandCollapse (d) {
      if (!d) {
        return Promise.resolve(false)
      }
      return d.children ? this.collapse(d) : this.expand(d)
    },

    onData (data) {
      if (!data) {
        this.internaldata.root = null
        this.clean()
        return
      }
      const root = d3.hierarchy(data).sort((a, b) => { return compareString(a.data.text, b.data.text) })
      this.internaldata.root = root
      root.each(d => { d.id = this.identifier(d.data) })
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
      if (!this.internaldata.root || this._scheduledRedraw) {
        return
      }
      this._scheduledRedraw = true
      this.$nextTick(() => this.updateGraph())
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
        this.transformSvg(g, size)
      }
    },

    applyTransition (size, {margin, layout}) {
      const {g, svg, zoom, zoomable} = this.internaldata
      if (zoomable) {
        const transform = this.currentTransform
        const oldMargin = margin || this.margin
        const oldLayout = layout || this.layout

        const nowTransform = oldLayout.updateTransform(transform, oldMargin, size, this.maxTextLenght)
        const nextRealTransform = this.updateTransform(transform, size)
        const current = d3.zoomIdentity.translate(transform.x + nowTransform.x - nextRealTransform.x, transform.y + nowTransform.y - nextRealTransform.y).scale(transform.k)

        svg.call(zoom.transform, current).transition().duration(this.duration).call(zoom.transform, transform)
      } else {
        const transitiong = g.transition().duration(this.duration)
        this.transformSvg(transitiong, size)
      }
    },

    zoomed (g) {
      return () => {
        const transform = d3.event.transform
        const size = this.getSize()
        const transformToApply = this.updateTransform(transform, size)
        this.currentTransform = transform
        this.$emit('zoom', {transform})
        g.attr('transform', transformToApply)
      }
    },

    updateIfNeeded (d, update) {
      return update ? this.updateGraph(d).then(() => true) : Promise.resolve(true)
    },

    // API
    collapse (d, update = true) {
      if (!d.children) {
        return Promise.resolve(false)
      }

      d._children = d.children
      d.children = null
      this.$emit('retract', {element: d, data: d.data})
      return this.updateIfNeeded(d, update)
    },

    expand (d, update = true) {
      if (!d._children) {
        return Promise.resolve(false)
      }

      d.children = d._children
      d._children = null
      this.$emit('expand', {element: d, data: d.data})
      return this.updateIfNeeded(d, update)
    },

    expandAll (d, update = true) {
      const lastVisible = d.leaves()
      onAllChilddren(d, child => { this.expand(child, false) })
      return this.updateIfNeeded(this.getNodeOriginComputer(lastVisible), update)
    },

    collapseAll (d, update = true) {
      onAllChilddren(d, child => this.collapse(child, false))
      return this.updateIfNeeded(d, update)
    },

    show (d, update = true) {
      const path = d.ancestors().reverse()
      const root = path.find(node => node.children === null) || d
      path.forEach(node => this.expand(node, false))
      return this.updateIfNeeded(root, update)
    },

    showOnly (d) {
      const root = this.internaldata.root
      const path = d.ancestors().reverse()
      const shouldBeRetracted = mapMany(path, p => p.children ? p.children : []).filter(node => node && (path.indexOf(node) === -1))
      const mapped = {}
      shouldBeRetracted.filter(node => node.children).forEach(rectractedNode => rectractedNode.each(c => { mapped[c.id] = rectractedNode }))
      const origin = node => {
        const reference = mapped[node.id]
        if (!reference) {
          return node
        }
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
      return this.updateGraph(origin).then(() => true)
    },

    resetZoom () {
      if (!this.zoomable) {
        return Promise.resolve(false)
      }
      const {svg, zoom} = this.internaldata
      const transitionPromise = toPromise(svg.transition().duration(this.duration).call(zoom.transform, () => d3.zoomIdentity))
      return transitionPromise.then(() => true)
    }
  },

  computed: {
    tree () {
      const size = this.getSize()
      const tree = this.type === 'cluster' ? d3.cluster() : d3.tree()
      this.layout.size(tree, size, this.margin, this.maxTextLenght)
      return tree
    },

    margin () {
      return {x: this.marginX, y: this.marginY}
    },

    layout () {
      return layout[this.layoutType]
    },

    drawLink () {
      return linkLayouts[this.linkLayout]
    }
  },

  watch: {
    data: {
      handler: function (current, old) {
        this.onData(current)
      },
      deep: true
    },

    type () {
      if (!this.internaldata.tree) {
        return
      }
      this.internaldata.tree = this.tree
      this.redraw()
    },

    marginX (newMarginX, oldMarginX) {
      this.completeRedraw({margin: {x: oldMarginX, y: this.marginY}})
    },

    marginY (newMarginY, oldMarginY) {
      this.completeRedraw({margin: {x: this.marginX, y: oldMarginY}})
    },

    layout (newLayout, oldLayout) {
      this.completeRedraw({layout: oldLayout})
    },

    selected () {
      this.completeRedraw({layout: this.layout})
    },

    radius () {
      this.completeRedraw({layout: this.layout})
    },

    leafTextMargin () {
      this.completeRedraw({layout: this.layout})
    },

    nodeTextMargin () {
      this.completeRedraw({layout: this.layout})
    },

    nodeTextDisplay () {
      this.completeRedraw({layout: this.layout})
    },

    linkLayout () {
      this.completeRedraw({layout: this.layout})
    },

    minZoom () {
      this.updateZoom()
    },

    maxZoom () {
      this.updateZoom()
    },

    zoomable (newValue) {
      if (newValue) {
        this.internaldata.zoom = this.setUpZoom()
        return
      }
      this.removeZoom()
    }
  }
}
</script>

<style>
.treeclass .nodetree  circle {
  fill: #999;
}

.treeclass .node--internal circle {
  cursor: pointer;
  fill:  #555;
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

.treeclass {
  max-height: 100%;
  width: 100%; 
}
</style>
