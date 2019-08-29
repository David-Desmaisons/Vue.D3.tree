/**
 * Render-less component providing the collapse on click behavior.
 *Can be used as a behavior slot of tree component.
 */
import behaviorMixin from './behaviorMixin'

export default {
  name: 'SelectOnTextClick',
  mixins: [behaviorMixin],

  created () {
    const {on, actions: {setSelected}} = this

    on('clickedText', ({element}) => {
      setSelected(element)
    })
  }
}
