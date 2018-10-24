"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const file = require("fs");
function readObjectFromFileSync(path) {
    let objString = file.readFileSync(path, { encoding: "utf8" });
}
exports.readObjectFromFileSync = readObjectFromFileSync;
/*
export function readObjectFromFile<T>(path: string | number | Buffer | URL, handler)
{
    file.readFile(path, { encoding: "utf8" }, (err, data: string) =>
    {
        if (err)
            console.error('failed to read');
        else
            console.log(data);
    });
}
*/
function fileExample() {
    const fileName = "settings.json";
    let sett = {
        autosave: true,
        dafults: [1, 2, 100]
    };
    file.writeFile(fileName, JSON.stringify(sett), (err) => { if (err)
        console.error("error writing data"); });
    sleep(10000);
    file.readFile(fileName, { encoding: "utf8" }, (err, data) => {
        if (err)
            console.error('failed to read');
        else
            console.log(data);
    });
}
exports.fileExample = fileExample;
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        yield _sleep(ms);
    });
}
exports.sleep = sleep;
function _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=Purify.js.map