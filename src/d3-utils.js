function anchorTodx (d, el) {
  if (d === 'middle') {
    return -el.getBBox().width / 2
  } else if (d === 'end') {
    return -el.getBBox().width
  }
  return 0
}

function drawLink (source, target, {transformNode}) {
  return 'M' + transformNode(source.x, source.y) +
         'C' + transformNode(source.x, (source.y + target.y) / 2) +
         ' ' + transformNode(target.x, (source.y + target.y) / 2) +
         ' ' + transformNode(target.x, target.y)
}

function compareString (a, b) {
  return (a < b) ? -1 : (a > b) ? 1 : 0
}

function findInParents (node, nodes) {
  if (nodes.indexOf(node) !== -1) {
    return node
  }

  const parent = node.parent
  return (parent === null) ? node : findInParents(parent, nodes)
}

function mapMany (arr, mapper) {
  return arr.reduce(function (prev, curr) {
    return prev.concat(mapper(curr))
  }, [])
}

function removeTextAndGraph (selection) {
  ['circle', 'text'].forEach(select => {
    selection.selectAll(select).remove()
  })
}

function roundPath (pathString, precision = 0) {
  return pathString.replace(/\d+\.\d+/g, s => parseFloat(s).toFixed(precision))
}

function toPromise (transition) {
  let count = 0
  let interrupted = false
  transition.each(() => count++)
  return new Promise(function (resolve, reject) {
    if (count === 0) {
      resolve('ended')
      return
    }
    const check = () => {
      if (--count === 0) {
        resolve(interrupted ? 'interrupted' : 'ended')
      }
    }
    transition.on('end', check)
    transition.on('interrupt', () => {
      interrupted = true
      check()
    })
  })
}

function translate (vector, {transformNode}) {
  return 'translate(' + transformNode(vector.x, vector.y) + ')'
}

function updateText (width) {
  const textString = this.textContent
  const textLength = textString.length
  if (this.getSubStringLength(0, textLength) <= width) {
    return
  }

  for (var x = textLength - 3; x > 0; x -= 3) {
    if (this.getSubStringLength(0, x) <= width) {
      this.textContent = textString.substring(0, x) + '...'
      return
    }
  }

  this.textContent = '...'
}

function updateTexts (selection, maxLength) {
  if (maxLength === -1) {
    return
  }

  selection.each(function () {
    updateText.call(this, maxLength)
  })
}

export {
    anchorTodx,
    compareString,
    drawLink,
    findInParents,
    mapMany,
    removeTextAndGraph,
    roundPath,
    toPromise,
    translate,
    updateTexts
}

