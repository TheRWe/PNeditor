import { existsSync, rmdirSync } from "fs";

if (existsSync("../js_compiled/"))
  rmdirSync("../js_compiled/", { recursive: true });
