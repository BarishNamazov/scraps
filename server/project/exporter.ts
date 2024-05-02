import { assertProject, projectsDir } from "./manager";
import path from "path";
import fs from "fs";
import readdir from "../util/readdir";
import { collectUsingCssPath } from "./scraper";
import { stringify, parse } from "csv/sync";

type Export = Record<string, string>[];

export const getExport = async (project: string, name = "export.csv") => {
  assertProject(project);
  const projectDir = path.join(projectsDir, project);
  const exportDir = path.join(projectDir, "exports");
  const exportPath = path.join(exportDir, name);

  let exported: Export = [];
  if (!fs.existsSync(exportPath)) {
    fs.writeFileSync(exportPath, "");
  } else {
    exported = parse(fs.readFileSync(exportPath, "utf-8"), { columns: true });
  }

  return exported;
};

export const writeExport = async (
  project: string,
  data: Export,
  name = "export.csv"
) => {
  assertProject(project);
  const projectDir = path.join(projectsDir, project);
  const exportDir = path.join(projectDir, "exports");
  const exportPath = path.join(exportDir, name);

  const stringified = stringify(data, { header: true });

  fs.writeFileSync(exportPath, stringified);
};

export const createProperty = async (
  project: string,
  name: string,
  cssPath: string
) => {
  assertProject(project);

  const projectDir = path.join(projectsDir, project);
  const sandboxDir = path.join(projectDir, "sandbox");

  const { files } = await readdir(sandboxDir, { recursive: false });
  const srcs = await Promise.all(
    files.map((file) =>
      fs.promises.readFile(path.join(sandboxDir, file), "utf-8")
    )
  );

  const values = collectUsingCssPath(srcs, cssPath);

  let exported = await getExport(project);
  if (exported.length === 0) {
    exported = values.map((value) => ({ [name]: value }));
  } else {
    exported.forEach((obj, i) => {
      obj[name] = values[i];
    });
  }

  await writeExport(project, exported);

  return { message: "Property created successfully." };
};
