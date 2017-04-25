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

export {
    anchorTodx,
    compareString,
    drawLink,
    findInParents,
    mapMany,
    removeTextAndGraph,
    toPromise,
    translate
}

