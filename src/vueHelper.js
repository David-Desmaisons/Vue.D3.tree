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

export {
  renderInVueContext
}
