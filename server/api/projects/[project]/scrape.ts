import { downloadUrl } from "@/server/project/manager";

export default defineEventHandler(async (event) => {
  const { project } = event.context.params!;
  const { url, pages, pattern, wait, depth, excludeCurrentUrl } = await readBody(
    event
  );
  return await downloadUrl(project, url, {
    followPattern: pattern,
    pages: pages,
    wait,
    maxDepth: depth,
    excludeCurrentUrl,
  });
});
