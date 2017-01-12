export default {
  size (tree, size, margin) {
    tree.size([size.height - (margin.y * 2), size.width - (margin.x * 2)])
  },

  transformNode (x, y) {
    return y + ',' + x
  },

  transformSvg (svg, margin) {
    return svg.attr('transform', 'translate(' + margin.x + ',' + margin.y + ')')
  },

  transformText (text) {
    return text
  }
}
