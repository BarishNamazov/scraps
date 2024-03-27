import { downloadUrl } from "@/server/project/manager";

export default defineEventHandler(async (event) => {
  const { project } = event.context.params!;
  const { url } = await readBody(event);
  return await downloadUrl(project, url);
});
