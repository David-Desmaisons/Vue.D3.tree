export default {
  size (tree, size, margin, {last, first}) {
    tree.size([size.height - (margin.y * 2), size.width - (margin.x * 2) - (last + first)])
  },

  transformNode (x, y) {
    return y + ',' + x
  },

  transformSvg (svg, margin, size, {first}) {
    return svg.attr('transform', 'translate(' + margin.x + first + ',' + margin.y + ')')
  },

  updateTransform (transform, {x, y}, size, {first}) {
    return transform.translate(x + first, y)
  },

  getLine (d3) {
    return d3.line()
            .x(d => d.data.x)
            .y(d => d.data.y)
  },

  transformText (text, children) {
    return {
      x: !children ? 6 : -6,
      rotate: 0,
      anchor: !children ? 'start' : 'end'
    }
  }
}
