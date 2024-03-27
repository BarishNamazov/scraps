import fs from "fs";
import path from "path";
import { exec, execSync, spawn, ChildProcess } from "child_process";
import readdir from "~/server/util/readdir";
import { fileURLToPath } from "url";
import { getPageSource, urlToFileName } from "~/utils";
import { searchSource } from "./scraper";

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

export const downloadUrl = async (project: string, url: string) => {
  assertProject(project);

  const projectDir = path.join(projectsDir, project);
  let src: string;

  try {
    src = await getPageSource(url);
  } catch (error) {
    throw createError({
      message: "Failed to fetch URL.",
      status: 401,
    });
  }

  const file = urlToFileName(url) + ".html";
  const filePath = path.join(projectDir, "sandbox", file);

  await fs.promises.writeFile(filePath, src);
  return { message: "URL scraped successfully." };
};

export const getSearchResults = async (project: string, text: string) => {
  assertProject(project);

  const projectDir = path.join(projectsDir, project);
  const sandboxDir = path.join(projectDir, "sandbox");

  const { files } = await readdir(sandboxDir, { recursive: false });

  const results = [];
  for (const file of files) {
    const filePath = path.join(sandboxDir, file);
    const src = await fs.promises.readFile(filePath, "utf-8");
    results.push(...searchSource(src, text));
  }

  return results;
};
