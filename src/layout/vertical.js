export default {
  size (tree, size, margin, {last, first}) {
    tree.size([size.width - (margin.y * 2), size.height - (margin.x * 2) - (last + first)])
  },

  transformNode (x, y) {
    return x + ',' + y
  },

  transformSvg (svg, margin) {
    return svg.attr('transform', 'translate(' + margin.x + ',' + margin.y + ')')
  },

  updateTransform (transform, {x, y}) {
    return transform.translate(y, x)
  },

  getLine (d3) {
    return d3.line()
      .x(d => d.data.x)
      .y(d => d.data.y)
  },

  layoutNode (children, offset) {
    return {
      x: !children ? offset : -6,
      rotate: 90,
      textRotate: !children ? 0 : -90,
      anchor: !children ? 'start' : 'middle'
    }
  }
}
