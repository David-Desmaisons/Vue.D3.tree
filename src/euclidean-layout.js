export default {
  size (tree, size, margin, maxTextLength = 0) {
    tree.size([size.height - (margin.y * 2), size.width - (margin.x * 2) - (2 * maxTextLength)])
  },

  transformNode (x, y) {
    return y + ',' + x
  },

  transformSvg (svg, margin, size, maxTextLength) {
    return svg.attr('transform', 'translate(' + margin.x + maxTextLength + ',' + margin.y + ')')
  },

  updateTransform (transform, {x, y}, size, maxTextLength) {
    return transform.translate(x + maxTextLength, y)
  },

  transformText (text, children) {
    return {
      x: !children ? 6 : -6,
      rotate: 0,
      anchor: !children ? 'start' : 'end'
    }
  }
}
