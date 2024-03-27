import { createProject } from "../project/manager";

export default defineEventHandler(async (event) => {
  const { name } = await readBody(event);
  return await createProject(name);
});
