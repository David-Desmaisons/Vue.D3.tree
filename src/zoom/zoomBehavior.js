import * as d3 from 'd3'

function setUpZoom ({ currentTransform, minZoom, maxZoom, svg }, zoomCallBack) {
  const zoom = d3.zoom().scaleExtent([minZoom, maxZoom])
  zoom.on('zoom', onZoom(zoomCallBack))
  svg.call(zoom).on('wheel', () => d3.event.preventDefault())
  svg.call(zoom.transform, currentTransform || d3.zoomIdentity)
  return zoom
}

function onZoom (zoomCallBack) {
  return () => {
    const transform = d3.event.transform
    zoomCallBack({transform})
  }
}

export {
  setUpZoom
}
