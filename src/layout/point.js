function Point (x, y) {
  this.x = x
  this.y = y
}

Point.prototype.toString = function () {
  return `${this.x},${this.y}`
}

Point.prototype.apply = function (transformation) {
  return new Point(transformation.applyX(this.x), transformation.applyY(this.y))
}

export default Point
