<script setup lang="ts">
const { data: projects, refresh: getProjects } = await useFetchy(
  "/api/projects"
);

const handleCreateProject = async (event: Event) => {
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form as HTMLFormElement);
  const name = formData.get("name") as string;
  await useFetchy("/api/projects", {
    method: "POST",
    body: { name },
    suppress: false,
  });
  form.reset();
  await getProjects();
};
</script>

<template>
  <h1>Welcome to Scraps!</h1>

  <section>
    <h2>Create a new project</h2>
    <form @submit.prevent="handleCreateProject">
      <InputText type="text" placeholder="Project name" name="name" required />
      <Button type="submit">Create</Button>
    </form>
  </section>

  <section v-if="projects">
    <h2>Your projects</h2>
    <ul v-if="projects.length">
      <li v-for="project in projects" :key="project">
        <nuxt-link :to="`/projects/${project}`">{{ project }}</nuxt-link>
      </li>
    </ul>
  </section>
</template>

<style scoped>
form {
  display: flex;
  gap: 1rem;
}
</style>
