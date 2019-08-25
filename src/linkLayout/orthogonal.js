function drawLink (source, target, { transformNode, verticalLine }) {
  return `M ${transformNode(source.x, source.y)} L ${transformNode(source.x, target.y)} ${verticalLine(target, source)}`
}

export {
  drawLink
}
