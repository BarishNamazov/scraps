import { getProjectFiles } from "@/server/project/manager";

export default defineEventHandler(async (event) => {
  const { project } = event.context.params!;
  return await getProjectFiles(project);
});
