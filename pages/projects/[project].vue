<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
const project = route.params.project as string;

const { data: files, refresh: getFiles } = await useFetchy(
  `/api/projects/${project}`
);

const url = ref("");
const scrapeHandler = async () => {
  await useFetchy(`/api/projects/${project}/scrape`, {
    method: "POST",
    body: { url: url.value },
    suppress: false,
  });
  await getFiles();
  url.value = "";
};

const term = ref("");
let searchResults = ref<string[][]>([]);
const searchHandler = async () => {
  const ret = await useFetchy(`/api/projects/${project}/search`, {
    method: "POST",
    body: { term: term.value },
    suppress: false,
  });
  searchResults.value = ret.data.value;
  term.value = "";
};
</script>

<template>
  <nuxt-link to="/">Back to home</nuxt-link>
  <h1>{{ project }}</h1>
  <FileTree v-if="files" :files />

  <section>
    <h2>Scrape a page</h2>
    <form @submit.prevent="scrapeHandler">
      <FloatLabel>
        <InputText id="url" type="url" v-model="url" required />
        <label for="url">URL</label>
      </FloatLabel>
      <Button type="submit">Scrape</Button>
    </form>
  </section>

  <section>
    <h2>Search for a term</h2>
    <form @submit.prevent="searchHandler">
      <FloatLabel>
        <InputText id="term" v-model="term" required />
        <label for="term">Term</label>
      </FloatLabel>
      <Button type="submit">Search</Button>
    </form>
    <ul>
      <li v-for="(list, i) in searchResults" :key="i" class="result">
        <ul>
          <li v-for="(item, j) in list" :key="j">{{ item }}</li>
        </ul>
      </li>
    </ul>
  </section>
</template>

<style scoped>
form {
  display: flex;
  gap: 1rem;
}

.result {
  margin-bottom: 1em;
}
</style>
