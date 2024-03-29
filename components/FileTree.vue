<script setup lang="ts">
const { files } = defineProps<{
  files: string[];
}>();

const isDirectory = (file: string) => {
  return (files ?? []).some((f: string) => f.startsWith(file + "/"));
};

const getClass = (file: string) => {
  if (isDirectory(file) || ["exports", "sandbox", "cssPaths"].includes(file)) {
    return "directory";
  }
  if (file.endsWith(".json") || file === ".gitignore") {
    return "config";
  }
  return "";
};
</script>

<template>
  <ul>
    <li
      v-for="file in files"
      :key="file"
      :style="{ marginLeft: (file.split('/').length - 1) * 2 + 'em' }"
      :class="getClass(file)"
    >
      {{ file.split("/").pop() }}
    </li>
  </ul>
</template>

<style scoped>
ul {
  font-family: monospace;
  list-style: none;
  border: 2px solid #3b5bdb;
  border-radius: 0.5em;
  padding: 1em;

  li {
    margin-top: 0.5em;

    &::before {
      content: "📄";
      margin-right: 0.5em;
    }
    &.directory::before {
      content: "📁";
    }
    &.config::before {
      content: "⚙️";
    }
  }
}
</style>
