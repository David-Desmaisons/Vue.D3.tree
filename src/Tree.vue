<script>
import resize from 'vue-resize-directive'
import { interpolatePath } from 'd3-interpolate-path'

import horizontal from './layout/horizontal'
import vertical from './layout/vertical'
import circular from './layout/circular'
import { drawLink as bezier } from './linkLayout/bezier'
import { drawLink as orthogonal } from './linkLayout/orthogonal'
import collapseOnClick from './behaviors/CollapseOnClick'
import selectOnTextClick from './behaviors/SelectOnTextClick'
import popUpOnClickText from './behaviors/PopUpOnClickText'
import {compareString, toPromise, mapMany, translate} from './d3-utils'
import {renderInVueContext} from './vueHelper'
import {setUpZoom} from './zoom/zoomBehavior'
import {createPopper} from './popUp'

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

let i = 0
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
    required: false,
    default: null
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
  strokeWidth: {
    type: Number,
    default: 1.5
  },
  leafTextMargin: {
    type: Number,
    default: 6
  },
  nodeTextMargin: {
    type: Number,
    default: 6
  },
  popUpPlacement: {
    type: String,
    default: 'bottom-start'
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

const defaultBehaviors = [
  collapseOnClick,
  selectOnTextClick,
  popUpOnClickText
]

const popUpClass = 'pop-up-tree'

export default {
  name: 'D3Tree',

  props,

  directives,

  model: {
    prop: 'selected',
    event: 'change'
  },

  render (h) {
    const {$behaviorProps: behaviorProps, $scopedSlots: {popUp}, resetPopUp: close, contextMenu: {node, style}} = this
    const slotNodes = defaultBehaviors.map(component => h(component, this._b({}, component.name, behaviorProps, false)))
    const menu = h('div', {
      class: popUpClass,
      style
    }, [
      (!popUp || (node === null)) ? null : popUp({node, data: node.data, close})
    ])

    return h('div', {class: 'viewport treeclass', directives: [{name: 'resize', value: this.resize}]}, [
      menu,
      this._t('behavior', slotNodes, null, behaviorProps)
    ])
  },

  created () {
    const {setSelected, setPopUp, resetPopUp, collapse, collapseAll, expand, expandAll, show, toggleExpandCollapse, $on: on} = this
    const actions = {setSelected, setPopUp, resetPopUp, collapse, collapseAll, expand, expandAll, show, toggleExpandCollapse}
    this.$behaviorProps = {actions, on: on.bind(this)}
  },

  data () {
    return {
      currentTransform: null,
      contextMenu: {
        node: null,
        style: null
      },
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
          .on('click', () => { this.$emit('clickOutside') })
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

    setPopUp ({element, target}) {
      const {contextMenu, popUpPlacement} = this
      contextMenu.node = element
      createPopper({
        target,
        element: this.$el.querySelector(`.${popUpClass}`),
        placement: popUpPlacement,
        styleCallback: style => { contextMenu.style = style }
      })
    },

    resetPopUp () {
      this.contextMenu.node = null
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
      const { currentTransform, minZoom, maxZoom, onZoomed, internaldata: { svg } } = this
      return setUpZoom({ currentTransform, minZoom, maxZoom, svg }, onZoomed)
    },

    onZoomed ({transform}) {
      this.$emit('zoom', {transform})
      this._originalZoom = transform
      this.currentTransform = this.updateTransform(transform)
      this.redraw({transitionDuration: 0, resetPopUp: true})
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
      const {minZoom, maxZoom} = this
      this.internaldata.zoom.scaleExtent([minZoom, maxZoom])
    },

    completeRedraw ({margin = null, layout = null, resetPopUp = true}) {
      const size = this.getSize()
      this.layout.size(this.internaldata.tree, size, this.margin, this.maxTextLenght)
      this.applyZoom(size, true)
      this.redraw({resetPopUp})
    },

    transformSvg (g, size) {
      size = size || this.getSize()
      return this.layout.transformSvg(g, this.margin, size, this.maxTextLenght)
    },

    updateTransform (transform, size) {
      size = size || this.getSize()
      return this.layout.updateTransform(transform, this.margin, size, this.maxTextLenght)
    },

    updateGraph (source, {transitionDuration = undefined, resetPopUp = true} = {}) {
      if (resetPopUp) {
        this.resetPopUp()
      }
      const {root} = this.internaldata
      const correctedSource = source || root
      const originAngle = () => correctedSource.layoutInfo ? correctedSource.layoutInfo.rotate : 0
      const {currentPosition} = this
      const getOldPosition = (node) => {
        if (!currentPosition) {
          return null
        }
        const visibleParent = node.ancestors().find(({id}) => currentPosition.has(id))
        return visibleParent ? currentPosition.get(visibleParent.id) : null
      }
      const currentNodesById = new Map()
      const getExitingParentIfAny = (node) => {
        const visibleParent = node.ancestors().find(a => currentNodesById.has(a.id))
        if (!visibleParent) {
          return {x: correctedSource.x, y: correctedSource.y}
        }
        return currentNodesById.get(visibleParent.id)
      }
      const origin = currentPosition ? currentPosition.get(correctedSource.id) : {x: correctedSource.x0, y: correctedSource.y0}
      const originBuilder = d => {
        if (source || !d.parent) {
          return origin
        }
        return getOldPosition(d.parent) || origin
      }
      const forExit = d => {
        if (source || !d.parent) {
          return {x: correctedSource.x, y: correctedSource.y}
        }
        return getExitingParentIfAny(d.parent)
      }

      const links = this.internaldata.g.selectAll('.linktree')
         .data(this.internaldata.tree(root).descendants().slice(1), d => d.id)

      const newLinks = links.enter().append('path').attr('class', 'linktree').lower()
      const nodes = this.internaldata.g.selectAll('.nodetree').data(root.descendants(), d => d.id)
      const newNodes = nodes.enter().append('g').attr('class', d => `nodetree node-rank-${d.depth}`)
      const allNodes = newNodes.merge(nodes).each(({id, x, y}) => {
        currentNodesById.set(id, {x, y})
      })

      const { strokeWidth, layout, duration, drawLink } = this
      transitionDuration = (transitionDuration === undefined) ? duration : transitionDuration
      const transform = this.currentTransform || d3.zoomIdentity
      const strokeWidthFinal = `${strokeWidth / transform.k}px`

      newLinks.attr('d', d => drawLink(originBuilder(d), originBuilder(d), layout))
        .attr('transform', transform)
        .attr('stroke-width', strokeWidthFinal)
      const updateAndNewLinks = links.merge(newLinks)
      const updateAndNewLinksPromise = toPromise(updateAndNewLinks
        .transition().duration(transitionDuration)
        .attr('transform', transform)
        .attr('stroke-width', strokeWidthFinal)
        .attrTween('d', function (d) {
          const previous = d3.select(this).attr('d')
          const final = drawLink(d, d.parent, layout)
          return interpolatePath(previous, final)
        })
      )
      const exitingLinksPromise = toPromise(links.exit().transition().duration(transitionDuration).attr('d', d => drawLink(forExit(d), forExit(d), layout)).remove())
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

      newNodes.attr('transform', d => `${translate(originBuilder(d), layout, transform)} rotate(${originAngle(d)}) scale(0.1)`)
        .append('g')
        .attr('class', 'node')

      newNodes
        .append('text')
        .attr('dy', '.35em')
        .attr('x', 0)
        .attr('dx', 0)
        .on('click', this.onNodeTextClick)
        .on('mouseover', this.onNodeTextOver)
        .on('mouseleave', this.onNodeTextLeave)

      allNodes
        .select('.node')
        .html(getHtml)

      allNodes.classed('node--internal', d => hasChildren(d))
        .classed('node--leaf', d => !hasChildren(d))
        .classed('selected', d => d === selected)
        .on('click', this.onNodeClick)

      const { leafTextMargin, nodeTextMargin, layout: {layoutNode}, nodeTextDisplay } = this
      const showNode = filterTextNode(nodeTextDisplay, root)
      allNodes.filter(d => !showNode(d)).select('text').text('')
      const text = allNodes.filter(showNode).select('text').text(d => d.data[this.nodeText])

      allNodes.each((d) => {
        d.layoutInfo = layoutNode(hasChildren(d), {leaf: leafTextMargin, node: nodeTextMargin}, d)
      })

      const allNodesPromise = toPromise(allNodes.transition().duration(transitionDuration)
        .attr('transform', d => `${translate(d, layout, transform)} rotate(${d.layoutInfo.rotate})`)
        .attr('opacity', 1))

      text.attr('x', d => d.layoutInfo.x)
          .attr('y', d => d.layoutInfo.y)
          .attr('text-anchor', d => d.layoutInfo.anchor)
          .attr('transform', d => `rotate(${d.layoutInfo.textRotate})`)

      this.currentPosition = currentNodesById

      const exitingNodes = nodes.exit()
      exitingNodes.select('.node').transition().duration(transitionDuration)
                  .attr('transform', 'scale(0.1)')

      const exitingNodesPromise = toPromise(exitingNodes.transition().duration(transitionDuration)
                  .attr('transform', d => `${translate(forExit(d), layout, transform)} rotate(${d.parent.layoutInfo.rotate})`)
                  .attr('opacity', 0).remove())

      const leaves = root.leaves()
      const extremeNodes = text.filter(d => leaves.indexOf(d) !== -1).nodes()
      const last = Math.max(...extremeNodes.map(node => node.getComputedTextLength())) + leafTextMargin
      const textNode = text.node()
      const first = (textNode ? textNode.getComputedTextLength() : 0) + leafTextMargin
      if (last <= this.maxTextLenght.last && first <= this.maxTextLenght.first) {
        this._scheduledRedraw = false
        return Promise.all([allNodesPromise, exitingNodesPromise, updateAndNewLinksPromise, exitingLinksPromise])
      }

      this.maxTextLenght = {first, last}
      const size = this.getSize()
      this.applyZoom(size)
      this.layout.size(this.internaldata.tree, size, this.margin, this.maxTextLenght)
      return this.updateGraph(source)
    },

    onNodeTextOver (d) {
      this.onEvent('mouseOverText', d)
    },

    onNodeTextLeave (d) {
      this.onEvent('mouseLeaveText', d)
    },

    onNodeTextClick (d) {
      this.onEvent('clickedText', d)
    },

    onNodeClick (d) {
      this.onEvent('clickedNode', d)
    },

    onEvent (name, d) {
      const event = d3.event
      this.$emit(name, {element: d, data: d.data, target: event.target})
      event.stopPropagation()
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

    redraw (option = {resetPopUp: true}) {
      const { internaldata: { root }, _scheduledRedraw } = this
      if (!root || _scheduledRedraw) {
        return
      }
      this._scheduledRedraw = true
      this.$nextTick(() => this.updateGraph(null, option))
    },

    applyZoom (size, transition) {
      const { internaldata: {g, zoom}, zoomable } = this
      if (zoomable && zoom) {
        this.currentTransform = this.updateTransform(this._originalZoom)
        return
      }
      const element = transition ? g.transition().duration(this.duration) : g
      this.transformSvg(element, size)
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
      onAllChilddren(d, child => { this.expand(child, false) })
      return this.updateIfNeeded(null, update)
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
        return !reference ? node : {x: reference.x, y: reference.y}
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
      this.completeRedraw({layout: this.layout, resetPopUp: false})
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

    strokeWidth () {
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
.pop-up-tree {
  position: absolute;
}

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
}

.treeclass {
  max-height: 100%;
  width: 100%; 
}
</style>
