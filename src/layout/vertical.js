import Point from './point'

const minMargin = 9
function transformNode (x, y) {
  return new Point(x, y)
}

export default {
  size (tree, size, margin, {last}) {
    tree.size([size.width - (margin.x * 2), size.height - (margin.y * 2) - last - minMargin])
  },

  transformNode,

  transformSvg (svg, margin) {
    return svg.attr('transform', `translate(${margin.x},${margin.y + minMargin})`)
  },

  updateTransform (transform, {x, y}) {
    return transform.translate(x, y)
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
      x: !children ? leaf : 0,
      y: !children ? 0 : -(minMargin + node),
      rotate: 90,
      textRotate: !children ? 0 : -90,
      anchor: !children ? 'start' : 'middle'
    }
  }
}
