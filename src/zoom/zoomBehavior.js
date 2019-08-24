import * as d3 from 'd3'

function setUpZoom ({ currentTransform, minZoom, maxZoom, svg, g }, zoomBehavior, updateTransform, onZoom) {
  const zoom = d3.zoom().scaleExtent([minZoom, maxZoom])
  zoom.on('zoom', zoomBehavior(g, onZoom, updateTransform))
  svg.call(zoom).on('wheel', () => d3.event.preventDefault())
  svg.call(zoom.transform, currentTransform || d3.zoomIdentity)
  return zoom
}

function zoomWholeSvg (g, onZoom, updateTransform) {
  return () => {
    const transform = d3.event.transform
    const transformToApply = updateTransform(transform)
    onZoom({transform})
    g.attr('transform', transformToApply)
  }
}

export {
  setUpZoom,
  zoomWholeSvg
}
