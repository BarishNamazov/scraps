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
const lastFilename = ref("");

type StringDictionary = {
  similarNodes?: string[][];
  similarCSSPathNodes?: Array<Record<string, string[]>>;
};
let searchResults = ref<StringDictionary>({});

const searchHandler = async () => {
  const ret = await useFetchy(`/api/projects/${project}/search`, {
    method: "POST",
    body: { term: term.value },
    suppress: false,
  });
  searchResults.value = ret.data.value;
  lastFilename.value = Object.keys(searchResults.value)[
    Object.keys(searchResults.value).length - 1
  ];
  term.value = "";
};

function isEmptyObject(obj: any) {
  return typeof obj === "object" && Object.keys(obj).length === 0;
}
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
    <br />
    <div v-for="(nodes, filename) in searchResults" :key="filename">
      <b>{{ filename }}</b>
      <p v-if="isEmptyObject(nodes)">No nodes found.</p>
      <ul
        v-for="(lists, similarNodeOrCSSPath) in nodes"
        :key="similarNodeOrCSSPath"
      >
        {{
          similarNodeOrCSSPath
        }}:
        <li v-for="(list, j) in lists" :key="j">
          <ul>
            <li v-for="(item, k) in list" :key="k">
              <div
                v-if="String(similarNodeOrCSSPath) === 'similarCSSPathNodes'"
              >
                {{ k }}
                <ul>
                  <li v-for="(text, m) in item" :key="m">{{ text }}</li>
                </ul>
              </div>
              <div v-else>
                {{ item }}
              </div>
            </li>
          </ul>
        </li>
      </ul>
      <hr v-if="filename !== lastFilename" />
    </div>
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
