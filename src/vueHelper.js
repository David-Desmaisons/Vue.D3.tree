import Vue from 'vue'

function renderInVueContext ({scope, props}) {
  const nodes = scope(props)
  const component = new Vue({
    render: h => h('div', nodes)
  })
  return component.$mount().$el.innerHTML
}

export {
  renderInVueContext
}
