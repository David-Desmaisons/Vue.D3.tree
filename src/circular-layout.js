export default {
  size (tree, {width, height}, {x, y}) {
    const ray = Math.min(width - x, height - y) / 2
    tree.size([360, ray])
        .separation((a, b) => { return (a.parent === b.parent ? 1 : 2) / a.depth })
  },

  transformNode (x, y) {
    const angle = (x - 90) / 180 * Math.PI
    const radius = y
    return [radius * Math.cos(angle), radius * Math.sin(angle)]
  },

  transformSvg (svg, {x, y}, {width, height}) {
    return svg.attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')')
  },

  transformText (text) {
    return text.attr('transform', (d) => { return 'rotate(' + (d.x < 180 ? d.x - 90 : d.x + 90) + ')' })
    // return text.attr('transform', (d) => { return 'rotate(' + (d.x - 90) + ')' })
  }
}
