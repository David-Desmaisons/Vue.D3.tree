export default {
  size (tree, size) {
    tree.size([size.height, size.width - 160])
  },

  transformNode (x, y) {
    return y + ',' + x
  },

  transformSvg (svg, margin) {
    svg.attr('transform', 'translate(' + margin.x * 2 + ',0)')
    return svg
  }
}
