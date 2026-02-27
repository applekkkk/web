<template>
  <section class="panel">
    <header v-if="title">{{ title }}</header>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ""
  }
});
</script>

<style scoped>
.panel {
  border: 1px solid #dde5f2;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
}

header {
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
}
</style>
