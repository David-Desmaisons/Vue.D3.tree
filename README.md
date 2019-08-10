# Vue.D3.tree
[![GitHub open issues](https://img.shields.io/github/issues/David-Desmaisons/Vue.D3.tree.svg?maxAge=2592000)](https://github.com/David-Desmaisons/Vue.D3.tree/issues)
[![Npm version](https://img.shields.io/npm/v/vued3tree.svg?maxAge=2592000)](https://www.npmjs.com/package/vued3tree)
[![npm download](https://img.shields.io/npm/dt/vued3tree.svg?maxAge=2592000)](https://www.npmjs.com/package/vued3tree)
[![vue2](https://img.shields.io/badge/vue-2.x-brightgreen.svg)](https://vuejs.org/)
[![MIT License](https://img.shields.io/github/license/David-Desmaisons/Vue.D3.tree.svg)](https://github.com/David-Desmaisons/Vue.D3.tree/blob/master/LICENSE)


Update documentationVue components to display graphics based on [D3.js](https://d3js.org/) layout.


# Tree

![demo](./documentation/treedemo.gif)

## Live demo

https://david-desmaisons.github.io/Vue.D3.tree/tree

## Usage

```html
<tree :data="tree" node-text="name" layoutType="circular">
</tree>
```
```javascript
import {tree} from 'vued3tree'

export default {
  components: {
    tree
  },
  data() {
    return {
      tree: {
        name: "father",
        children:[{
          name: "son1",
          children:[ {name: "grandson"}, {name: "grandson2"}]
        },{
          name: "son2",
          children:[ {name: "grandson3"}, {name: "grandson4"}]
        }]
      }
    }
  }
}
  //...
```

## Properties

| Name      | Required | Type/Value              | Default     | Description |
| ---       | ---      | ---                     | ---         | ---         |
| data      | no    | `Object`                     | null        | Data representing tree structure, children nodes are represented by children property
| duration   | no | `Number`  | 750 |  Animation duration in milliseconds |
| layoutType | no | 'circular' or 'euclidean' |  'euclidean'       | Circular or euclidean layout |
| marginX    | no | `Number`          | 20       | margin for X axis in pixel |
| marginY    | no | `Number`           | 20            | margin for Y axis in pixel |
| nodeText   | no | `String`  | 'name' |  name of the property of the node to be used as a display name |
| type      | no    | 'tree' or 'cluster'       | 'tree'      | kind of layout: [tree](https://github.com/d3/d3-hierarchy/blob/master/README.md#tree) or [cluster](https://github.com/d3/d3-hierarchy/blob/master/README.md#cluster) |
| radius    | no | `Number`           | 3            | node circle radius in pixel |
| textMargin    | no | `Number`           | 6            | margin in pixel for leaf node text |
| zoomable   | no | `Boolean`  | false |  If true tree can be zoomed in using mouse wheel and drag-and-drop |
| identifier   | no | `Function`  | () => i++ |  Function that receives a data and returns its identity that can be a number or a string, usefull when dynimacally updating the tree |

## Slots

### node

Use this slot to customize the rendering of individual node. 

Note that the mark-up will be rendered inside a svg element, so only [svg elements](https://developer.mozilla.org/en-US/docs/Web/SVG/Element) are allowed here

Slot-scope:


| Name      | Type | Description  |
| ---       | ---      | ---   |
| actions   | `Object`    | Value: {collapse, collapseAll, expand, expandAll, show, toggleExpandCollapse} where each property is a component method (see [below](#Methods) for detailed description) |
| data   | `Object` | node data as provided by the `data` props  |
| isRetracted   | `Bool` | true if the node has hidden children -retracted state- |
| node   | [D3.js node](https://github.com/d3/d3-hierarchy/tree/v1.1.8#hierarchy) | D3.js node to be displayed  |
| radius      | `Number`    | tree radius props value    |

Example:
```HTML
<template #node="{data, node: {depth}, radius, isRetracted}">
  <template v-if="data.children && data.children.length">
    <path :fill="isRetracted? 'red' : 'blue'" d="M190.5..">
      <title>{{data.text}} {{depth}}</title>
    </path>
  </template>
  <template v-else>
    <circle r="6" :stroke="blue? 'blue' : 'yellow'">
      <title>{{data.text}} {{depth}}</title>
    </circle>
  </template>
</template>
```

### behavior

Behavior slot provide an elegant way to customize the tree behavior by receiving as slot-scope both node information (including clicked node, hovered node, ...) and actions to alter the graph accordingly.

The concept of this slot is to react to changes in node information by calling an action

By design this slot is renderless.

Slot-scope:


| Name      | Type | Description  |
| ---       | ---      | ---   |
| nodes      | `Object`    | Value: { clickedNode: `D3.js node`, clickedText: `D3.js node` }  The last node click or which text has been clicked |
| actions   | `Object`    | Value: {collapse, collapseAll, expand, expandAll, show, toggleExpandCollapse} where each property is a component method (see [below](#Methods) for detailed description) |

By default tree component use standardBehavior as component which provides toggle retract on node click.

Example:

```HTML
<template #behavior="{nodes, actions}">
  <CollapseOnClick v-bind="{nodes, actions}"/>
</template>
```

With CollapseOnClick component:
```javascript
export default {
  props: ['nodes', 'actions'],

  render () {
    return null
  },

  watch: {
    'nodes.clickedNode': function (node) {
      this.actions.toggleExpandCollapse(node)
    }
  }
}
```

## Events

* `clicked`

Sent when the node name is clicked

* `expand`

Sent when the node is clicked and the node children are expanded

* `retract`

Sent when the node is clicked and the node children are retracted

For all these events, the argument passed is `{element, data}` where `element` represents the node build by `D3.js` and `data` is the node raw data.

* `zoom`

Sent when the tree is zoomed. Argument: `{transform}` where transform is [d3.zoom transform object](https://github.com/d3/d3-zoom#zoom-transforms)


## Methods

| Name      | Argument | return             | Description |
| ---       | ---      | ---                | ---         |
| expand      | `D3.js node`      | a promise which resolve when animation is over                | Expand the given node.|
| expandAll       | `D3.js node`      | a promise which resolve when animation is over                | Expand the given node and all its children.|
| collapse      | `D3.js node`      | a promise which resolve when animation is over                | Collapse the given node.|
| collapseAll       | `D3.js node`      | a promise which resolve when animation is over                | Collapse the given node and all its children.|
| resetZoom       | -      | a promise which resolve when animation is over                | Set zoom matrix to identity         |
| show       | `D3.js node`      | a promise which resolve when animation is over             | Expand nodes if needed in order to show the given node. |
| showOnly       | `D3.js node`      | a promise which resolve when animation is over             | Retract all node that are not in the path of the given node. |
| toggleExpandCollapse       | `D3.js node`      | a promise which resolve when animation is over             | Retract or collapse the given node depending on its current state. |




## Gotchas

This component is responsive and will adjust to resizing.
In order for this to work properly, you must define for this component or its parent wether:
  * a height or a max-height
  * or a width or a max-width.
  
Failing to do so may result in a component whose size that will keep increasing.

# Hierarchical Edge Bundling

![demo](./documentation/hebdemo.gif)

## Live demo

https://david-desmaisons.github.io/Vue.D3.tree/hierarchicalEdgeBundling

## Usage

```html
<hierarchical-edge-bundling identifier="id" :data="tree" :links="links" node-text="name"/>
```
```javascript
import {hierarchicalEdgeBundling} from 'vued3tree'

export default {
  components: {
    hierarchicalEdgeBundling
  },
  data() {
    return {
      tree: {
        name: "father",
        children:[{
          name: "son1",
          children:[ {name: "grandson", id: 1}, {name: "grandson2", id: 2}]
        },{
          name: "son2",
          children:[ {name: "grandson3", id: 3}, {name: "grandson4", id: 4}]
        }]
      },
      links: [
        {source: 3, target: 1, type: 1},
        {source: 3, target: 4, type: 2}
      ],
      linkTypes: [
        {id: 1, name: 'depends', symmetric: true},
        {id: 2, name: 'implement', inName: 'implements', outName: 'is implemented by'},
        {id: 3, name: 'uses', inName: 'uses', outName: 'is used by'},
      ]
    }
  }
}
  //...
```

## Properties

| Name      | Required | Type/Value              | Default     | Description |
| ---       | ---      | ---                     | ---         | ---         |
| data      | no    | `Object`                     | null        | Data representing tree structure, children nodes are represented by children property
| links      | no    | `Array`                     | null        | Data representing links between the nodes, having `source` and `target` properties referencing node identifiers
| identifier   | yes | `String` or `Function` | -|  name of the property of the node to be used as a identifier or function taking a node and returning its identifier|
| nodeText   | yes | `String`  | -|  name of the property of the node to be used as a display name |
| duration   | no | `Number`  | 750 |  Animation duration in milliseconds |
| marginX    | no | `Number`          | 20       | margin for X axis in pixel |
| marginY    | no | `Number`           | 20            | margin for Y axis in pixel |
| maxTextWidth    | no | `Number`           | -1            | Max node text width (in pixel) to be displayed, if -1 text is not truncated.| 
| nodeClass    | no | `String`           | 'graph'            | class to be applied to the root div. Useful when custom CSS rules have to be applied. | 


## Events

* `mouseNodeOver`

Sent when the node name is hovered by mouse

* `mouseNodeOut`

Sent when mouse leaves the node name

For these events, the argument passed is `{element, data}` where `element` represents the node build by `D3.js` and `data` is the node raw data.

* `clickOutsideGraph`

Sent when mouse is clicked outside any geometry or text of the hierarchical edge bundling

* `nodesComputed`

Sent when D3.js nodes are computed using `data` props. Called with [D3.js hierarchy node](https://github.com/d3/d3-hierarchy#hierarchy)

* `highlightedNodeChanged`

Sent when highlighted node has changed.

## Data

* `highlightedNode`

Highlighted node: when set to a node data, the corresponding node and its related links will be highlighted. If null standard display is showing.

## Gotchas

This component is responsive and will adjust to resizing.
In order for this to work properly, you must define for this component or its parent wether:
  * a height or a max-height
  * or a width or a max-width.
  
Failing to do so may result in a component whose size that will keep increasing.

# Installation
- Available through:
``` js
 npm install vued3tree
```

### Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build
```

