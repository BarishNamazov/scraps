import fs from "fs";
import path from "path";
import readdir from "~/server/util/readdir";
import { fileURLToPath } from "url";
import { getPageSource, urlToFileName } from "~/utils";
import {
  searchSource,
  getNodesWithSimilarCSSPath,
  searchCssPaths,
  getAllLinks,
} from "./scraper";

const projectsDir = process.env.PROJECTS_DIRECTORY as string;
// const;

if (!fs.existsSync(projectsDir)) {
  throw new Error(`Projects directory does not exist!`);
}

export const getProjects = async () => {
  const { files } = await readdir(projectsDir, { recursive: false });
  return files;
};

export const createProject = async (name: string) => {
  if (!name.match(/^[a-z0-9-]+$/)) {
    throw createError({
      message: "Invalid project name.",
      status: 401,
    });
  }

  const projectDir = path.join(projectsDir, name);
  if (fs.existsSync(projectDir)) {
    throw createError({
      message: "Project already exists.",
      status: 401,
    });
  }

  const templateDir = path.join(
    fileURLToPath(import.meta.url),
    "../../../template"
  );

  await fs.promises.mkdir(projectDir);
  await fs.promises.cp(templateDir, projectDir, { recursive: true });

  return { message: "Project created successfully." };
};

const assertProject = (name: string) => {
  const projectDir = path.join(projectsDir, name);
  if (!fs.existsSync(projectDir)) {
    throw createError({
      message: "Project does not exist.",
      status: 401,
    });
  }
};

export const getProjectFiles = async (name: string) => {
  assertProject(name);

  const projectDir = path.join(projectsDir, name);
  const { files, excluded } = await readdir(projectDir, { recursive: true });
  files.push(...excluded);
  return files;
};

export const downloadUrl = async (
  project: string,
  url: string,
  options: {
    followPattern?: string;
    excludeCurrentUrl?: boolean;
    wait: number;
    maxDepth: number;
  } = { maxDepth: 1, wait: 100 }
) => {
  assertProject(project);

  const projectDir = path.join(projectsDir, project);
  const followPattern = options?.followPattern;
  const excludeCurrentUrl = options?.excludeCurrentUrl ?? false;
  const wait = options?.wait;
  const maxDepth = options?.maxDepth;

  const queue = [url];
  const writePromises = [];
  const errors = [];
  let depth = 0;

  while (queue.length) {
    const currentUrl = queue.shift() as string;

    let src: string;

    try {
      src = await getPageSource(currentUrl);
      if (wait) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    } catch (error) {
      errors.push(currentUrl);
      continue;
    }

    // Find matching patterns in the source using regex and add them to the queue
    if (followPattern) {
      queue.push(...getAllLinks(src, currentUrl, followPattern));
    }

    if (excludeCurrentUrl && currentUrl === url) {
      continue;
    }

    const file = urlToFileName(currentUrl) + ".html";
    const filePath = path.join(projectDir, "sandbox", file);
    writePromises.push(fs.promises.writeFile(filePath, src));

    depth++;
    if (depth >= maxDepth) {
      break;
    }
  }

  await Promise.all(writePromises);

  return { message: "URL scraped successfully.", errors };
};

export const getSearchResults = async (project: string, text: string) => {
  assertProject(project);

  const projectDir = path.join(projectsDir, project);
  const sandboxDir = path.join(projectDir, "sandbox");

  const { files } = await readdir(sandboxDir, { recursive: false });
  const srcs = await Promise.all(
    files.map((file) =>
      fs.promises.readFile(path.join(sandboxDir, file), "utf-8")
    )
  );

  const cssPaths = new Set(srcs.flatMap((src) => searchCssPaths(src, text)));

  const results = [];

  for (const cssPath of cssPaths) {
    const nodes = [];
    for (const src of srcs) {
      const similarNodes = getNodesWithSimilarCSSPath(src, cssPath).map(
        (node) => node.textContent ?? ""
      );
      nodes.push(...similarNodes);
    }
    results.push({ nodes, cssPath });
  }

  return results;
};
