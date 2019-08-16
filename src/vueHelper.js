import Vue from 'vue'

function renderInVueContext ({scope, props}, onChange) {
  const component = new Vue({
    render: h => {
      const nodes = scope(props)
      return h('div', nodes)
    },
    mounted () {
      this.$once('hook:updated', onChange)
    }
  })
  return component.$mount().$el.innerHTML
}

function renderTemplateSlot (propsGetter, slot, fallBackComponent) {
  const component = new Vue({
    render (h) {
      const props = propsGetter()
      if (slot) {
        const nodes = slot(props)
        return h('template', nodes)
      }
      return h(fallBackComponent, { props }, [])
    }
  })
  component.$mount()
  return component
}

export {
  renderInVueContext,
  renderTemplateSlot
}
