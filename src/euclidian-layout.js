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

  transformText (text, hasChildren) {
    return text.attr('x', d => { return hasChildren(d) ? -13 : 13 })
              .attr('text-anchor', d => { return hasChildren(d) ? 'end' : 'start' })
  }
}
