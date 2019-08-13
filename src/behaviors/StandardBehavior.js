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

  data () {
    return {
      selected: null
    }
  },

  render () {
    // no rendering
    return null
  },

  watch: {
    'nodes.clickedText': function (node) {
      node && this.actions.setSelected(node.data)
    },

    'nodes.clickedNode': function (node) {
      node && this.actions.toggleExpandCollapse(node)
    }
  }
}
