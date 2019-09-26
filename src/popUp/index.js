import Popper from 'popper.js'

const sendStyle = (callback) => {
  return ({styles}) => callback(styles)
}

function createPopper ({target, element, placement, styleCallback}) {
  const onStyle = sendStyle(styleCallback)
  return new Popper(
    target,
    element,
    {
      onCreate: onStyle,
      onUpdate: onStyle,
      modifiers: { applyStyle: { enabled: false } },
      placement
    })
}

export {
  createPopper
}
