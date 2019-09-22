/**
 * Render-less component providing the context on click text behavior.
 * Designed to be used as a behavior slot of tree component.
 */
import behaviorMixin from './behaviorMixin'

export default {
  name: 'menuOnTextClick',
  mixins: [behaviorMixin],

  created () {
    const {on, actions: {setContextMenu}} = this

    on('clickedText', (context) => {
      setContextMenu(context)
    })
  }
}
