import { getSearchResults } from "@/server/project/manager";

export default defineEventHandler(async (event) => {
  const { project } = event.context.params!;
  const { term } = await readBody(event);
  return await getSearchResults(project, term);
});
