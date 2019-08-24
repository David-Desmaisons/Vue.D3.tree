import Point from './point'

function getRay ({width, height}, {x, y}, {xExtreme = null, yExtreme = null}) {
  const firstRay = computeRay((width - x) / 2, xExtreme, Math.cos)
  const secondRay = computeRay((height - y) / 2, yExtreme, Math.sin)
  return Math.min(firstRay, secondRay)
}

function computeRay (space, extreme, trig) {
  if (!extreme) {
    return space
  }
  const available = space - extreme.value
  const angle = (extreme.x - 90) / 180 * Math.PI
  return Math.abs(available / trig(angle))
}

function separation (a, b) {
  return (a.parent === b.parent ? 1 : 2) / (a.depth !== 0 ? a.depth : 1)
}

function transformNode (x, y) {
  const angle = (x - 90) / 180 * Math.PI
  const radius = y
  return new Point(~~(radius * Math.cos(angle)), ~~(radius * Math.sin(angle)))
}

export default {
  size (tree, {width, height}, {x, y}, {last}) {
    const ray = Math.min(width - x, height - y) / 2 - last
    tree.size([360, ray]).separation(separation)
  },

  optimizeSize (tree, size, margin, extreme) {
    const ray = getRay(size, margin, extreme || {})
    tree.size([360, ray]).separation(separation)
  },

  transformNode,

  transformSvg (svg, _, {width, height}) {
    return svg.attr('transform', `translate(${width / 2},${height / 2})`)
  },

  updateTransform (transform, _, {width, height}) {
    return transform.translate(width / 2, height / 2)
  },

  getLine (d3) {
    return d3.radialLine()
              .radius(d => d.y)
              .angle(d => d.x / 180 * Math.PI)
  },

  verticalLine (target, source) {
    if (target.x === source.x && target.y === source.y) {
      return ''
    }
    return `A ${target.y},${target.y} 0 ${Math.abs(target.x - source.x) > 180 ? 1 : 0} ${target.x > source.x ? 1 : 0} ${transformNode(target.x, target.y)}`
  },

  layoutNode (children, {leaf, node}, d) {
    const isLeaf = !children
    const pole = d.x < 180 ? 1 : -1
    const leafOrReversed = d.x < 180 === isLeaf
    return {
      x: (isLeaf ? leaf : -node) * pole,
      y: 0,
      rotate: d.x - 90,
      textRotate: d.x < 180 ? 0 : 180,
      anchor: leafOrReversed ? 'start' : 'end'
    }
  }
}
