<template>
     <div class="panel panel-default">
        <div class="panel-heading">Events</div>

        <div class="panel-body log">
          <div v-for="event in events">
            <p><b>Name:</b> {{event.eventName}} <b>Data:</b>{{event.data.text}}</p>
          </div>
        </div>
    </div>
</template>
<script>
export default {
  props: {
    events: {
      type: Array,
      required: true
    }
  }
}
</script>

<style>
</style>