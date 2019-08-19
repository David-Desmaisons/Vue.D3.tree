function drawLink (source, target, { transformNode }) {
  return `M ${transformNode(source.x, source.y)} C ${transformNode(source.x, (source.y + target.y) / 2)} ` +
          `${transformNode(target.x, (source.y + target.y) / 2)} ${transformNode(target.x, target.y)}`
}

export {
  drawLink
}
