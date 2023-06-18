<script setup>
const route = useRoute()

const { user } = route.params
</script>

<template>
  <section>
    <h1>This is the user route: {{ user }}</h1>
  </section>
</template>
