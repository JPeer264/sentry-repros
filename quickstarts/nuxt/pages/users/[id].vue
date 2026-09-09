<script setup>
const route = useRoute();
</script>

<template>
  <p>user <span id="user-id">{{ route.params.id }}</span></p>
</template>
