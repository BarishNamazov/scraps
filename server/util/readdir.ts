import fs from "fs";
import path from "path";

/**
 * Recursively read a directory and return a list of files and directories.
 * @param dir The directory to read.
 * @param options Options for reading the directory.
 * @param options.recursive Whether to read the directory recursively.
 * @param options.exclude A list of files or directories to exclude.
 * @returns A list of files and directories, and a list of excluded files and directories.
 */
export default async function readdir(
  dir: string,
  options?: { recursive?: boolean; exclude?: string[] }
) {
  if (!options) {
    options = { recursive: false, exclude: [] };
  }

  options.recursive = options.recursive ?? false;
  options.exclude = options.exclude ?? [];

  let fileList: string[] = [];
  let excluded: string[] = [];

  async function walk(dir: string) {
    const files = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.name === ".gitkeep") {
        continue;
      }
      if (options?.exclude?.includes(file.name)) {
        excluded.push(fullPath);
        continue;
      }
      fileList.push(fullPath);
      if (options?.recursive && file.isDirectory()) {
        await walk(fullPath);
      }
    }
  }

  await walk(dir);

  const dirNormalized = dir.endsWith(path.sep) ? dir : dir + path.sep;
  const normalize = (file: string) => file.replace(dirNormalized, "");

  return {
    files: fileList.map(normalize),
    excluded: excluded.map(normalize),
  };
}
