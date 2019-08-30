/**
 * Render-less component providing the collapse on click behavior.
 * Designed to be used as a behavior slot of tree component.
 */
import behaviorMixin from './behaviorMixin'

export default {
  name: 'collapseOnClick',
  mixins: [behaviorMixin],

  created () {
    const {on, actions: {toggleExpandCollapse}} = this

    on('clickedNode', ({element}) => {
      toggleExpandCollapse(element)
    })
  }
}
