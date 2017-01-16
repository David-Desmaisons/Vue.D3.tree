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

  transformText (text, hasChildren) {
    return text.each(d => {
      const children = hasChildren(d)
      const textInfo = {
        x: d.x < 180 === !children ? 6 : -6,
        rotate: d.x < 180 ? d.x - 90 : d.x + 90,
        anchor: d.x < 180 === !children ? 'start' : 'end'
      }
      Object.assign(d, {textInfo})
    })
  }
}
