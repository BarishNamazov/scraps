import { assertProject, projectsDir } from "./manager";
import path from "path";
import fs from "fs";
import readdir from "../util/readdir";
import { collectUsingCssPath } from "./scraper";
import { stringify, parse } from "csv/sync";

type Export = Record<string, string[]>;

export const getExport = async (project: string, name = "export.csv") => {
  assertProject(project);
  const projectDir = path.join(projectsDir, project);
  const exportDir = path.join(projectDir, "exports");
  const exportPath = path.join(exportDir, name);

  let exported: Export = {};
  if (!fs.existsSync(exportPath)) {
    fs.writeFileSync(exportPath, "");
  } else {
    exported = parse(fs.readFileSync(exportPath, "utf-8"), { columns: true });
  }

  return exported;
};

export const writeExport = async (
  project: string,
  data: Record<string, string[]>,
  name = "export.csv"
) => {
  assertProject(project);
  const projectDir = path.join(projectsDir, project);
  const exportDir = path.join(projectDir, "exports");
  const exportPath = path.join(exportDir, name);

  const records = Object.entries(data).map(([name, values]) => ({
    name,
    values,
  }));
  const stringified = stringify(records, { header: true });

  fs.writeFileSync(exportPath, stringified);
};

export const createProperty = async (
  project: string,
  name: string,
  cssPath: string
) => {
  assertProject(project);
  if (!name.match(/^[\w,\s-]+\.[A-Za-z]{3}$/)) {
    throw createError({
      message: "Invalid property name.",
      status: 401,
    });
  }

  const projectDir = path.join(projectsDir, project);
  const sandboxDir = path.join(projectDir, "sandbox");

  const { files } = await readdir(sandboxDir, { recursive: false });
  const srcs = await Promise.all(
    files.map((file) =>
      fs.promises.readFile(path.join(sandboxDir, file), "utf-8")
    )
  );

  const values = await collectUsingCssPath(srcs, cssPath);

  const exported = await getExport(project);
  exported[name] = values;

  const records = values.map((value) => ({ name: value }));
  await writeExport(project, exported);

  return { message: "Property created successfully." };
};
