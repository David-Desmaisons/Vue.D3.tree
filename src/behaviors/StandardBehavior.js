/**
 * Renderless component providing the collapse on click behavior.
 *Can be used as a behavior slot of tree component.
 */
export default {
  name: 'standardBehavior',
  props: {
    /**
     *  Parent event listener.
     */
    on: {
      required: true,
      type: Function
    },
    /**
     *  Tree actions. Typically provided by tree behavior slot.
     */
    actions: {
      required: true,
      type: Object
    }
  },

  render () {
    // no rendering
    return null
  },

  created () {
    const {on, actions} = this

    on('clickedText', ({element}) => {
      actions.setSelected(element)
    })

    on('clickedNode', ({element}) => {
      actions.toggleExpandCollapse(element)
    })
  }
}
