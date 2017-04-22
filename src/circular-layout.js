export default {
  size (tree, {width, height}, {x, y}, max = 0) {
    const ray = Math.min(width - x, height - y) / 2 - max
    tree.size([360, ray])
        .separation((a, b) => { return (a.parent === b.parent ? 1 : 2) / (a.depth !== 0 ? a.depth : 1) })
  },

  transformNode (x, y) {
    const angle = (x - 90) / 180 * Math.PI
    const radius = y
    return [radius * Math.cos(angle), radius * Math.sin(angle)]
  },

  transformSvg (svg, margin, {width, height}) {
    return svg.attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')')
  },

  updateTransform (transform, margin, {width, height}) {
    return transform.translate(width / 2, height / 2)
  },

  transformText (d, children) {
    return {
      x: d.x < 180 === !children ? 6 : -6,
      rotate: d.x < 180 ? d.x - 90 : d.x + 90,
      anchor: d.x < 180 === !children ? 'start' : 'end'
    }
  }
}
