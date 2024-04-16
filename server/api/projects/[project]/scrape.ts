import { downloadUrl } from "@/server/project/manager";

export default defineEventHandler(async (event) => {
  const { project } = event.context.params!;
  const { url, pattern, wait, depth, excludeCurrentUrl } = await readBody(
    event
  );
  return await downloadUrl(project, url, {
    followPattern: pattern,
    wait,
    maxDepth: depth,
    excludeCurrentUrl,
  });
});
