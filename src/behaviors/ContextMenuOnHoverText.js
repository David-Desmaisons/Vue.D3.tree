/**
 * Render-less component providing the context on hover text behavior.
 * Designed to be used as a behavior slot of tree component.
 */
import behaviorMixin from './behaviorMixin'

export default {
  name: 'menuOnTextHover',
  mixins: [behaviorMixin],

  created () {
    const {on, actions: {setContextMenu, resetContextMenu}} = this

    on('mouseOverText', (context) => {
      setContextMenu(context)
    })

    on('mouseLeaveText', () => {
      resetContextMenu()
    })
  }
}
