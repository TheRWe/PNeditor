import { lstatSync, readdirSync, copyFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const filesToCopyRegex = /.*(\.html|\.css)/;

const copyRecrusivePreservingFolders = (from: string, to: string, fileReg: RegExp) => {
  if (lstatSync(from).isFile()) {
  if (fileReg.test(from))
    copyFileSync(from, to)
    ;
  return;
  }

  if (!existsSync(to))
  mkdirSync(to)
    ;

  readdirSync(from)
  .forEach(x => copyRecrusivePreservingFolders(join(from, x), join(to, x), fileReg))
  ;
};

copyRecrusivePreservingFolders("../src/", "../js_compiled/", filesToCopyRegex);
