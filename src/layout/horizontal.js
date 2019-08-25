import Point from './point'

function transformNode (x, y) {
  return new Point(y, x)
}

export default {
  size (tree, size, margin, {last, first}) {
    tree.size([size.height - (margin.y * 2), size.width - (margin.x * 2) - (last + first)])
  },

  transformNode,

  transformSvg (svg, margin, _, {first}) {
    return svg.attr('transform', `translate(${margin.x + first},${margin.y})`)
  },

  updateTransform (transform, {x, y}, _, {first}) {
    return transform.translate(x + first, y)
  },

  getLine (d3) {
    return d3.line()
            .x(d => d.data.x)
            .y(d => d.data.y)
  },

  verticalLine (target) {
    return `L ${transformNode(target.x, target.y)}`
  },

  layoutNode (children, {leaf, node}) {
    return {
      x: !children ? leaf : -node,
      y: 0,
      rotate: 0,
      textRotate: 0,
      anchor: !children ? 'start' : 'end'
    }
  }
}
