<script setup lang="ts">
import "primevue/resources/themes/aura-light-green/theme.css";

useHead({
  title: "Scraps",
  meta: [
    {
      name: "description",
      content: "Scraping the web is easy now!",
    },
  ],
});
</script>

<template>
  <Toast />
  <NuxtLoadingIndicator />
  <NuxtPage />
</template>
