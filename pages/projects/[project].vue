<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
const project = route.params.project as string;

const { data: files, refresh: getFiles } = await useFetchy(
  `/api/projects/${project}`
);

const url = ref(""),
  pattern = ref(""),
  wait = ref(100),
  depth = ref(10),
  excludeCurrentUrl = ref(false),
  paginationBaseUrl = ref(""),
  pages = ref("");

const errors = ref<string[]>([]);
const scrapeHandler = async () => {
  errors.value = [];
  const ret = await useFetchy(`/api/projects/${project}/scrape`, {
    method: "POST",
    body: {
      url: url.value,
      pattern: pattern.value,
      wait: wait.value,
      depth: depth.value,
      excludeCurrentUrl: excludeCurrentUrl.value,
    },
    suppress: false,
  });
  errors.value = ret.data.value.errors;
  await getFiles();
  url.value = "";
};

const term = ref("");

const search = await useFetchy(`/api/projects/${project}/search`, {
  method: "POST",
  body: { term },
  suppress: true,
  immediate: false,
  watch: false,
});

const results = ref<{ nodes: string[]; cssPath: string }[]>([]);

const searchHandler = async () => {
  await search.refresh();
  results.value = search.data.value;
  term.value = "";
};

const paginationHandler = async () => {
  const page_ranges = pages.value.split(",");
  for (const page_range of page_ranges) {
    const start = Number(page_range.split("-")[0]);
    const end = Number(page_range.split("-")[page_range.split("-").length-1]);
    for (let i = start; i<=end; i++) {
      await useFetchy(`/api/projects/${project}/scrape`, {
        method: "POST",
        body: {
          url: paginationBaseUrl.value + i.toString(),
        },
        suppress: false,
      });
    }
  }
  await getFiles();
  paginationBaseUrl.value = "";
  pages.value = "";
}
</script>

<template>
  <nuxt-link to="/">Back to home</nuxt-link>
  <h1>{{ project }}</h1>
  <FileTree v-if="files" :files />

  <section>
    <h2>Scrape a page</h2>
    <form @submit.prevent="scrapeHandler" class="scrape">
      <FloatLabel>
        <InputText id="url" type="url" v-model="url" required />
        <label for="url">URL</label>
      </FloatLabel>

      <Panel toggleable :collapsed="true" header="Advanced Options">
        <div class="panel">
          <FloatLabel>
            <InputText id="pattern" type="text" v-model="pattern" />
            <label for="pattern">Pattern</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="wait" type="text" v-model="wait" />
            <label for="wait">Duration between scrapes (ms)</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="depth" type="text" v-model="depth" />
            <label for="depth">Maximum number of URLs to scrape</label>
          </FloatLabel>

          <label>
            <Checkbox v-model="excludeCurrentUrl" :binary="true" />
            Exclude the typed URL from the scrape results
          </label>
        </div>
      </Panel>
      <Button type="submit">Scrape</Button>
    </form>
    <p v-if="errors.length">
      These links could not be downloaded: {{ errors.join(", ") }}
    </p>
  </section>

  <section>
    <h2>Pagination</h2>
    <form @submit.prevent="paginationHandler">
      <div class="panel">
        <FloatLabel>
          <InputText id="pagination_pattern" type="url" v-model="paginationBaseUrl" placeholder="https://thetech.com/news/page/" required />
          <label for="pagination_pattern">Base URL</label>
        </FloatLabel>
        <FloatLabel>
          <InputText id="pages" type="text" v-model="pages" placeholder="e.g. 1-5, 8" />
          <label for="pages">Pages</label>
        </FloatLabel>
      </div>
      <Button type="submit">Scrape Pages</Button>
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

    <div v-if="results" v-for="thing in results" :key="thing.cssPath">
      <h3>{{ thing.cssPath }}</h3>
      <ol>
        <li v-for="node in thing.nodes" :key="node">
          {{ node }}
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  > * {
    width: fit-content;
  }
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 0.5rem;
}
.result {
  margin-bottom: 1em;
}

#pagination_pattern, #pages {
  min-width: 275px;
}
</style>
