function compareString (a, b) {
  return (a < b) ? -1 : (a > b) ? 1 : 0
}

function compareNode (a, b, attribute) {
  if (a.height < b.height) {
    return 1
  }
  if (a.height > b.height) {
    return -1
  }
  return compareString(a.data[attribute], b.data[attribute])
}

function mapMany (arr, mapper) {
  return arr.reduce(function (prev, curr) {
    return prev.concat(mapper(curr))
  }, [])
}

function roundPath (pathString, precision = 0) {
  return pathString.replace(/\d+\.\d+/g, s => parseFloat(s).toFixed(precision))
}

function toPromise (transition) {
  let count = 0
  let interrupted = false
  transition.each(() => count++)
  return new Promise(function (resolve) {
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

function translate (vector, { transformNode }, transformation) {
  let destination = transformNode(vector.x, vector.y)
  if (transformation) {
    destination = destination.apply(transformation)
  }
  return `translate( ${destination} )`
}

function binarySearch (arr, left, right, value) {
  if (right < left) {
    return right
  }

  const mid = Math.round(left + (right - left) / 2)
  if (arr(mid) === value) {
    return mid
  }

  return (arr(mid) > value) ? binarySearch(arr, left, mid - 1, value) : binarySearch(arr, mid + 1, right, value)
}

function updateText (width) {
  const textString = this.textContent
  const textLength = textString.length
  if (this.getSubStringLength(0, textLength) <= width) {
    return
  }

  const index = binarySearch((pos) => this.getSubStringLength(0, pos), 0, textLength - 3, width)
  this.textContent = textString.substring(0, index) + '...'
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
  compareString,
  compareNode,
  mapMany,
  roundPath,
  toPromise,
  translate,
  updateTexts
}

