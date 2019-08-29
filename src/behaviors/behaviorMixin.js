/**
 * Render-less component providing the collapse on click behavior.
 *Can be used as a behavior slot of tree component.
 */
export default {
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

  render: () => null
}
