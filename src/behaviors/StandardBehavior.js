/**
 * Renderless component providing the collapse on click behavior.
 *Can be used as a behavior slot of tree component.
 */
export default {
  name: 'standardBehavior',
  props: {
    /**
     *  Tree nodes. Typically provided by tree behavior slot.
     */
    nodes: {
      required: false,
      type: Object
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

  watch: {
    'nodes.clickedNode': {
      handler: function (node) {
        this.actions.toggleExpandCollapse(node)
      },
      immediate: true
    }
  }
}
