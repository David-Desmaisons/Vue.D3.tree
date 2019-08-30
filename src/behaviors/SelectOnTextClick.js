/**
 * Render-less component providing select on text click behavior.
 * Designed to be used as a behavior slot of tree component.
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
