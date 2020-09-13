import { existsSync, rmdirSync } from "fs";

if (existsSync("../js_compiled/"))
  rmdirSync("../js_compiled/", { recursive: true });

if (existsSync("../dist/"))
  rmdirSync("../dist/", { recursive: true });
