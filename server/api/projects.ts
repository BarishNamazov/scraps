import { getProjects } from "../project/manager";

export default defineEventHandler(async (_event) => {
  return await getProjects();
});
