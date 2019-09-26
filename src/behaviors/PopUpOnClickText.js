/**
 * Render-less component providing the context on click text behavior.
 * Designed to be used as a behavior slot of tree component.
 */
import behaviorMixin from './behaviorMixin'

export default {
  name: 'PopUpOnTextClick',
  mixins: [behaviorMixin],

  created () {
    const {on, actions: {setPopUp, resetPopUp}} = this

    on('clickedText', (context) => {
      setPopUp(context)
    })

    on('clickOutside', () => {
      resetPopUp()
    })
  }
}
