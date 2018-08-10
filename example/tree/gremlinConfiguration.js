import gremlins from 'gremlins.js/src/main'

function getGremlin () {
  const horde = gremlins.createHorde()
    .gremlin(gremlins.species.clicker().canClick((element) => {
      switch (element.tagName) {
        case 'circle':
        case 'button':
        case 'text':
          return true
      }
      console.log(element)
      return false
    }))

  return horde
}

export {
  getGremlin
}
