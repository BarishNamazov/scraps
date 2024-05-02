import { createProperty } from "@/server/project/exporter";

export default defineEventHandler(async (event) => {
  const { project } = event.context.params!;
  const { name, cssPath } = await readBody(event);
  return await createProperty(project, name, cssPath);
});
